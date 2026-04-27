/*
  Warnings:

  - You are about to alter the column `Foto` on the `Articulo` table. The data in that column could be lost. The data in that column will be cast from `ByteA` to `VarChar(1000)`.
  - You are about to drop the `AlertaSeguridad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IntentoLogin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IpBloqueada` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Log` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AlertaSeguridad" DROP CONSTRAINT "AlertaSeguridad_ResueltoPor_fkey";

-- DropForeignKey
ALTER TABLE "AlertaSeguridad" DROP CONSTRAINT "AlertaSeguridad_TenantId_fkey";

-- DropForeignKey
ALTER TABLE "AlertaSeguridad" DROP CONSTRAINT "AlertaSeguridad_UsuarioId_fkey";

-- DropForeignKey
ALTER TABLE "IntentoLogin" DROP CONSTRAINT "IntentoLogin_TenantId_fkey";

-- DropForeignKey
ALTER TABLE "IntentoLogin" DROP CONSTRAINT "IntentoLogin_UsuarioId_fkey";

-- DropForeignKey
ALTER TABLE "IpBloqueada" DROP CONSTRAINT "IpBloqueada_TenantId_fkey";

-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_TenantId_fkey";

-- AlterTable
ALTER TABLE "Articulo" ALTER COLUMN "Foto" DROP NOT NULL,
ALTER COLUMN "Foto" SET DATA TYPE VARCHAR(1000);

-- DropTable
DROP TABLE "AlertaSeguridad";

-- DropTable
DROP TABLE "IntentoLogin";

-- DropTable
DROP TABLE "IpBloqueada";

-- DropTable
DROP TABLE "Log";
