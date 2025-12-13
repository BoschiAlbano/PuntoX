/*
  Warnings:

  - You are about to drop the column `PrecioCosto` on the `Articulo` table. All the data in the column will be lost.
  - You are about to drop the `Stock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Stock" DROP CONSTRAINT "Stock_ArticuloId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Stock" DROP CONSTRAINT "Stock_TenantId_fkey";

-- AlterTable
ALTER TABLE "public"."Articulo" DROP COLUMN "PrecioCosto",
ADD COLUMN     "Stock" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."Stock";
