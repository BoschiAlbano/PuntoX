-- =====================================================
-- MIGRACIÓN MULTI-SUCURSAL - PASO 3: BACKFILL
-- =====================================================
-- Este script:
-- 1. Crea una sucursal "Casa Central" por defecto para cada tenant existente
-- 2. Asigna todos los usuarios a su sucursal principal
-- 3. Migra el stock de Articulo a ArticuloStock
-- 4. Actualiza registros existentes con la sucursal por defecto
-- 
-- IMPORTANTE: Ejecutar en una transacción
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 3.1: Crear sucursal "Casa Central" para cada tenant
-- =====================================================
-- Solo crea si el tenant no tiene ninguna sucursal

INSERT INTO "public"."Sucursal" ("TenantId", "Nombre", "EsPrincipal", "EstaActiva", "EstaEliminado")
SELECT 
    t."Id" as "TenantId",
    'Casa Central' as "Nombre",
    true as "EsPrincipal",
    true as "EstaActiva",
    false as "EstaEliminado"
FROM "public"."Tenant" t
WHERE t."EstaEliminado" = false
AND NOT EXISTS (
    SELECT 1 FROM "public"."Sucursal" s 
    WHERE s."TenantId" = t."Id"
);

-- Verificar que todos los tenants tienen sucursal
DO $$
DECLARE
    tenants_sin_sucursal INTEGER;
BEGIN
    SELECT COUNT(*) INTO tenants_sin_sucursal
    FROM "public"."Tenant" t
    WHERE t."EstaEliminado" = false
    AND NOT EXISTS (
        SELECT 1 FROM "public"."Sucursal" s 
        WHERE s."TenantId" = t."Id"
    );
    
    IF tenants_sin_sucursal > 0 THEN
        RAISE EXCEPTION 'Hay % tenants sin sucursal después del backfill', tenants_sin_sucursal;
    END IF;
END $$;

-- =====================================================
-- PASO 3.2: Asignar usuarios a sucursal principal
-- =====================================================
-- Cada usuario se asigna a la sucursal principal de su tenant

INSERT INTO "public"."UsuarioSucursal" ("UsuarioId", "SucursalId", "TenantId", "EsDefault")
SELECT 
    u."Id" as "UsuarioId",
    s."Id" as "SucursalId",
    u."TenantId",
    true as "EsDefault"
FROM "public"."Usuario" u
INNER JOIN "public"."Sucursal" s ON s."TenantId" = u."TenantId" AND s."EsPrincipal" = true
WHERE u."EstaEliminado" = false
AND NOT EXISTS (
    SELECT 1 FROM "public"."UsuarioSucursal" us 
    WHERE us."UsuarioId" = u."Id" AND us."SucursalId" = s."Id"
);

-- =====================================================
-- PASO 3.3: Migrar stock de Articulo a ArticuloStock
-- =====================================================
-- Crea un registro de stock por cada artículo en la sucursal principal

INSERT INTO "public"."ArticuloStock" ("ArticuloId", "SucursalId", "TenantId", "Stock", "StockMinimo", "Ubicacion")
SELECT 
    a."Id" as "ArticuloId",
    s."Id" as "SucursalId",
    a."TenantId",
    a."Stock",
    a."StockMinimo",
    a."Ubicacion"
FROM "public"."Articulo" a
INNER JOIN "public"."Sucursal" s ON s."TenantId" = a."TenantId" AND s."EsPrincipal" = true
WHERE a."EstaEliminado" = false
AND NOT EXISTS (
    SELECT 1 FROM "public"."ArticuloStock" ast 
    WHERE ast."ArticuloId" = a."Id" AND ast."SucursalId" = s."Id"
);

-- =====================================================
-- PASO 3.4: Actualizar registros existentes con SucursalId
-- =====================================================

-- Actualizar Caja
UPDATE "public"."Caja" c
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = c."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE c."SucursalId" IS NULL;

-- Actualizar Gasto (hereda de Caja)
UPDATE "public"."Gasto" g
SET "SucursalId" = (
    SELECT c."SucursalId" FROM "public"."Caja" c 
    WHERE c."Id" = g."CajaId"
)
WHERE g."SucursalId" IS NULL;

-- Actualizar Movimiento (hereda de Caja)
UPDATE "public"."Movimiento" m
SET "SucursalId" = (
    SELECT c."SucursalId" FROM "public"."Caja" c 
    WHERE c."Id" = m."CajaId"
)
WHERE m."SucursalId" IS NULL;

-- Actualizar Comprobante
UPDATE "public"."Comprobante" cp
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = cp."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE cp."SucursalId" IS NULL;

-- Actualizar BajaArticulo
UPDATE "public"."BajaArticulo" ba
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = ba."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE ba."SucursalId" IS NULL;

-- Actualizar Cheque
UPDATE "public"."Cheque" ch
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = ch."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE ch."SucursalId" IS NULL;

-- Actualizar DepositoCheques
UPDATE "public"."DepositoCheques" dc
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = dc."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE dc."SucursalId" IS NULL;

-- Actualizar Contador
UPDATE "public"."Contador" ct
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = ct."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE ct."SucursalId" IS NULL;

-- AuditoriaEmpleado: NO actualizamos porque es opcional
-- Los registros existentes quedan sin sucursal (auditoría global)

COMMIT;

-- =====================================================
-- VERIFICACIÓN POST-BACKFILL
-- =====================================================
-- Ejecutar estas queries para verificar el backfill:

-- SELECT 'Tenants' as tabla, COUNT(*) as total FROM "public"."Tenant" WHERE "EstaEliminado" = false
-- UNION ALL
-- SELECT 'Sucursales', COUNT(*) FROM "public"."Sucursal"
-- UNION ALL
-- SELECT 'Usuarios', COUNT(*) FROM "public"."Usuario" WHERE "EstaEliminado" = false
-- UNION ALL
-- SELECT 'UsuarioSucursal', COUNT(*) FROM "public"."UsuarioSucursal"
-- UNION ALL
-- SELECT 'Articulos', COUNT(*) FROM "public"."Articulo" WHERE "EstaEliminado" = false
-- UNION ALL
-- SELECT 'ArticuloStock', COUNT(*) FROM "public"."ArticuloStock"
-- UNION ALL
-- SELECT 'Cajas sin sucursal', COUNT(*) FROM "public"."Caja" WHERE "SucursalId" IS NULL
-- UNION ALL
-- SELECT 'Comprobantes sin sucursal', COUNT(*) FROM "public"."Comprobante" WHERE "SucursalId" IS NULL;

-- =====================================================
-- FIN PASO 3
-- =====================================================

