import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Asegúrate de que la ruta sea correcta
import { User } from '@prisma/client'; // Importamos el tipo de usuario

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
  ) {
    super({
      secretOrKey: process.env.JWT_SECRET || 'secreto321', // Debe coincidir con el del Módulo
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Busca el token en el Header "Authorization"
      ignoreExpiration: false, // Rechaza tokens vencidos
    });
  }

  // Esta función se ejecuta si el token tiene la firma correcta
  async validate(payload: { id: string }): Promise<User> {
    const { id } = payload;

    // Buscamos al usuario en la BD para asegurar que sigue existiendo
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) 
      throw new UnauthorizedException('Token no válido');

    if (!user.isActive) 
      throw new UnauthorizedException('Usuario inactivo, habla con el admin');

    // Lo que retornes aquí se añadirá a la Request como "req.user"
    return user;
  }
}