-- =====================================================
-- MIGRACIÓN MULTI-SUCURSAL - PASO 2: AGREGAR COLUMNAS
-- =====================================================
-- Este script agrega SucursalId (nullable) a las tablas existentes
-- Ejecutar DESPUÉS del paso 1
-- =====================================================

-- =====================================================
-- AGREGAR COLUMNA SucursalId A TABLAS EXISTENTES
-- Todas las columnas son NULLABLE inicialmente para permitir backfill
-- =====================================================

-- Caja: cada caja pertenece a una sucursal
ALTER TABLE "public"."Caja" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

-- Gasto: gastos registrados en una sucursal
ALTER TABLE "public"."Gasto" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

-- Movimiento: movimientos de caja por sucursal
ALTER TABLE "public"."Movimiento" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

-- Comprobante: ventas/facturas emitidas en sucursal
ALTER TABLE "public"."Comprobante" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

-- BajaArticulo: ajustes de stock por sucursal
ALTER TABLE "public"."BajaArticulo" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

-- Cheque: cheques recibidos en sucursal
ALTER TABLE "public"."Cheque" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

-- DepositoCheques: depósitos realizados desde sucursal
ALTER TABLE "public"."DepositoCheques" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

-- Contador: numeración por sucursal
ALTER TABLE "public"."Contador" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

-- AuditoriaEmpleado: auditoría con sucursal opcional
ALTER TABLE "public"."AuditoriaEmpleado" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

-- =====================================================
-- ÍNDICES para las nuevas columnas
-- =====================================================

-- Caja
CREATE INDEX IF NOT EXISTS "Caja_TenantId_SucursalId_idx" ON "public"."Caja"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Caja_SucursalId_idx" ON "public"."Caja"("SucursalId");

-- Gasto
CREATE INDEX IF NOT EXISTS "Gasto_TenantId_SucursalId_idx" ON "public"."Gasto"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Gasto_SucursalId_idx" ON "public"."Gasto"("SucursalId");

-- Movimiento
CREATE INDEX IF NOT EXISTS "Movimiento_TenantId_SucursalId_idx" ON "public"."Movimiento"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Movimiento_SucursalId_idx" ON "public"."Movimiento"("SucursalId");

-- Comprobante
CREATE INDEX IF NOT EXISTS "Comprobante_TenantId_SucursalId_idx" ON "public"."Comprobante"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Comprobante_SucursalId_idx" ON "public"."Comprobante"("SucursalId");

-- BajaArticulo
CREATE INDEX IF NOT EXISTS "BajaArticulo_TenantId_SucursalId_idx" ON "public"."BajaArticulo"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "BajaArticulo_SucursalId_idx" ON "public"."BajaArticulo"("SucursalId");

-- Cheque
CREATE INDEX IF NOT EXISTS "Cheque_TenantId_SucursalId_idx" ON "public"."Cheque"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Cheque_SucursalId_idx" ON "public"."Cheque"("SucursalId");

-- DepositoCheques
CREATE INDEX IF NOT EXISTS "DepositoCheques_TenantId_SucursalId_idx" ON "public"."DepositoCheques"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "DepositoCheques_SucursalId_idx" ON "public"."DepositoCheques"("SucursalId");

-- Contador
CREATE INDEX IF NOT EXISTS "Contador_TenantId_SucursalId_idx" ON "public"."Contador"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Contador_SucursalId_idx" ON "public"."Contador"("SucursalId");

-- AuditoriaEmpleado
CREATE INDEX IF NOT EXISTS "AuditoriaEmpleado_TenantId_SucursalId_idx" ON "public"."AuditoriaEmpleado"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "AuditoriaEmpleado_SucursalId_idx" ON "public"."AuditoriaEmpleado"("SucursalId");

-- =====================================================
-- FOREIGN KEYS para SucursalId
-- =====================================================

ALTER TABLE "public"."Caja" 
ADD CONSTRAINT "Caja_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."Gasto" 
ADD CONSTRAINT "Gasto_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."Movimiento" 
ADD CONSTRAINT "Movimiento_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."Comprobante" 
ADD CONSTRAINT "Comprobante_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."BajaArticulo" 
ADD CONSTRAINT "BajaArticulo_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."Cheque" 
ADD CONSTRAINT "Cheque_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."DepositoCheques" 
ADD CONSTRAINT "DepositoCheques_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."Contador" 
ADD CONSTRAINT "Contador_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."AuditoriaEmpleado" 
ADD CONSTRAINT "AuditoriaEmpleado_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- FIN PASO 2
-- =====================================================

