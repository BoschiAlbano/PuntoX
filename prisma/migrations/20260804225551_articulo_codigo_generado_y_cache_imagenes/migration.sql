-- CreateEnum
CREATE TYPE "ImagenCacheFuente" AS ENUM ('OPEN_FOOD_FACTS', 'USUARIO');

-- AlterTable
ALTER TABLE "Articulo" ADD COLUMN     "CodigoBarraGenerado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ImagenProductoCache" (
    "Id" BIGSERIAL NOT NULL,
    "CodigoBarra" VARCHAR(100) NOT NULL,
    "Descripcion" VARCHAR(250),
    "ImageUrl" VARCHAR(1000) NOT NULL,
    "Fuente" "ImagenCacheFuente" NOT NULL,
    "CreadoPorTenantId" BIGINT,
    "CreadoPorUserId" BIGINT,
    "FechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModificadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImagenProductoCache_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImagenProductoCache_CodigoBarra_key" ON "ImagenProductoCache"("CodigoBarra");

-- CreateIndex
CREATE INDEX "ImagenProductoCache_Descripcion_idx" ON "ImagenProductoCache"("Descripcion");
