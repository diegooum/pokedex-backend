import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { PrismaService } from '../prisma/prisma.service'; // 1. IMPORTAR ESTO

@Module({
  controllers: [PokemonController],
  providers: [
    PokemonService, 
    PrismaService // 2. AGREGAR ESTO AQUÍ
  ], 
})
export class PokemonModule {}