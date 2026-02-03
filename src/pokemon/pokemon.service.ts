import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma.service'; // Asegúrate de importar esto

@Injectable()
export class PokemonService {
  // Inyectamos la conexión a la base de datos
  constructor(private prisma: PrismaService) {}
  
  // Método para crear (lo dejaremos pendiente)
  create(createPokemonDto: any) {
    return 'This action adds a new pokemon';
  }

  // ¡AQUÍ ESTÁ LA MAGIA! 
  async findAll(limit: number = 20, offset: number = 0) {
    // Inyectamos el límite y el offset en la URL de la PokéAPI 🎯
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    
    const pokemonList = data.results.map((pokemon) => {
      const segments = pokemon.url.split('/');
      const id = segments[segments.length - 2];
      
      return {
        id: Number(id),
        name: pokemon.name,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    });

    return pokemonList; 
  }

  // 🔍 Búsqueda Parcial (Fuzzy Search)
  async searchByName(term: string) {
    // 1. Pedimos la lista COMPLETA (solo nombres y urls, es liviano)
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=10000`);
    
    // 2. Filtramos en memoria (Javascript es muy rápido para esto)
    const filtered = data.results.filter((p: any) => 
      p.name.includes(term.toLowerCase())
    );

    // 3. Tomamos solo los primeros 20 resultados para no saturar la pantalla
    const topResults = filtered.slice(0, 20);

    // 4. Mapeamos para obtener la imagen (extraemos ID de la URL)
    return topResults.map((pokemon: any) => {
      const segments = pokemon.url.split('/');
      const id = segments[segments.length - 2];
      return {
        id: Number(id),
        name: pokemon.name,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    });
  }

  async findOne(term: string) {
    const termStr = term.toString().toLowerCase();

    // 1. Buscamos Pokémon y Especie en paralelo
    const [pokemonRes, speciesRes] = await Promise.all([
      axios.get(`https://pokeapi.co/api/v2/pokemon/${termStr}`),
      axios.get(`https://pokeapi.co/api/v2/pokemon-species/${termStr}`),
    ]);

    const data = pokemonRes.data;
    const species = speciesRes.data;

    // 2. EXTRAER ID DE LA CADENA EVOLUTIVA (Viene dentro de 'species')
    // La URL se ve así: "https://pokeapi.co/api/v2/evolution-chain/1/"
    const evolutionChainUrl = species.evolution_chain.url;
    
    // 3. Pedimos la Cadena Evolutiva
    const { data: evoData } = await axios.get(evolutionChainUrl);
    
    // 4. Lógica Recursiva para aplanar el árbol 🌳 -> 📏
    const evolutions: any[] = [];
    let current = evoData.chain;

    // Recorremos el árbol (while loop sencillo para líneas directas)
    // Nota: Esto funciona perfecto para líneas directas (Charmander). 
    // Para Eevee mostrará solo una rama, pero para empezar es ideal.
    do {
        const evoId = current.species.url.split('/').slice(-2, -1)[0];
        evolutions.push({
            id: +evoId,
            name: current.species.name,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evoId}.png`
        });
        current = current.evolves_to[0]; // Pasamos al siguiente eslabón
    } while (current);


    // 5. Procesamos descripciones (Igual que antes)
    const descriptions: any = {};
    species.flavor_text_entries.forEach((entry: any) => {
      const lang = entry.language.name;
      if (['es', 'en', 'de'].includes(lang)) {
        descriptions[lang] = entry.flavor_text.replace(/[\n\f]/g, ' '); 
      }
    });

    return {
      id: data.id,
      name: data.name,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`,
      types: data.types.map((t: any) => t.type.name),
      cry: data.cries.latest,
      stats: data.stats.map((s: any) => ({
        name: s.stat.name,
        value: s.base_stat,
      })),
      descriptions: descriptions,
      evolutions: evolutions, // 🧬 ¡Dato Nuevo!
    };
  }

  update(id: number, updatePokemonDto: any) {
    return `This action updates a #${id} pokemon`;
  }

  remove(id: number) {
    return `This action removes a #${id} pokemon`;
  }

