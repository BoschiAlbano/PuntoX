-- Índices de optimización para el sistema de autenticación
-- Estos índices mejoran significativamente el rendimiento de las consultas de seguridad

-- ============================================================================
-- TABLA Usuario - Índices para autenticación
-- ============================================================================

-- Índice compuesto para búsqueda de usuario por AuthUserId y TenantId
-- Usado en: getAuthContext -> getCachedUserContext
CREATE INDEX IF NOT EXISTS "idx_usuario_auth_tenant" 
ON "Usuario"("AuthUserId", "TenantId") 
WHERE "EstaEliminado" = false;

-- Índice para búsqueda por TenantId solo (consultas de listado)
CREATE INDEX IF NOT EXISTS "idx_usuario_tenant" 
ON "Usuario"("TenantId") 
WHERE "EstaEliminado" = false;

-- Índice para estado de bloqueo
CREATE INDEX IF NOT EXISTS "idx_usuario_bloqueado" 
ON "Usuario"("EstaBloqueado") 
WHERE "EstaEliminado" = false;

-- ============================================================================
-- TABLA UsuarioSucursal - Índices para validación de acceso a sucursales
-- ============================================================================

-- Índice compuesto para validación de acceso a sucursal
-- Usado en: getAuthContext -> getCachedBranchAccess
CREATE INDEX IF NOT EXISTS "idx_usuario_sucursal_lookup" 
ON "UsuarioSucursal"("UsuarioId", "SucursalId", "TenantId");

-- Índice para buscar sucursales de un usuario
CREATE INDEX IF NOT EXISTS "idx_usuario_sucursal_usuario" 
ON "UsuarioSucursal"("UsuarioId") 
WHERE "TenantId" IS NOT NULL;

-- Índice para buscar usuario por sucursal default
CREATE INDEX IF NOT EXISTS "idx_usuario_sucursal_default" 
ON "UsuarioSucursal"("UsuarioId", "EsDefault") 
WHERE "EsDefault" = true;

-- ============================================================================
-- TABLA PerfilUsuario - Índices para validación de roles
-- ============================================================================

-- Índice para buscar perfiles de un usuario
CREATE INDEX IF NOT EXISTS "idx_perfil_usuario_lookup" 
ON "PerfilUsuario"("Usuario_Id", "TenantId");

-- Índice para buscar usuarios por perfil
CREATE INDEX IF NOT EXISTS "idx_perfil_usuario_perfil" 
ON "PerfilUsuario"("Perfil_Id", "TenantId");

-- ============================================================================
-- TABLA SesionActiva - Índices para validación de sesiones
-- ============================================================================

-- Índice compuesto para verificación de sesión activa
-- Usado en: getAuthContext -> checkSessionAlive
CREATE INDEX IF NOT EXISTS "idx_sesion_activa_lookup" 
ON "SesionActiva"("TenantId", "UsuarioId", "EstaActiva") 
WHERE "EstaActiva" = true;

-- Índice para limpiar sesiones inactivas
CREATE INDEX IF NOT EXISTS "idx_sesion_activa_fecha" 
ON "SesionActiva"("FechaUltimaActividad") 
WHERE "EstaActiva" = true;

-- ============================================================================
-- TABLA Persona - Índices para búsquedas de empleados
-- ============================================================================

-- Índice compuesto para búsquedas textuales
CREATE INDEX IF NOT EXISTS "idx_persona_busqueda" 
ON "Persona"("TenantId", "EstaEliminado", "Nombre", "Apellido");

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS "idx_persona_email" 
ON "Persona"("Mail", "TenantId") 
WHERE "EstaEliminado" = false;

-- Índice para búsqueda por DNI
CREATE INDEX IF NOT EXISTS "idx_persona_dni" 
ON "Persona"("Dni", "TenantId") 
WHERE "EstaEliminado" = false;

-- ============================================================================
-- TABLA Sucursal - Índices para consultas de sucursales
-- ============================================================================

-- Índice para buscar sucursales activas por tenant
CREATE INDEX IF NOT EXISTS "idx_sucursal_tenant_activa" 
ON "Sucursal"("TenantId", "EstaActiva") 
WHERE "EstaEliminado" = false;

-- ============================================================================
-- TABLA Perfiles - Índices para consultas de roles
-- ============================================================================

-- Índice para buscar perfiles por tenant
CREATE INDEX IF NOT EXISTS "idx_perfiles_tenant" 
ON "Perfiles"("TenantId") 
WHERE "EstaEliminado" = false;

-- Índice para buscar por tipo de perfil
CREATE INDEX IF NOT EXISTS "idx_perfiles_tipo" 
ON "Perfiles"("Tipo", "TenantId") 
WHERE "EstaEliminado" = false;

-- ============================================================================
-- NOTAS DE OPTIMIZACIÓN
-- ============================================================================

-- Estos índices mejoran el rendimiento de las consultas más frecuentes:
-- 1. Validación de autenticación (Usuario + TenantId)
-- 2. Validación de acceso a sucursales
-- 3. Verificación de permisos/roles
-- 4. Verificación de sesiones activas
-- 5. Búsquedas de empleados

-- Para PostgreSQL, también se recomienda ejecutar ANALYZE después de crear índices:
-- ANALYZE "Usuario";
-- ANALYZE "UsuarioSucursal";
-- ANALYZE "PerfilUsuario";
-- ANALYZE "SesionActiva";
-- ANALYZE "Persona";
-- ANALYZE "Sucursal";
-- ANALYZE "Perfiles";
