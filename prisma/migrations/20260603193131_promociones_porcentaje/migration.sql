/*
  Warnings:

  - You are about to drop the column `PrecioFinal` on the `PromocionCantidad` table. All the data in the column will be lost.
  - Added the required column `DescuentoPorcentaje` to the `PromocionCantidad` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PromocionCantidad" DROP COLUMN "PrecioFinal",
ADD COLUMN     "DescuentoPorcentaje" DECIMAL(18,2) NOT NULL;
