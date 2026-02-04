import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { AuthGuard } from '@nestjs/passport'; // 👈 Importar el Guardia
import { GetUser } from '../auth/decorators/get-user.decorator'; // 👈 Importar nuestro decorador
import type { User } from '@prisma/client'; // 👈 Importar el tipo de usuario

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  // --- RUTAS PÚBLICAS (Cualquiera puede verlas) ---

  @Get()
  findAll(
    @Query('limit') limit: number,
    @Query('offset') offset: number
  ) {
    return this.pokemonService.findAll(limit, offset);
  }

  @Get('search')
  searchByName(@Query('term') term: string) {
    return this.pokemonService.searchByName(term);
  }

  @Get('type/:type')
  findByType(@Param('type') type: string) {
    return this.pokemonService.findByType(type);
  }

  // --- RUTAS PRIVADAS (Solo con Token) ---

  // 1. Obtener mis favoritos
  @Get('favorites')
  @UseGuards(AuthGuard('jwt')) // 🛡️ ¡ALTO! Solo pasa si tienes Token
  getFavorites(
    @GetUser() user: User // 🕵️‍♂️ Extraemos al usuario del token
  ) {
    return this.pokemonService.getFavorites(user.id); // Pasamos el ID real
  }

  // 2. Dar Like/Dislike
  @Post('favorite/:id')
  @UseGuards(AuthGuard('jwt')) // 🛡️ ¡ALTO!
  toggleFavorite(
    @Param('id') id: string,
    @GetUser() user: User // 🕵️‍♂️ Extraemos al usuario
  ) {
    return this.pokemonService.toggleFavorite(+id, user.id);
  }

  // 3. Recomendaciones (Las dejamos públicas o privadas? Hagámoslas públicas por ahora)
  @Get(':id/recommendations')
  getRecommendations(@Param('id') id: string) {
    return this.pokemonService.getRecommendations(+id);
  }

  // Ruta genérica para ver detalle (debe ir al final para no chocar)
  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.pokemonService.findOne(term);
  }
}