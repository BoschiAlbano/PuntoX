-- =====================================================
-- MIGRACIÓN MULTI-SUCURSAL - PASO 4: HACER SUCURSAL REQUIRED
-- =====================================================
-- Este script hace SucursalId NOT NULL en tablas críticas
-- EJECUTAR SOLO DESPUÉS de verificar que el backfill fue exitoso
-- 
-- IMPORTANTE: Verificar primero que no hay registros con SucursalId NULL
-- =====================================================

-- =====================================================
-- VERIFICACIÓN PRE-EJECUCIÓN (OBLIGATORIA)
-- =====================================================
-- Ejecutar estas queries ANTES de continuar:

DO $$
DECLARE
    cajas_null INTEGER;
    comprobantes_null INTEGER;
    contadores_null INTEGER;
BEGIN
    -- Verificar Caja
    SELECT COUNT(*) INTO cajas_null FROM "public"."Caja" WHERE "SucursalId" IS NULL;
    IF cajas_null > 0 THEN
        RAISE EXCEPTION 'Hay % cajas sin SucursalId. Ejecutar backfill primero.', cajas_null;
    END IF;
    
    -- Verificar Comprobante
    SELECT COUNT(*) INTO comprobantes_null FROM "public"."Comprobante" WHERE "SucursalId" IS NULL;
    IF comprobantes_null > 0 THEN
        RAISE EXCEPTION 'Hay % comprobantes sin SucursalId. Ejecutar backfill primero.', comprobantes_null;
    END IF;
    
    -- Verificar Contador
    SELECT COUNT(*) INTO contadores_null FROM "public"."Contador" WHERE "SucursalId" IS NULL;
    IF contadores_null > 0 THEN
        RAISE EXCEPTION 'Hay % contadores sin SucursalId. Ejecutar backfill primero.', contadores_null;
    END IF;
    
    RAISE NOTICE 'Verificación exitosa. Procediendo con ALTER TABLE...';
END $$;

-- =====================================================
-- HACER SucursalId NOT NULL (solo tablas críticas)
-- =====================================================

-- NOTA: Las siguientes tablas MANTIENEN SucursalId nullable:
-- - AuditoriaEmpleado: auditorías globales no tienen sucursal
-- - Gasto: hereda de Caja, pero puede ser null en casos edge
-- - Movimiento: hereda de Caja, pero puede ser null en casos edge

-- Caja: CRÍTICO - cada caja DEBE pertenecer a una sucursal
-- ALTER TABLE "public"."Caja" ALTER COLUMN "SucursalId" SET NOT NULL;

-- Comprobante: CRÍTICO - cada venta DEBE pertenecer a una sucursal  
-- ALTER TABLE "public"."Comprobante" ALTER COLUMN "SucursalId" SET NOT NULL;

-- Contador: CRÍTICO - numeración DEBE ser por sucursal
-- ALTER TABLE "public"."Contador" ALTER COLUMN "SucursalId" SET NOT NULL;

-- =====================================================
-- CONSTRAINT ÚNICO para Contador
-- =====================================================
-- Un contador único por tipo de comprobante por sucursal

-- Primero eliminar duplicados si existen
-- DELETE FROM "public"."Contador" c1
-- USING "public"."Contador" c2
-- WHERE c1."Id" > c2."Id"
-- AND c1."TenantId" = c2."TenantId"
-- AND c1."SucursalId" = c2."SucursalId"
-- AND c1."TipoComprobante" = c2."TipoComprobante";

-- Crear constraint único
-- ALTER TABLE "public"."Contador" 
-- ADD CONSTRAINT "Contador_TenantId_SucursalId_TipoComprobante_key" 
-- UNIQUE ("TenantId", "SucursalId", "TipoComprobante");

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Las líneas ALTER TABLE están comentadas para seguridad.
-- Descomentar SOLO después de verificar el backfill.
-- 
-- Para ejecutar:
-- 1. Verificar que no hay registros NULL
-- 2. Descomentar las líneas ALTER TABLE
-- 3. Ejecutar el script
-- =====================================================

-- =====================================================
-- FIN PASO 4
-- =====================================================