  // Acción de Toggle (Poner/Quitar favorito)
  async toggleFavorite(id: number) {
    const userId = 1; // Usamos nuestro usuario "hardcodeado" por ahora

    // 1. Verificar si el Pokémon ya existe en nuestra tabla local 'Pokemon'
    // Si no existe, lo creamos (para tener su nombre guardado)
    const pokemonExists = await this.prisma.pokemon.findUnique({
      where: { id },
    });

    if (!pokemonExists) {
      // Obtenemos el nombre rápido de la API para guardarlo
      const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
      await this.prisma.pokemon.create({
        data: {
          id: id,
          name: data.name,
          spriteUrl: data.sprites.front_default,
        },
      });
    }

    // 2. Verificar si el usuario YA le dio like
    const isFavorite = await this.prisma.user.findFirst({
      where: {
        id: userId,
        favorites: { some: { id } }, // ¿Tiene este pokemon en sus favoritos?
      },
    });

    if (isFavorite) {
      // Si ya es favorito, lo QUITAMOS (Disconnect)
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          favorites: { disconnect: { id } },
        },
      });
      return { message: 'Eliminado de favoritos', isFavorite: false };
    } else {
      // Si no es favorito, lo AGREGAMOS (Connect)
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          favorites: { connect: { id } },
        },
      });
      return { message: 'Agregado a favoritos', isFavorite: true };
    }
  }

  // Buscar Pokémon por tipo (ej: fire, water)
  async findByType(typeName: string) {
    // 1. Pedimos a la API todos los del tipo X
    const { data } = await axios.get(`https://pokeapi.co/api/v2/type/${typeName.toLowerCase()}`);
    
    // 2. La estructura aquí es diferente: data.pokemon es un array de objetos
    // que tienen una propiedad "pokemon" adentro. ¡Qué lío! 😵‍💫
    // Vamos a limpiarlo:
    const pokemonList = data.pokemon.map((entry: any) => {
      const pokemon = entry.pokemon;
      const segments = pokemon.url.split('/');
      const id = segments[segments.length - 2];

      return {
        id: Number(id),
        name: pokemon.name,
        // Usamos la misma lógica de imagen que en findAll
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    });

    return pokemonList;
  }

  // Obtener solo los favoritos del usuario
  // Obtener solo los favoritos del usuario
  async getFavorites() {
    const userId = 1; 
    
    const userWithFavorites = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        favorites: {
          orderBy: { id: 'asc' } 
        } 
      }, 
    });

    // 🛡️ AQUÍ ESTÁ EL ARREGLO:
    // Si por alguna razón el usuario no existe, devolvemos un array vacío para no romper nada.
    if (!userWithFavorites) {
      return [];
    }

    return userWithFavorites.favorites.map(poke => ({
      id: poke.id,
      name: poke.name,
      image: poke.spriteUrl 
    }));
  }
  // 🧠 IA: Sistema de Recomendación basado en KNN (Vecinos más cercanos)
  async getRecommendations(id: number) {
    // 1. Obtenemos al Pokémon Original (El "Target")
    const original = await this.findOne(id.toString());
    
    // 2. Buscamos otros de su mismo tipo (para que la recomendación tenga sentido)
    // Usamos el primer tipo del array (ej: 'fire')
    const type = original.types[0];
    const { data } = await axios.get(`https://pokeapi.co/api/v2/type/${type}`);
    
    // 3. Seleccionamos una muestra de candidatos (No todos, para no saturar la API)
    // Tomamos 8 candidatos al azar del mismo tipo
    const candidates = data.pokemon
      .map((p: any) => p.pokemon.name)
      .filter((name: string) => name !== original.name) // Que no sea él mismo
      .sort(() => 0.5 - Math.random()) // Barajar
      .slice(0, 8); // Tomar 8

    // 4. Obtenemos los STATS de esos 8 candidatos (en paralelo 🏎️)
    const candidatesData = await Promise.all(
      candidates.map(async (name: string) => {
        const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`);
        return {
            name: data.name,
            id: data.id,
            image: data.sprites.other['official-artwork'].front_default,
            stats: data.stats.map((s: any) => s.base_stat) // Array simple: [80, 100, 50...]
        };
      })
    );

    // 5. 🧮 LA MATEMÁTICA: Calculamos Distancia Euclidiana
    const originalStats = original.stats.map(s => s.value); // [78, 84, 78...]

    const recommendations = candidatesData.map(candidate => {
      // Fórmula: Raíz de la suma de las diferencias al cuadrado
      let sumDiffSq = 0;
      for (let i = 0; i < 6; i++) {
        const diff = candidate.stats[i] - originalStats[i];
        sumDiffSq += diff * diff;
      }
      const distance = Math.sqrt(sumDiffSq);

      return { ...candidate, distance };
    })
    .sort((a, b) => a.distance - b.distance) // Ordenamos: menor distancia = más parecido
    .slice(0, 3); // Nos quedamos con el Top 3

    return recommendations;
  }
}