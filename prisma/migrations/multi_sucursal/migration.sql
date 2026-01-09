-- =====================================================
-- MIGRACIÓN MULTI-SUCURSAL - COMBINADA
-- =====================================================
-- Este archivo combina todos los pasos de la migración multi-sucursal
-- en un solo archivo para compatibilidad con Prisma Migrate
-- =====================================================

-- =====================================================
-- PASO 1: CREAR TABLAS
-- =====================================================

-- 1. Crear tabla Sucursal
CREATE TABLE IF NOT EXISTS "public"."Sucursal" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "Nombre" VARCHAR(250) NOT NULL,
    "Direccion" VARCHAR(400),
    "Telefono" VARCHAR(25),
    "EsPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "EstaActiva" BOOLEAN NOT NULL DEFAULT true,
    "EstaEliminado" BOOLEAN NOT NULL DEFAULT false,
    "FechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FechaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("Id")
);

-- 2. Crear tabla UsuarioSucursal (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS "public"."UsuarioSucursal" (
    "UsuarioId" BIGINT NOT NULL,
    "SucursalId" BIGINT NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "EsDefault" BOOLEAN NOT NULL DEFAULT false,
    "FechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioSucursal_pkey" PRIMARY KEY ("UsuarioId", "SucursalId")
);

-- 3. Crear tabla ArticuloStock (stock por sucursal)
CREATE TABLE IF NOT EXISTS "public"."ArticuloStock" (
    "Id" BIGSERIAL NOT NULL,
    "ArticuloId" BIGINT NOT NULL,
    "SucursalId" BIGINT NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "Stock" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "StockMinimo" DECIMAL(18,2),
    "Ubicacion" VARCHAR(200),
    "FechaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticuloStock_pkey" PRIMARY KEY ("Id")
);

-- ÍNDICES para Sucursal
CREATE INDEX IF NOT EXISTS "Sucursal_TenantId_idx" ON "public"."Sucursal"("TenantId");
CREATE INDEX IF NOT EXISTS "Sucursal_TenantId_EsPrincipal_idx" ON "public"."Sucursal"("TenantId", "EsPrincipal");
CREATE INDEX IF NOT EXISTS "Sucursal_TenantId_EstaActiva_idx" ON "public"."Sucursal"("TenantId", "EstaActiva");
CREATE UNIQUE INDEX IF NOT EXISTS "Sucursal_TenantId_Nombre_key" ON "public"."Sucursal"("TenantId", "Nombre");

-- ÍNDICES para UsuarioSucursal
CREATE INDEX IF NOT EXISTS "UsuarioSucursal_TenantId_idx" ON "public"."UsuarioSucursal"("TenantId");
CREATE INDEX IF NOT EXISTS "UsuarioSucursal_UsuarioId_idx" ON "public"."UsuarioSucursal"("UsuarioId");
CREATE INDEX IF NOT EXISTS "UsuarioSucursal_SucursalId_idx" ON "public"."UsuarioSucursal"("SucursalId");

-- ÍNDICES para ArticuloStock
CREATE INDEX IF NOT EXISTS "ArticuloStock_TenantId_idx" ON "public"."ArticuloStock"("TenantId");
CREATE INDEX IF NOT EXISTS "ArticuloStock_TenantId_SucursalId_idx" ON "public"."ArticuloStock"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "ArticuloStock_ArticuloId_idx" ON "public"."ArticuloStock"("ArticuloId");
CREATE INDEX IF NOT EXISTS "ArticuloStock_SucursalId_idx" ON "public"."ArticuloStock"("SucursalId");
CREATE UNIQUE INDEX IF NOT EXISTS "ArticuloStock_ArticuloId_SucursalId_key" ON "public"."ArticuloStock"("ArticuloId", "SucursalId");

-- FOREIGN KEYS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Sucursal_TenantId_fkey') THEN
        ALTER TABLE "public"."Sucursal" 
        ADD CONSTRAINT "Sucursal_TenantId_fkey" 
        FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UsuarioSucursal_UsuarioId_fkey') THEN
        ALTER TABLE "public"."UsuarioSucursal" 
        ADD CONSTRAINT "UsuarioSucursal_UsuarioId_fkey" 
        FOREIGN KEY ("UsuarioId") REFERENCES "public"."Usuario"("Id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UsuarioSucursal_SucursalId_fkey') THEN
        ALTER TABLE "public"."UsuarioSucursal" 
        ADD CONSTRAINT "UsuarioSucursal_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UsuarioSucursal_TenantId_fkey') THEN
        ALTER TABLE "public"."UsuarioSucursal" 
        ADD CONSTRAINT "UsuarioSucursal_TenantId_fkey" 
        FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ArticuloStock_ArticuloId_fkey') THEN
        ALTER TABLE "public"."ArticuloStock" 
        ADD CONSTRAINT "ArticuloStock_ArticuloId_fkey" 
        FOREIGN KEY ("ArticuloId") REFERENCES "public"."Articulo"("Id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ArticuloStock_SucursalId_fkey') THEN
        ALTER TABLE "public"."ArticuloStock" 
        ADD CONSTRAINT "ArticuloStock_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ArticuloStock_TenantId_fkey') THEN
        ALTER TABLE "public"."ArticuloStock" 
        ADD CONSTRAINT "ArticuloStock_TenantId_fkey" 
        FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- =====================================================
-- PASO 2: AGREGAR COLUMNAS SucursalId
-- =====================================================

ALTER TABLE "public"."Caja" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

ALTER TABLE "public"."Gasto" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

ALTER TABLE "public"."Movimiento" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

ALTER TABLE "public"."Comprobante" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

ALTER TABLE "public"."BajaArticulo" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

ALTER TABLE "public"."Cheque" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

ALTER TABLE "public"."DepositoCheques" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

ALTER TABLE "public"."Contador" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

ALTER TABLE "public"."AuditoriaEmpleado" 
ADD COLUMN IF NOT EXISTS "SucursalId" BIGINT;

-- ÍNDICES para las nuevas columnas
CREATE INDEX IF NOT EXISTS "Caja_TenantId_SucursalId_idx" ON "public"."Caja"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Caja_SucursalId_idx" ON "public"."Caja"("SucursalId");
CREATE INDEX IF NOT EXISTS "Gasto_TenantId_SucursalId_idx" ON "public"."Gasto"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Gasto_SucursalId_idx" ON "public"."Gasto"("SucursalId");
CREATE INDEX IF NOT EXISTS "Movimiento_TenantId_SucursalId_idx" ON "public"."Movimiento"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Movimiento_SucursalId_idx" ON "public"."Movimiento"("SucursalId");
CREATE INDEX IF NOT EXISTS "Comprobante_TenantId_SucursalId_idx" ON "public"."Comprobante"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Comprobante_SucursalId_idx" ON "public"."Comprobante"("SucursalId");
CREATE INDEX IF NOT EXISTS "BajaArticulo_TenantId_SucursalId_idx" ON "public"."BajaArticulo"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "BajaArticulo_SucursalId_idx" ON "public"."BajaArticulo"("SucursalId");
CREATE INDEX IF NOT EXISTS "Cheque_TenantId_SucursalId_idx" ON "public"."Cheque"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Cheque_SucursalId_idx" ON "public"."Cheque"("SucursalId");
CREATE INDEX IF NOT EXISTS "DepositoCheques_TenantId_SucursalId_idx" ON "public"."DepositoCheques"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "DepositoCheques_SucursalId_idx" ON "public"."DepositoCheques"("SucursalId");
CREATE INDEX IF NOT EXISTS "Contador_TenantId_SucursalId_idx" ON "public"."Contador"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "Contador_SucursalId_idx" ON "public"."Contador"("SucursalId");
CREATE INDEX IF NOT EXISTS "AuditoriaEmpleado_TenantId_SucursalId_idx" ON "public"."AuditoriaEmpleado"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "AuditoriaEmpleado_SucursalId_idx" ON "public"."AuditoriaEmpleado"("SucursalId");

-- FOREIGN KEYS para SucursalId
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Caja_SucursalId_fkey') THEN
        ALTER TABLE "public"."Caja" 
        ADD CONSTRAINT "Caja_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Gasto_SucursalId_fkey') THEN
        ALTER TABLE "public"."Gasto" 
        ADD CONSTRAINT "Gasto_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Movimiento_SucursalId_fkey') THEN
        ALTER TABLE "public"."Movimiento" 
        ADD CONSTRAINT "Movimiento_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Comprobante_SucursalId_fkey') THEN
        ALTER TABLE "public"."Comprobante" 
        ADD CONSTRAINT "Comprobante_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BajaArticulo_SucursalId_fkey') THEN
        ALTER TABLE "public"."BajaArticulo" 
        ADD CONSTRAINT "BajaArticulo_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Cheque_SucursalId_fkey') THEN
        ALTER TABLE "public"."Cheque" 
        ADD CONSTRAINT "Cheque_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DepositoCheques_SucursalId_fkey') THEN
        ALTER TABLE "public"."DepositoCheques" 
        ADD CONSTRAINT "DepositoCheques_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Contador_SucursalId_fkey') THEN
        ALTER TABLE "public"."Contador" 
        ADD CONSTRAINT "Contador_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditoriaEmpleado_SucursalId_fkey') THEN
        ALTER TABLE "public"."AuditoriaEmpleado" 
        ADD CONSTRAINT "AuditoriaEmpleado_SucursalId_fkey" 
        FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- =====================================================
-- PASO 3: BACKFILL (crear sucursales y migrar datos)
-- =====================================================

-- Crear sucursal "Casa Central" para cada tenant
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
)
ON CONFLICT DO NOTHING;

-- Asignar usuarios a sucursal principal
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
)
ON CONFLICT DO NOTHING;

-- Migrar stock de Articulo a ArticuloStock
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
)
ON CONFLICT DO NOTHING;

