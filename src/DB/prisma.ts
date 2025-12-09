import { PrismaClient } from "../../prisma/generated/prisma";

// Solución genérica para serializar BigInts en JSON automáticamente
// Esto elimina el error "Do not know how to serialize a BigInt" en todas las APIs
declare global {
  interface BigInt {
    toJSON(): number;
  }
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return Number(this);
};

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
