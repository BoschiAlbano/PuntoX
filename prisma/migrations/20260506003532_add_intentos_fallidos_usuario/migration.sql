-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "FechaUltimoIntento" TIMESTAMP(3),
ADD COLUMN     "IntentosFallidos" INTEGER NOT NULL DEFAULT 0;
