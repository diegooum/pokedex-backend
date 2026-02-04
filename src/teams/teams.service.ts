import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios'; // 👈 Necesitamos Axios para ir a buscar los que falten

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  // 1. CREAR EQUIPO (¡Ahora con Auto-Fetch!)
  async create(createTeamDto: CreateTeamDto, userId: string) {
    const { pokemons, name } = createTeamDto;

    // A. PASO PREVIO: Asegurar que todos los Pokémon existan en la BD local
    // Recorremos la lista de IDs solicitados (ej: [1, 4, 7])
    for (const id of pokemons) {
      
      // 1. ¿Existe en mi BD?
      const exists = await this.prisma.pokemon.findUnique({ where: { id } });

      // 2. Si NO existe, lo traemos de la PokeAPI y lo guardamos
      if (!exists) {
        try {
          const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
          
          await this.prisma.pokemon.create({
            data: {
              id: data.id,
              name: data.name,
              image: data.sprites.front_default,
              types: data.types.map((t: any) => t.type.name),
              hp: data.stats[0].base_stat,
              attack: data.stats[1].base_stat,
              defense: data.stats[2].base_stat,
              spAttack: data.stats[3].base_stat,
              spDefense: data.stats[4].base_stat,
              speed: data.stats[5].base_stat,
            }
          });
          console.log(`Pokemon ${id} guardado localmente para el equipo.`);
        } catch (error) {
          console.log(`Error buscando pokemon ${id}:`, error.message);
          // Opcional: Si falla la API, podríamos lanzar error o ignorarlo
        }
      }
    }

    // B. AHORA SÍ: Creamos el equipo (Ya estamos seguros que todos existen)
    const pokemonsToConnect = pokemons.map((id) => ({ id }));

    return this.prisma.team.create({
      data: {
        name,
        userId,
        pokemons: {
          connect: pokemonsToConnect,
        },
      },
      include: {
        pokemons: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.team.findMany({
      where: { userId },
      include: {
        pokemons: {
          select: { id: true, name: true, image: true, types: true }
        }
      }
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.team.findUnique({
      where: { id }, 
      include: { pokemons: true }
    });
  }

  // ... (Tus otros métodos create, findAll, etc)

  // 4. ANÁLISIS DE EQUIPO (El "Brain" 🧠)
  async analyzeTeam(id: string, userId: string) {
    // 1. Buscamos el equipo con sus pokémon
    const team = await this.findOne(id, userId);

    if (!team) {
      throw new InternalServerErrorException('Equipo no encontrado');
    }

    const pokemons = team.pokemons;
    const totalMembers = pokemons.length;

    // 2. Calculamos Promedios de Stats
    // Usamos 'reduce' para sumar todo y luego dividimos
    const stats = {
      hp: Math.round(pokemons.reduce((acc, p) => acc + p.hp, 0) / totalMembers),
      attack: Math.round(pokemons.reduce((acc, p) => acc + p.attack, 0) / totalMembers),
      defense: Math.round(pokemons.reduce((acc, p) => acc + p.defense, 0) / totalMembers),
      spAttack: Math.round(pokemons.reduce((acc, p) => acc + p.spAttack, 0) / totalMembers),
      spDefense: Math.round(pokemons.reduce((acc, p) => acc + p.spDefense, 0) / totalMembers),
      speed: Math.round(pokemons.reduce((acc, p) => acc + p.speed, 0) / totalMembers),
    };

    // 3. Análisis de Tipos (Detectar desbalance)
    const typeCount: Record<string, number> = {};
    pokemons.forEach(p => {
      p.types.forEach(t => {
        typeCount[t] = (typeCount[t] || 0) + 1;
      });
    });

    // Detectar si hay más de 2 del mismo tipo
    const warnings: string[] = [];
    for (const [type, count] of Object.entries(typeCount)) {
      if (count > 2) {
        warnings.push(`⚠️ Cuidado: Tienes ${count} Pokémon de tipo ${type}. Eres vulnerable.`);
      }
    }

    // 4. Encontrar al "MVP" (El de mejores stats totales)
    const mvp = pokemons.reduce((prev, current) => {
      const prevTotal = prev.hp + prev.attack + prev.defense + prev.speed;
      const currTotal = current.hp + current.attack + current.defense + current.speed;
      return (prevTotal > currTotal) ? prev : current;
    });

    return {
      teamName: team.name,
      memberCount: totalMembers,
      averageStats: stats, // Para graficar en el Frontend
      typeDistribution: typeCount,
      warnings: warnings.length > 0 ? warnings : ['✅ Equipo balanceado en tipos'],
      mvp: {
        name: mvp.name,
        image: mvp.image,
        totalStats: mvp.hp + mvp.attack + mvp.defense + mvp.speed // Simple stat calc
      }
    };
  }

  update(id: number, updateTeamDto: UpdateTeamDto) { return `This action updates a #${id} team`; }
  remove(id: number) { return `This action removes a #${id} team`; }
}