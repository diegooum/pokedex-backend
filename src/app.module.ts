import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PokemonModule } from './pokemon/pokemon.module';
import { PrismaModule } from './prisma/prisma.module'; // 👈 Importa el Módulo nuevo
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    PokemonModule, 
    PrismaModule, // 👈 Agrégalo aquí a los imports
    AuthModule, TeamsModule
  ],
  controllers: [AppController],
  providers: [AppService], 
  // Nota: Ya NO pongas PrismaService en 'providers' aquí, el módulo se encarga.
})
export class AppModule {}