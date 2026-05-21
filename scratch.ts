import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Eliminar registros sin CAE (intentos fallidos)
  const result = await prisma.facturaElectronica.deleteMany({
    where: { CAE: null }
  });
  console.log('Registros fallidos eliminados:', result.count);
  
  // Mostrar los que quedaron
  const remaining = await prisma.facturaElectronica.findMany({
    select: { Id: true, CbteNumero: true, Estado: true, CAE: true }
  });
  console.log('Registros restantes:', remaining.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