-- Actualizar registros existentes con SucursalId
UPDATE "public"."Caja" c
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = c."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE c."SucursalId" IS NULL;

UPDATE "public"."Gasto" g
SET "SucursalId" = (
    SELECT c."SucursalId" FROM "public"."Caja" c 
    WHERE c."Id" = g."CajaId"
)
WHERE g."SucursalId" IS NULL;

UPDATE "public"."Movimiento" m
SET "SucursalId" = (
    SELECT c."SucursalId" FROM "public"."Caja" c 
    WHERE c."Id" = m."CajaId"
)
WHERE m."SucursalId" IS NULL;

UPDATE "public"."Comprobante" cp
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = cp."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE cp."SucursalId" IS NULL;

UPDATE "public"."BajaArticulo" ba
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = ba."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE ba."SucursalId" IS NULL;

UPDATE "public"."Cheque" ch
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = ch."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE ch."SucursalId" IS NULL;

UPDATE "public"."DepositoCheques" dc
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = dc."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE dc."SucursalId" IS NULL;

UPDATE "public"."Contador" ct
SET "SucursalId" = (
    SELECT s."Id" FROM "public"."Sucursal" s 
    WHERE s."TenantId" = ct."TenantId" AND s."EsPrincipal" = true
    LIMIT 1
)
WHERE ct."SucursalId" IS NULL;

-- =====================================================
-- FIN MIGRACIÓN MULTI-SUCURSAL
-- =====================================================
-- NOTA: Las políticas RLS y hacer SucursalId NOT NULL
-- deben ejecutarse manualmente después de verificar el backfill
-- =====================================================

