import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear el usuario Diego si no existe
  const user = await prisma.user.upsert({
    where: { email: 'diego@pokedex.com' },
    update: {},
    create: {
      email: 'diego@pokedex.com',
      name: 'Diego',
      password: 'password123', // En un app real esto iría encriptado 🤫
    },
  });

  console.log('Usuario creado:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });