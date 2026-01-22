/*
  Warnings:

  - The `TipoVenta` column on the `Articulo` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[TenantId,SucursalId,TipoComprobante]` on the table `Contador` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TiposVenta" AS ENUM ('UNIDAD', 'PESO');

-- DropForeignKey
ALTER TABLE "AlertaSeguridad" DROP CONSTRAINT "AlertaSeguridad_ResueltoPor_fkey";

-- DropForeignKey
ALTER TABLE "AlertaSeguridad" DROP CONSTRAINT "AlertaSeguridad_UsuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Codigo2FA" DROP CONSTRAINT "Codigo2FA_UsuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Configuracion" DROP CONSTRAINT "Configuracion_CondicionIvaId_fkey";

-- DropForeignKey
ALTER TABLE "Configuracion" DROP CONSTRAINT "Configuracion_LocalidadId_fkey";

-- DropForeignKey
ALTER TABLE "DispositivoConfiable" DROP CONSTRAINT "DispositivoConfiable_UsuarioId_fkey";

-- DropForeignKey
ALTER TABLE "IntentoLogin" DROP CONSTRAINT "IntentoLogin_UsuarioId_fkey";

-- DropForeignKey
ALTER TABLE "SesionActiva" DROP CONSTRAINT "SesionActiva_UsuarioId_fkey";

-- DropForeignKey
ALTER TABLE "TokenCsrf" DROP CONSTRAINT "TokenCsrf_UsuarioId_fkey";

-- AlterTable
ALTER TABLE "Articulo" DROP COLUMN "TipoVenta",
ADD COLUMN     "TipoVenta" "TiposVenta" NOT NULL DEFAULT 'UNIDAD';

-- AlterTable
ALTER TABLE "ArticuloStock" ALTER COLUMN "FechaActualizacion" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Sucursal" ALTER COLUMN "FechaActualizacion" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Contador_TenantId_SucursalId_TipoComprobante_key" ON "Contador"("TenantId", "SucursalId", "TipoComprobante");

-- AddForeignKey
ALTER TABLE "Configuracion" ADD CONSTRAINT "Configuracion_CondicionIvaId_fkey" FOREIGN KEY ("CondicionIvaId") REFERENCES "CondicionIva"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Configuracion" ADD CONSTRAINT "Configuracion_LocalidadId_fkey" FOREIGN KEY ("LocalidadId") REFERENCES "Localidad"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SesionActiva" ADD CONSTRAINT "SesionActiva_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DispositivoConfiable" ADD CONSTRAINT "DispositivoConfiable_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "IntentoLogin" ADD CONSTRAINT "IntentoLogin_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TokenCsrf" ADD CONSTRAINT "TokenCsrf_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Codigo2FA" ADD CONSTRAINT "Codigo2FA_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AlertaSeguridad" ADD CONSTRAINT "AlertaSeguridad_ResueltoPor_fkey" FOREIGN KEY ("ResueltoPor") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AlertaSeguridad" ADD CONSTRAINT "AlertaSeguridad_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;
