-- =====================================================
-- MIGRACIÓN: Agregar SUPERADMIN al enum PerfilTipo
-- =====================================================
-- Agrega el valor SUPERADMIN al enum PerfilTipo existente
-- =====================================================

-- Agregar valor SUPERADMIN al enum PerfilTipo
-- Nota: PostgreSQL no soporta IF NOT EXISTS en ALTER TYPE ADD VALUE
-- Si el valor ya existe, esta migración fallará, pero eso es esperado
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'SUPERADMIN' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PerfilTipo')
    ) THEN
        ALTER TYPE "public"."PerfilTipo" ADD VALUE 'SUPERADMIN';
    END IF;
END $$;

-- =====================================================
-- FIN MIGRACIÓN
-- =====================================================

