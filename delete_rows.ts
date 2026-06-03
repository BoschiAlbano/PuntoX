import { PrismaClient } from './prisma/generated/prisma/index.js';
const prisma = new PrismaClient();
async function main() {
  await prisma.promocionCantidad.deleteMany();
  console.log('Rows deleted');
}
main().catch(console.error).finally(() => prisma.$disconnect());
