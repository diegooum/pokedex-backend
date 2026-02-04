import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PokemonService {
  
  constructor(private prisma: PrismaService) {}

  // --- MÉTODOS PÚBLICOS (API EXTERNA) ---

  async findAll(limit: number = 20, offset: number = 0) {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    
    return data.results.map((pokemon) => {
      const segments = pokemon.url.split('/');
      const id = segments[segments.length - 2];
      return {
        id: Number(id),
        name: pokemon.name,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    });
  }

  async searchByName(term: string) {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=10000`);
    
    const filtered = data.results.filter((p: any) => 
      p.name.includes(term.toLowerCase())
    );

    const topResults = filtered.slice(0, 20);

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

  // Reemplaza tu método findOne con este:
  async findOne(term: string) {
    const termStr = term.toString().toLowerCase();

    // 1. Buscamos el Pokémon base
    let pokemonData;
    try {
      const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${termStr}`);
      pokemonData = data;
    } catch (error) {
      throw new NotFoundException(`Pokemon ${term} no encontrado`);
    }

    // 2. Buscamos la Especie (Usando la URL exacta que nos dio la API, es más seguro)
    let speciesData;
    try {
        // pokemonData.species.url ya trae la dirección correcta
        const { data } = await axios.get(pokemonData.species.url);
        speciesData = data;
    } catch (error) {
        console.log("Error buscando especie:", error.message);
        speciesData = {}; // Evitamos que explote si falla
    }

    // 3. Procesamos Descripciones (Traducción) 🌍
    const descriptions: any = {};
    if (speciesData.flavor_text_entries) {
      speciesData.flavor_text_entries.forEach((entry: any) => {
        const lang = entry.language.name;
        // Filtramos solo los idiomas que nos interesan
        if (['es', 'en', 'de'].includes(lang)) {
            // Guardamos la descripción limpiando caracteres raros
            descriptions[lang] = entry.flavor_text.replace(/[\n\f]/g, ' '); 
        }
      });
    }

    // 4. Cadena Evolutiva 🧬
    const evolutions: any[] = [];
    if (speciesData.evolution_chain) {
        try {
            const { data: evoData } = await axios.get(speciesData.evolution_chain.url);
            let current = evoData.chain;
            
            // Recorremos el árbol
            while (current) {
                const speciesUrl = current.species.url;
                const segments = speciesUrl.split('/');
                const evoId = segments[segments.length - 2];

                evolutions.push({
                    id: Number(evoId),
                    name: current.species.name,
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evoId}.png`
                });

                current = current.evolves_to[0]; // Avanzamos
            }
        } catch (error) {
            console.log("Error buscando evoluciones:", error.message);
        }
    }

    // 5. Devolvemos todo junto
    return {
      id: pokemonData.id,
      name: pokemonData.name,
      image: pokemonData.sprites.other['official-artwork'].front_default,
      types: pokemonData.types.map((t: any) => t.type.name),
      cry: pokemonData.cries.latest,
      stats: pokemonData.stats.map((s: any) => ({
        name: s.stat.name,
        value: s.base_stat,
      })),
      descriptions: descriptions, // ✅ Aquí van los textos
      evolutions: evolutions,     // ✅ Aquí van las evoluciones
    };
  }

  async findByType(typeName: string) {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/type/${typeName.toLowerCase()}`);
    
    return data.pokemon.map((entry: any) => {
      const pokemon = entry.pokemon;
      const segments = pokemon.url.split('/');
      const id = segments[segments.length - 2];

      return {
        id: Number(id),
        name: pokemon.name,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    });
  }

  // --- MÉTODOS PRIVADOS / DE USUARIO (REQUIEREN AUTH) ---

  // 1. Toggle Favorito (Ahora recibe userId como String)
  async toggleFavorite(id: number, userId: string) {
    
    // A. Revisar si el Pokémon existe en BD local, si no, crearlo
    const pokemonExists = await this.prisma.pokemon.findUnique({
      where: { id },
    });

    if (!pokemonExists) {
      const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
      await this.prisma.pokemon.create({
        data: {
          id: id,
          name: data.name,
          image: data.sprites.front_default, // 👈 CORREGIDO: image
          types: data.types.map((t: any) => t.type.name),
          // Guardamos stats para futura IA
          hp: data.stats[0].base_stat,
          attack: data.stats[1].base_stat,
          defense: data.stats[2].base_stat,
          spAttack: data.stats[3].base_stat,
          spDefense: data.stats[4].base_stat,
          speed: data.stats[5].base_stat,
        },
      });
    }

    // B. Revisar el Usuario y sus favoritos
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { favorites: true } // 👈 IMPORTANTE: Traer la relación
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Verificar si ya lo tiene
    const isFavorite = user.favorites.some(p => p.id === id);

    if (isFavorite) {
      // Quitar
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          favorites: { disconnect: { id } },
        },
      });
      return { message: 'Eliminado de favoritos', isFavorite: false };
    } else {
      // Poner
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          favorites: { connect: { id } },
        },
      });
      return { message: 'Agregado a favoritos', isFavorite: true };
    }
  }

  // 2. Obtener Favoritos (Ahora recibe userId como String)
  async getFavorites(userId: string) {
    const userWithFavorites = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        favorites: {
          orderBy: { id: 'asc' } 
        } 
      }, 
    });

    if (!userWithFavorites) return [];

    return userWithFavorites.favorites.map(poke => ({
      id: poke.id,
      name: poke.name,
      image: poke.image // 👈 CORREGIDO: image
    }));
  }

  // --- IA Y RECOMENDACIONES ---

  async getRecommendations(id: number) {
    const original = await this.findOne(id.toString());
    const type = original.types[0];
    const { data } = await axios.get(`https://pokeapi.co/api/v2/type/${type}`);
    
    const candidates = data.pokemon
      .map((p: any) => p.pokemon.name)
      .filter((name: string) => name !== original.name)
      .sort(() => 0.5 - Math.random())
      .slice(0, 8);

    const candidatesData = await Promise.all(
      candidates.map(async (name: string) => {
        const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`);
        return {
            name: data.name,
            id: data.id,
            image: data.sprites.other['official-artwork'].front_default,
            stats: data.stats.map((s: any) => s.base_stat)
        };
      })
    );

    const originalStats = original.stats.map((s: any) => s.value);

    const recommendations = candidatesData.map(candidate => {
      let sumDiffSq = 0;
      for (let i = 0; i < 6; i++) {
        const diff = candidate.stats[i] - originalStats[i];
        sumDiffSq += diff * diff;
      }
      const distance = Math.sqrt(sumDiffSq);

      return { ...candidate, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

    return recommendations;
  }
}