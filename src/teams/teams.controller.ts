import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AuthGuard } from '@nestjs/passport'; // 🛡️ Guardia
import { GetUser } from '../auth/decorators/get-user.decorator'; // 🕵️‍♂️ Decorador
import type { User } from '@prisma/client';

@Controller('teams')
@UseGuards(AuthGuard('jwt')) // 🔒 ¡Protegemos TODO el controlador!
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(
    @Body() createTeamDto: CreateTeamDto,
    @GetUser() user: User // Obtenemos al usuario del token
  ) {
    return this.teamsService.create(createTeamDto, user.id);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.teamsService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser() user: User
  ) {
    return this.teamsService.findOne(id, user.id);
  }

  // ... (Tus otros endpoints)

  @Get(':id/analysis')
  analyze(
    @Param('id') id: string,
    @GetUser() user: User
  ) {
    return this.teamsService.analyzeTeam(id, user.id);
  }

  // ... Update y Delete los dejamos igual por ahora
}