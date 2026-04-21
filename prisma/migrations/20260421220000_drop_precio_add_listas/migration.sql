-- ============================================================
-- Migración: Drop tabla Precio obsoleta + Nuevo sistema de listas
-- ============================================================

-- 1. Eliminar FK de Articulo → Precio
ALTER TABLE "Articulo" DROP CONSTRAINT IF EXISTS "Articulo_PrecioId_fkey";

-- 2. Eliminar índice de Articulo.PrecioId
DROP INDEX IF EXISTS "Articulo_PrecioId_idx";

-- 3. Agregar PrecioCosto a Articulo (con default 0 para no romper filas existentes)
ALTER TABLE "Articulo" ADD COLUMN IF NOT EXISTS "PrecioCosto" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- 4. Migrar PrecioCosto desde tabla Precio (si aún existe y tiene datos)
UPDATE "Articulo" a
SET "PrecioCosto" = p."PrecioCosto"
FROM "Precio" p
WHERE p."ArticuloId" = a."Id";

-- 5. Eliminar columnas obsoletas de Articulo
ALTER TABLE "Articulo" DROP COLUMN IF EXISTS "PrecioId";
ALTER TABLE "Articulo" DROP COLUMN IF EXISTS "PorcentajeGanancia";

-- 6. Eliminar tabla Precio (FK primero)
ALTER TABLE "Precio" DROP CONSTRAINT IF EXISTS "Precio_TenantId_fkey";
ALTER TABLE "Precio" DROP CONSTRAINT IF EXISTS "Precio_ArticuloId_fkey";
DROP TABLE IF EXISTS "Precio";

-- 7. Agregar ListaPrecioId a Persona_Cliente
ALTER TABLE "Persona_Cliente" ADD COLUMN IF NOT EXISTS "ListaPrecioId" BIGINT;

-- 8. Crear tabla ListaPrecio
CREATE TABLE IF NOT EXISTS "ListaPrecio" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "Nombre" VARCHAR(100) NOT NULL,
    "PorDefecto" BOOLEAN NOT NULL DEFAULT false,
    "Activa" BOOLEAN NOT NULL DEFAULT true,
    "EstaEliminado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ListaPrecio_pkey" PRIMARY KEY ("Id")
);

-- 9. Crear tabla PrecioLista
CREATE TABLE IF NOT EXISTS "PrecioLista" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "ArticuloId" BIGINT NOT NULL,
    "ListaPrecioId" BIGINT NOT NULL,
    "PorcentajeGanancia" DECIMAL(18,2) NOT NULL,
    "PrecioFinal" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "PrecioLista_pkey" PRIMARY KEY ("Id")
);

-- 10. Índices
CREATE INDEX IF NOT EXISTS "ListaPrecio_TenantId_idx" ON "ListaPrecio"("TenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "PrecioLista_ArticuloId_ListaPrecioId_key" ON "PrecioLista"("ArticuloId", "ListaPrecioId");
CREATE INDEX IF NOT EXISTS "PrecioLista_TenantId_idx" ON "PrecioLista"("TenantId");
CREATE INDEX IF NOT EXISTS "PrecioLista_ArticuloId_idx" ON "PrecioLista"("ArticuloId");
CREATE INDEX IF NOT EXISTS "PrecioLista_ListaPrecioId_idx" ON "PrecioLista"("ListaPrecioId");

-- 11. FKs ListaPrecio
ALTER TABLE "ListaPrecio" ADD CONSTRAINT "ListaPrecio_TenantId_fkey"
    FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 12. FKs PrecioLista
ALTER TABLE "PrecioLista" ADD CONSTRAINT "PrecioLista_ArticuloId_fkey"
    FOREIGN KEY ("ArticuloId") REFERENCES "Articulo"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PrecioLista" ADD CONSTRAINT "PrecioLista_ListaPrecioId_fkey"
    FOREIGN KEY ("ListaPrecioId") REFERENCES "ListaPrecio"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PrecioLista" ADD CONSTRAINT "PrecioLista_TenantId_fkey"
    FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 13. FK Persona_Cliente → ListaPrecio
ALTER TABLE "Persona_Cliente" ADD CONSTRAINT "Persona_Cliente_ListaPrecioId_fkey"
    FOREIGN KEY ("ListaPrecioId") REFERENCES "ListaPrecio"("Id") ON DELETE SET NULL ON UPDATE CASCADE;
