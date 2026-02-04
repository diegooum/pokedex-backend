import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy'; // 👈 1. IMPORTAR

@Module({
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy // 👈 2. AÑADIR AQUÍ
  ],
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [],
      inject: [],
      useFactory: () => {
        return {
          secret: process.env.JWT_SECRET || 'secreto321',
          signOptions: {
            expiresIn: '2h'
          }
        }
      }
    })
  ],
  exports: [
    JwtModule, 
    PassportModule, 
    AuthService, 
    JwtStrategy // 👈 3. EXPORTAR TAMBIÉN (Opcional pero recomendado)
  ]
})
export class AuthModule {}