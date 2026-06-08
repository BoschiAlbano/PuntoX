/*
  Warnings:

  - You are about to drop the `PromocionCombo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromocionComboItem` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `PlanId` on table `Tenant` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PromocionCombo" DROP CONSTRAINT "PromocionCombo_TenantId_fkey";

-- DropForeignKey
ALTER TABLE "PromocionComboItem" DROP CONSTRAINT "PromocionComboItem_ArticuloId_fkey";

-- DropForeignKey
ALTER TABLE "PromocionComboItem" DROP CONSTRAINT "PromocionComboItem_PromocionComboId_fkey";

-- DropForeignKey
ALTER TABLE "Tenant" DROP CONSTRAINT "Tenant_PlanId_fkey";

-- AlterTable
ALTER TABLE "Articulo" ADD COLUMN     "EsCombo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "PlanId" SET NOT NULL;

-- DropTable
DROP TABLE "PromocionCombo";

-- DropTable
DROP TABLE "PromocionComboItem";

-- CreateTable
CREATE TABLE "ArticuloComboItem" (
    "Id" BIGSERIAL NOT NULL,
    "ComboId" BIGINT NOT NULL,
    "ComponenteId" BIGINT NOT NULL,
    "CantidadRequerida" DECIMAL(18,3) NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "ArticuloComboItem_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "ArticuloComboItem_ComboId_idx" ON "ArticuloComboItem"("ComboId");

-- CreateIndex
CREATE INDEX "ArticuloComboItem_ComponenteId_idx" ON "ArticuloComboItem"("ComponenteId");

-- CreateIndex
CREATE INDEX "ArticuloComboItem_TenantId_idx" ON "ArticuloComboItem"("TenantId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_PlanId_fkey" FOREIGN KEY ("PlanId") REFERENCES "PlanSaaS"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticuloComboItem" ADD CONSTRAINT "ArticuloComboItem_ComboId_fkey" FOREIGN KEY ("ComboId") REFERENCES "Articulo"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticuloComboItem" ADD CONSTRAINT "ArticuloComboItem_ComponenteId_fkey" FOREIGN KEY ("ComponenteId") REFERENCES "Articulo"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticuloComboItem" ADD CONSTRAINT "ArticuloComboItem_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
