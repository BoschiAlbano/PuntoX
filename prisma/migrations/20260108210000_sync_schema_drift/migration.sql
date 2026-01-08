-- =====================================================
-- MIGRACIÓN: Sincronizar schema con base de datos
-- =====================================================
-- Esta migración sincroniza diferencias menores entre
-- el schema de Prisma y la base de datos actual
-- =====================================================

-- =====================================================
-- 1. Actualizar enum PerfilTipo con default
-- =====================================================
-- Asegurar que el enum tiene el valor por defecto correcto

ALTER TABLE "public"."Perfiles" 
ALTER COLUMN "Tipo" SET DEFAULT 'EMPLEADO';

-- =====================================================
-- 2. Agregar constraint único a Contador
-- =====================================================
-- Un contador único por tipo de comprobante por sucursal
-- (Ya existe, se omite)

-- =====================================================
-- 3. Asegurar que campos de Configuracion sean NOT NULL
-- =====================================================
-- Estos campos deben tener valores por defecto si son NULL

UPDATE "public"."Configuracion" 
SET "Forzar2FA" = false 
WHERE "Forzar2FA" IS NULL;

UPDATE "public"."Configuracion" 
SET "ExpirarSesiones30Dias" = true 
WHERE "ExpirarSesiones30Dias" IS NULL;

UPDATE "public"."Configuracion" 
SET "AlertarNuevoDispositivo" = true 
WHERE "AlertarNuevoDispositivo" IS NULL;

UPDATE "public"."Configuracion" 
SET "BloquearPorInactividad" = false 
WHERE "BloquearPorInactividad" IS NULL;

UPDATE "public"."Configuracion" 
SET "RecordarSesion30Dias" = true 
WHERE "RecordarSesion30Dias" IS NULL;

-- Ahora hacerlos NOT NULL
ALTER TABLE "public"."Configuracion" 
ALTER COLUMN "Forzar2FA" SET NOT NULL,
ALTER COLUMN "Forzar2FA" SET DEFAULT false;

ALTER TABLE "public"."Configuracion" 
ALTER COLUMN "ExpirarSesiones30Dias" SET NOT NULL,
ALTER COLUMN "ExpirarSesiones30Dias" SET DEFAULT true;

ALTER TABLE "public"."Configuracion" 
ALTER COLUMN "AlertarNuevoDispositivo" SET NOT NULL,
ALTER COLUMN "AlertarNuevoDispositivo" SET DEFAULT true;

ALTER TABLE "public"."Configuracion" 
ALTER COLUMN "BloquearPorInactividad" SET NOT NULL,
ALTER COLUMN "BloquearPorInactividad" SET DEFAULT false;

ALTER TABLE "public"."Configuracion" 
ALTER COLUMN "RecordarSesion30Dias" SET NOT NULL,
ALTER COLUMN "RecordarSesion30Dias" SET DEFAULT true;

-- =====================================================
-- FIN MIGRACIÓN
-- =====================================================

