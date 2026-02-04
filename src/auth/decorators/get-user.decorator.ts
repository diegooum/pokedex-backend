import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    
    // Aquí NestJS busca la "Request" que viene llegando
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // El usuario que inyectó nuestra Estrategia JWT

    if (!user)
      throw new InternalServerErrorException('User not found in request (AuthGuard missing?)');

    return (!data) ? user : user[data];
  }
);