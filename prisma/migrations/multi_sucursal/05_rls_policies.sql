-- =====================================================
-- POLÍTICAS RLS PARA MULTI-SUCURSAL
-- =====================================================
-- 
-- Este script define las políticas de Row Level Security (RLS)
-- para tablas con scope de tenant y sucursal.
-- 
-- REQUISITOS:
-- 1. El JWT debe contener los claims: tenant_id y branch_id
-- 2. Usar set_config para pasar el branch_id en queries server-side
-- 
-- NOTA: Estas políticas son RECOMENDACIONES.
-- Ajustar según la configuración específica de Supabase.
-- 
-- =====================================================

-- =====================================================
-- FUNCIONES HELPER PARA RLS
-- =====================================================

-- Función para obtener tenant_id del JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS BIGINT AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id')::BIGINT,
    (current_setting('app.tenant_id', true))::BIGINT
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener branch_id del JWT o config
CREATE OR REPLACE FUNCTION auth.branch_id()
RETURNS BIGINT AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'branch_id')::BIGINT,
    (current_setting('app.branch_id', true))::BIGINT
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar acceso a sucursal
-- Verifica que el usuario tenga acceso a la sucursal indicada
CREATE OR REPLACE FUNCTION auth.has_branch_access(branch_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id BIGINT;
  has_access BOOLEAN;
BEGIN
  -- Obtener usuario actual
  user_id := (current_setting('request.jwt.claims', true)::json->>'user_id')::BIGINT;
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si el usuario tiene acceso a la sucursal
  SELECT EXISTS (
    SELECT 1 FROM "public"."UsuarioSucursal" us
    WHERE us."UsuarioId" = user_id
    AND us."SucursalId" = branch_id
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HABILITAR RLS EN TABLAS
-- =====================================================

-- Sucursal
ALTER TABLE "public"."Sucursal" ENABLE ROW LEVEL SECURITY;

-- UsuarioSucursal
ALTER TABLE "public"."UsuarioSucursal" ENABLE ROW LEVEL SECURITY;

-- ArticuloStock
ALTER TABLE "public"."ArticuloStock" ENABLE ROW LEVEL SECURITY;

-- Caja
ALTER TABLE "public"."Caja" ENABLE ROW LEVEL SECURITY;

-- Gasto
ALTER TABLE "public"."Gasto" ENABLE ROW LEVEL SECURITY;

-- Movimiento
ALTER TABLE "public"."Movimiento" ENABLE ROW LEVEL SECURITY;

-- Comprobante
ALTER TABLE "public"."Comprobante" ENABLE ROW LEVEL SECURITY;

-- BajaArticulo
ALTER TABLE "public"."BajaArticulo" ENABLE ROW LEVEL SECURITY;

-- Cheque
ALTER TABLE "public"."Cheque" ENABLE ROW LEVEL SECURITY;

-- DepositoCheques
ALTER TABLE "public"."DepositoCheques" ENABLE ROW LEVEL SECURITY;

-- Contador
ALTER TABLE "public"."Contador" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA SUCURSAL
-- =====================================================

-- Solo ver sucursales del propio tenant
CREATE POLICY "sucursal_tenant_isolation" ON "public"."Sucursal"
  FOR ALL
  USING ("TenantId" = auth.tenant_id());

-- =====================================================
-- POLÍTICAS PARA USUARIO_SUCURSAL
-- =====================================================

-- Solo ver asignaciones del propio tenant
CREATE POLICY "usuario_sucursal_tenant_isolation" ON "public"."UsuarioSucursal"
  FOR ALL
  USING ("TenantId" = auth.tenant_id());

-- =====================================================
-- POLÍTICAS PARA ARTICULO_STOCK
-- =====================================================

-- Ver stock: solo del tenant y sucursal activa
CREATE POLICY "articulo_stock_select" ON "public"."ArticuloStock"
  FOR SELECT
  USING (
    "TenantId" = auth.tenant_id()
    AND (
      -- Si hay branch_id activo, filtrar por él
      auth.branch_id() IS NULL 
      OR "SucursalId" = auth.branch_id()
    )
  );

-- Modificar stock: solo de la sucursal activa
CREATE POLICY "articulo_stock_modify" ON "public"."ArticuloStock"
  FOR ALL
  USING (
    "TenantId" = auth.tenant_id()
    AND "SucursalId" = auth.branch_id()
  );

-- =====================================================
-- POLÍTICAS PARA CAJA
-- =====================================================

-- Ver cajas: solo del tenant y sucursal activa
CREATE POLICY "caja_select" ON "public"."Caja"
  FOR SELECT
  USING (
    "TenantId" = auth.tenant_id()
    AND (
      auth.branch_id() IS NULL 
      OR "SucursalId" = auth.branch_id()
    )
  );

-- Crear/modificar caja: solo en la sucursal activa
CREATE POLICY "caja_modify" ON "public"."Caja"
  FOR INSERT
  WITH CHECK (
    "TenantId" = auth.tenant_id()
    AND "SucursalId" = auth.branch_id()
  );

CREATE POLICY "caja_update" ON "public"."Caja"
  FOR UPDATE
  USING (
    "TenantId" = auth.tenant_id()
    AND "SucursalId" = auth.branch_id()
  );

-- =====================================================
-- POLÍTICAS PARA COMPROBANTE
-- =====================================================

-- Ver comprobantes: solo del tenant y sucursal activa
CREATE POLICY "comprobante_select" ON "public"."Comprobante"
  FOR SELECT
  USING (
    "TenantId" = auth.tenant_id()
    AND (
      auth.branch_id() IS NULL 
      OR "SucursalId" = auth.branch_id()
    )
  );

-- Crear comprobante: solo en la sucursal activa
CREATE POLICY "comprobante_insert" ON "public"."Comprobante"
  FOR INSERT
  WITH CHECK (
    "TenantId" = auth.tenant_id()
    AND "SucursalId" = auth.branch_id()
  );

-- =====================================================
-- POLÍTICAS PARA MOVIMIENTO
-- =====================================================

CREATE POLICY "movimiento_tenant_branch" ON "public"."Movimiento"
  FOR ALL
  USING (
    "TenantId" = auth.tenant_id()
    AND (
      auth.branch_id() IS NULL 
      OR "SucursalId" = auth.branch_id()
    )
  );

-- =====================================================
-- POLÍTICAS PARA GASTO
-- =====================================================

CREATE POLICY "gasto_tenant_branch" ON "public"."Gasto"
  FOR ALL
  USING (
    "TenantId" = auth.tenant_id()
    AND (
      auth.branch_id() IS NULL 
      OR "SucursalId" = auth.branch_id()
    )
  );

-- =====================================================
-- POLÍTICAS PARA BAJA_ARTICULO
-- =====================================================

CREATE POLICY "baja_articulo_tenant_branch" ON "public"."BajaArticulo"
  FOR ALL
  USING (
    "TenantId" = auth.tenant_id()
    AND (
      auth.branch_id() IS NULL 
      OR "SucursalId" = auth.branch_id()
    )
  );

-- =====================================================
-- POLÍTICAS PARA CHEQUE
-- =====================================================

CREATE POLICY "cheque_tenant_branch" ON "public"."Cheque"
  FOR ALL
  USING (
    "TenantId" = auth.tenant_id()
    AND (
      auth.branch_id() IS NULL 
      OR "SucursalId" = auth.branch_id()
    )
  );

-- =====================================================
-- POLÍTICAS PARA DEPOSITO_CHEQUES
-- =====================================================

CREATE POLICY "deposito_cheques_tenant_branch" ON "public"."DepositoCheques"
  FOR ALL
  USING (
    "TenantId" = auth.tenant_id()
    AND (
      auth.branch_id() IS NULL 
      OR "SucursalId" = auth.branch_id()
    )
  );

-- =====================================================
-- POLÍTICAS PARA CONTADOR
-- =====================================================

CREATE POLICY "contador_tenant_branch" ON "public"."Contador"
  FOR ALL
  USING (
    "TenantId" = auth.tenant_id()
    AND (
      auth.branch_id() IS NULL 
      OR "SucursalId" = auth.branch_id()
    )
  );

-- =====================================================
-- NOTAS PARA REPORTES GLOBALES (CROSS-BRANCH)
-- =====================================================
-- 
-- Para consultas que necesitan ver datos de TODAS las sucursales
-- (ej: reportes consolidados), hay dos opciones:
-- 
-- OPCIÓN 1: Usar service_role key (bypasea RLS)
-- - Solo desde server-side
-- - Requiere validar permisos manualmente
-- 
-- OPCIÓN 2: Crear función con SECURITY DEFINER
-- ```sql
-- CREATE OR REPLACE FUNCTION get_tenant_consolidated_sales(p_tenant_id BIGINT)
-- RETURNS TABLE (
--   sucursal_id BIGINT,
--   sucursal_nombre VARCHAR,
--   total_ventas DECIMAL
-- ) AS $$
-- BEGIN
--   -- Verificar que el usuario pertenece al tenant
--   IF auth.tenant_id() != p_tenant_id THEN
--     RAISE EXCEPTION 'Acceso denegado';
--   END IF;
--   
--   RETURN QUERY
--   SELECT 
--     s."Id",
--     s."Nombre",
--     COALESCE(SUM(c."Total"), 0)
--   FROM "public"."Sucursal" s
--   LEFT JOIN "public"."Comprobante" c ON c."SucursalId" = s."Id"
--   WHERE s."TenantId" = p_tenant_id
--   GROUP BY s."Id", s."Nombre";
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
-- ```
-- 
-- =====================================================
-- FIN POLÍTICAS RLS
-- =====================================================

