/*
  Warnings:

  - A unique constraint covering the columns `[Token]` on the table `DispositivoConfiable` will be added. If there are existing duplicate values, this will fail.
  - The required column `Token` was added to the `DispositivoConfiable` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "DispositivoConfiable_TenantId_UsuarioId_UserAgent_IpAddress_key";

-- AlterTable
ALTER TABLE "DispositivoConfiable" ADD COLUMN     "Token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DispositivoConfiable_Token_key" ON "DispositivoConfiable"("Token");

-- CreateIndex
CREATE INDEX "DispositivoConfiable_Token_idx" ON "DispositivoConfiable"("Token");
