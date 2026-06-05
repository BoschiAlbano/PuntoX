-- CreateTable
CREATE TABLE "PromocionCombo" (
    "Id" BIGSERIAL NOT NULL,
    "Nombre" VARCHAR(200) NOT NULL,
    "PrecioFinal" DECIMAL(18,2) NOT NULL,
    "EstaActiva" BOOLEAN NOT NULL DEFAULT true,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "PromocionCombo_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "PromocionComboItem" (
    "Id" BIGSERIAL NOT NULL,
    "PromocionComboId" BIGINT NOT NULL,
    "ArticuloId" BIGINT NOT NULL,
    "CantidadRequerida" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "PromocionComboItem_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "PromocionCombo_TenantId_idx" ON "PromocionCombo"("TenantId");

-- CreateIndex
CREATE INDEX "PromocionComboItem_PromocionComboId_idx" ON "PromocionComboItem"("PromocionComboId");

-- CreateIndex
CREATE INDEX "PromocionComboItem_ArticuloId_idx" ON "PromocionComboItem"("ArticuloId");

-- AddForeignKey
ALTER TABLE "PromocionCombo" ADD CONSTRAINT "PromocionCombo_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromocionComboItem" ADD CONSTRAINT "PromocionComboItem_PromocionComboId_fkey" FOREIGN KEY ("PromocionComboId") REFERENCES "PromocionCombo"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromocionComboItem" ADD CONSTRAINT "PromocionComboItem_ArticuloId_fkey" FOREIGN KEY ("ArticuloId") REFERENCES "Articulo"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
