/*
  Warnings:

  - You are about to drop the column `DepositoId` on the `Configuracion` table. All the data in the column will be lost.
  - You are about to drop the column `DepositoId` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the `Deposito` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Configuracion" DROP CONSTRAINT "Configuracion_DepositoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Deposito" DROP CONSTRAINT "Deposito_TenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Stock" DROP CONSTRAINT "Stock_DepositoId_fkey";

-- DropIndex
DROP INDEX "public"."Configuracion_DepositoId_idx";

-- DropIndex
DROP INDEX "public"."Stock_DepositoId_idx";

-- AlterTable
ALTER TABLE "public"."Configuracion" DROP COLUMN "DepositoId";

-- AlterTable
ALTER TABLE "public"."Stock" DROP COLUMN "DepositoId";

-- DropTable
DROP TABLE "public"."Deposito";
