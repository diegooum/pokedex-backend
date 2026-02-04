import { IsArray, IsInt, IsString, MinLength, ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'El equipo debe tener al menos 1 Pokémon' })
  @ArrayMaxSize(6, { message: 'Tu equipo no puede tener más de 6 Pokémon' })
  @IsInt({ each: true }) // Valida que cada elemento de la lista sea un número
  pokemons: number[]; // Recibimos esto: [1, 25, 6]
}