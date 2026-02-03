import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Post()
  create(@Body() createPokemonDto: CreatePokemonDto) {
    return this.pokemonService.create(createPokemonDto);
  }

  @Post('favorite/:id')
  toggleFavorite(@Param('id') id: string) {
    return this.pokemonService.toggleFavorite(+id);
  }

  @Get()
  findAll(@Query('limit') limit: string, @Query('offset') offset: string) {
    // Si no envían nada, usamos valores por defecto (20 pokémon, empezando del 0)
    return this.pokemonService.findAll(+limit || 20, +offset || 0);
  }

  @Get('favorites/all') // Ruta especial
  getFavorites() {
    return this.pokemonService.getFavorites();
  }

  @Get('type/:name')
  findByType(@Param('name') name: string) {
    return this.pokemonService.findByType(name);
  }

  @Get(':id/recommendations')
  getRecommendations(@Param('id') id: string) {
    return this.pokemonService.getRecommendations(+id);
  }

  @Get('search/:term') // 👈 Ruta nueva
  searchByName(@Param('term') term: string) {
    return this.pokemonService.searchByName(term);
  }

  @Get(':term') // Cambiamos ':id' por ':term' para que sea más claro
  findOne(@Param('term') term: string) {
    return this.pokemonService.findOne(term); // ¡Sin el más (+)! Pasamos el texto tal cual
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePokemonDto: UpdatePokemonDto) {
    return this.pokemonService.update(+id, updatePokemonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pokemonService.remove(+id);
  }
}
