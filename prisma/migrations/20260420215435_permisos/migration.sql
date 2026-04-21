/*
  Warnings:

  - You are about to drop the column `TenantId` on the `Permiso` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[Clave]` on the table `Permiso` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Permiso" DROP CONSTRAINT "Permiso_TenantId_fkey";

-- DropIndex
DROP INDEX "Permiso_Clave_TenantId_key";

-- DropIndex
DROP INDEX "Permiso_TenantId_idx";

-- AlterTable
ALTER TABLE "Permiso" DROP COLUMN "TenantId";

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_Clave_key" ON "Permiso"("Clave");
