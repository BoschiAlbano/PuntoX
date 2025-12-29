/*
  Warnings:

  - You are about to drop the column `PuestoTrabajoId` on the `Comprobante_Factura` table. All the data in the column will be lost.
  - You are about to drop the `PuestoTrabajo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comprobante_Factura" DROP CONSTRAINT "Comprobante_Factura_PuestoTrabajoId_fkey";

-- DropForeignKey
ALTER TABLE "PuestoTrabajo" DROP CONSTRAINT "PuestoTrabajo_TenantId_fkey";

-- DropIndex
DROP INDEX "Comprobante_Factura_PuestoTrabajoId_idx";

-- AlterTable
ALTER TABLE "Comprobante_Factura" DROP COLUMN "PuestoTrabajoId";

-- DropTable
DROP TABLE "PuestoTrabajo";
