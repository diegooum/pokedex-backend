import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // 1. REGISTRAR
  async register(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;
      const user = await this.prisma.user.create({
        data: {
          ...userData,
          password: bcrypt.hashSync(password, 10), // Encriptar password
        },
        select: { id: true, email: true, name: true }
      });

      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  // 2. LOGIN
  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) 
      throw new UnauthorizedException('Credenciales no válidas (Email)');

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credenciales no válidas (Password)');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      token: this.getJwtToken({ id: user.id })
    };
  }

  private getJwtToken(payload: { id: string }) {
    return this.jwtService.sign(payload);
  }

  private handleDBErrors(error: any): never {
    if (error.code === 'P2002') {
      throw new BadRequestException('El correo ya está registrado');
    }
    console.log(error);
    throw new InternalServerErrorException('Check logs');
  }
}