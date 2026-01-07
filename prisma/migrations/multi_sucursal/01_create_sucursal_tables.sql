-- =====================================================
-- MIGRACIÓN MULTI-SUCURSAL - PASO 1: CREAR TABLAS
-- =====================================================
-- Este script crea las tablas necesarias para el sistema multi-sucursal
-- Ejecutar ANTES de correr prisma migrate
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

-- =====================================================
-- ÍNDICES para Sucursal
-- =====================================================
CREATE INDEX IF NOT EXISTS "Sucursal_TenantId_idx" ON "public"."Sucursal"("TenantId");
CREATE INDEX IF NOT EXISTS "Sucursal_TenantId_EsPrincipal_idx" ON "public"."Sucursal"("TenantId", "EsPrincipal");
CREATE INDEX IF NOT EXISTS "Sucursal_TenantId_EstaActiva_idx" ON "public"."Sucursal"("TenantId", "EstaActiva");
CREATE UNIQUE INDEX IF NOT EXISTS "Sucursal_TenantId_Nombre_key" ON "public"."Sucursal"("TenantId", "Nombre");

-- =====================================================
-- ÍNDICES para UsuarioSucursal
-- =====================================================
CREATE INDEX IF NOT EXISTS "UsuarioSucursal_TenantId_idx" ON "public"."UsuarioSucursal"("TenantId");
CREATE INDEX IF NOT EXISTS "UsuarioSucursal_UsuarioId_idx" ON "public"."UsuarioSucursal"("UsuarioId");
CREATE INDEX IF NOT EXISTS "UsuarioSucursal_SucursalId_idx" ON "public"."UsuarioSucursal"("SucursalId");

-- =====================================================
-- ÍNDICES para ArticuloStock
-- =====================================================
CREATE INDEX IF NOT EXISTS "ArticuloStock_TenantId_idx" ON "public"."ArticuloStock"("TenantId");
CREATE INDEX IF NOT EXISTS "ArticuloStock_TenantId_SucursalId_idx" ON "public"."ArticuloStock"("TenantId", "SucursalId");
CREATE INDEX IF NOT EXISTS "ArticuloStock_ArticuloId_idx" ON "public"."ArticuloStock"("ArticuloId");
CREATE INDEX IF NOT EXISTS "ArticuloStock_SucursalId_idx" ON "public"."ArticuloStock"("SucursalId");
CREATE UNIQUE INDEX IF NOT EXISTS "ArticuloStock_ArticuloId_SucursalId_key" ON "public"."ArticuloStock"("ArticuloId", "SucursalId");

-- =====================================================
-- FOREIGN KEYS
-- =====================================================

-- Sucursal -> Tenant
ALTER TABLE "public"."Sucursal" 
ADD CONSTRAINT "Sucursal_TenantId_fkey" 
FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- UsuarioSucursal -> Usuario
ALTER TABLE "public"."UsuarioSucursal" 
ADD CONSTRAINT "UsuarioSucursal_UsuarioId_fkey" 
FOREIGN KEY ("UsuarioId") REFERENCES "public"."Usuario"("Id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- UsuarioSucursal -> Sucursal
ALTER TABLE "public"."UsuarioSucursal" 
ADD CONSTRAINT "UsuarioSucursal_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- UsuarioSucursal -> Tenant
ALTER TABLE "public"."UsuarioSucursal" 
ADD CONSTRAINT "UsuarioSucursal_TenantId_fkey" 
FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- ArticuloStock -> Articulo
ALTER TABLE "public"."ArticuloStock" 
ADD CONSTRAINT "ArticuloStock_ArticuloId_fkey" 
FOREIGN KEY ("ArticuloId") REFERENCES "public"."Articulo"("Id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- ArticuloStock -> Sucursal
ALTER TABLE "public"."ArticuloStock" 
ADD CONSTRAINT "ArticuloStock_SucursalId_fkey" 
FOREIGN KEY ("SucursalId") REFERENCES "public"."Sucursal"("Id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- ArticuloStock -> Tenant
ALTER TABLE "public"."ArticuloStock" 
ADD CONSTRAINT "ArticuloStock_TenantId_fkey" 
FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================
-- FIN PASO 1
-- =====================================================

