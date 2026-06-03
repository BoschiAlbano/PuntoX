-- AlterTable
ALTER TABLE "Configuracion" ADD COLUMN     "AfipCertificado" TEXT,
ADD COLUMN     "AfipCertificadoVence" TIMESTAMP(3),
ADD COLUMN     "AfipClavePrivada" TEXT,
ADD COLUMN     "AfipEntornoProduccion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "AfipHabilitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "IngresosBrutos" VARCHAR(50);

-- AlterTable
ALTER TABLE "Sucursal" ADD COLUMN     "DomicilioFiscal" VARCHAR(400),
ADD COLUMN     "PuntoVentaAfip" INTEGER;

-- CreateTable
CREATE TABLE "PromocionCantidad" (
    "Id" BIGSERIAL NOT NULL,
    "ArticuloId" BIGINT NOT NULL,
    "Cantidad" INTEGER NOT NULL,
    "PrecioFinal" DECIMAL(18,2) NOT NULL,
    "EstaActiva" BOOLEAN NOT NULL DEFAULT true,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "PromocionCantidad_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "FacturaElectronica" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "ComprobanteId" BIGINT NOT NULL,
    "SucursalId" BIGINT NOT NULL,
    "CbteTipo" INTEGER NOT NULL,
    "CbteNumero" INTEGER NOT NULL,
    "PuntoVenta" INTEGER NOT NULL,
    "Concepto" INTEGER NOT NULL,
    "DocTipo" INTEGER NOT NULL,
    "DocNro" VARCHAR(20) NOT NULL,
    "ImpTotal" DECIMAL(18,2) NOT NULL,
    "ImpNeto" DECIMAL(18,2) NOT NULL,
    "ImpIva" DECIMAL(18,2) NOT NULL,
    "ImpTrib" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ImpOpEx" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ImpTotConc" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "MonId" VARCHAR(5) NOT NULL DEFAULT 'PES',
    "MonCotiz" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "CAE" VARCHAR(20),
    "CAEFchVto" TIMESTAMP(3),
    "Estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "Resultado" VARCHAR(5),
    "RequestXml" TEXT,
    "ResponseXml" TEXT,
    "Observaciones" TEXT,
    "Reprocesado" BOOLEAN NOT NULL DEFAULT false,
    "FchServDesde" TIMESTAMP(3),
    "FchServHasta" TIMESTAMP(3),
    "FchVtoPago" TIMESTAMP(3),
    "FechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacturaElectronica_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "FacturaElectronicaIva" (
    "Id" BIGSERIAL NOT NULL,
    "FacturaElectronicaId" BIGINT NOT NULL,
    "IvaAfipId" INTEGER NOT NULL,
    "BaseImponible" DECIMAL(18,2) NOT NULL,
    "Importe" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "FacturaElectronicaIva_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "PromocionCantidad_ArticuloId_idx" ON "PromocionCantidad"("ArticuloId");

-- CreateIndex
CREATE INDEX "PromocionCantidad_TenantId_idx" ON "PromocionCantidad"("TenantId");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaElectronica_ComprobanteId_key" ON "FacturaElectronica"("ComprobanteId");

-- CreateIndex
CREATE INDEX "FacturaElectronica_TenantId_idx" ON "FacturaElectronica"("TenantId");

-- CreateIndex
CREATE INDEX "FacturaElectronica_TenantId_Estado_idx" ON "FacturaElectronica"("TenantId", "Estado");

-- CreateIndex
CREATE INDEX "FacturaElectronica_TenantId_SucursalId_idx" ON "FacturaElectronica"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "FacturaElectronica_CAE_idx" ON "FacturaElectronica"("CAE");

-- CreateIndex
CREATE INDEX "FacturaElectronica_ComprobanteId_idx" ON "FacturaElectronica"("ComprobanteId");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaElectronica_TenantId_PuntoVenta_CbteTipo_CbteNumero_key" ON "FacturaElectronica"("TenantId", "PuntoVenta", "CbteTipo", "CbteNumero");

-- CreateIndex
CREATE INDEX "FacturaElectronicaIva_FacturaElectronicaId_idx" ON "FacturaElectronicaIva"("FacturaElectronicaId");

-- AddForeignKey
ALTER TABLE "PromocionCantidad" ADD CONSTRAINT "PromocionCantidad_ArticuloId_fkey" FOREIGN KEY ("ArticuloId") REFERENCES "Articulo"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromocionCantidad" ADD CONSTRAINT "PromocionCantidad_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaElectronica" ADD CONSTRAINT "FacturaElectronica_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaElectronica" ADD CONSTRAINT "FacturaElectronica_ComprobanteId_fkey" FOREIGN KEY ("ComprobanteId") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaElectronica" ADD CONSTRAINT "FacturaElectronica_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaElectronicaIva" ADD CONSTRAINT "FacturaElectronicaIva_FacturaElectronicaId_fkey" FOREIGN KEY ("FacturaElectronicaId") REFERENCES "FacturaElectronica"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
