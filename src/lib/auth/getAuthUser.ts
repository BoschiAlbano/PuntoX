import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import prisma from "@/DB/prisma";
import { User } from "@supabase/supabase-js";
import { PerfilTipo, Prisma } from "../../../prisma/generated/prisma";
import { PermisoError } from "../requirePermiso";
import { Permission } from "./permissions";
import { getRequestAuthContext, setRequestAuthContext } from "./requestContext";
import { cookies } from "next/headers";

// Definimos el tipo del resultado de la consulta de usuario
type UserContextData = Prisma.UsuarioGetPayload<{
  select: {
    Id: true;
    EstaBloqueado: true;
    PerfilUsuario: {
      select: {
        Perfiles: { select: { Tipo: true } };
      };
    };
  };
}>;

// ============================================================================
// CACHES - Optimización de rendimiento
// ============================================================================

// Cache de JWT de Supabase (evita llamadas de red)
const jwtCache = new Map<string, { user: User; timestamp: number }>();
const JWT_CACHE_TTL = 60 * 1000; // 60 segundos

// Cache de datos de usuario de la DB
const userContextCache = new Map<
  string,
  { data: UserContextData; timestamp: number }
>();

// Cache de acceso a sucursales
const branchAccessCache = new Map<
  string,
  { valid: boolean; timestamp: number }
>();

// Cache de sesiones activas (para logout forzado)
const sessionCache = new Map<string, { valid: boolean; timestamp: number }>();

const DB_CACHE_TTL = 30 * 1000; // 30 segundos para datos de DB

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface AuthContext {
  user: User;
  tenantId: number;
  usuarioId: number;
  sucursalId: number; // 0 si no se especificó header
  isSuperAdmin: boolean;
  permissions: string[]; // Permisos del usuario desde JWT
}

interface GetAuthContextOptions {
  req?: NextRequest; // Para leer headers (x-sucursal-id)
  permission?: Permission; // Permiso requerido (tipo estricto)
  checkActiveSession?: boolean; // Verificar en DB si la sesión sigue activa
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE AUTENTICACIÓN
// ============================================================================

/**
 * Función UNIFICADA de seguridad para Backend (API Routes / Server Actions).
 *
 * Valida:
 * 1. Autenticación (Supabase JWT con cache)
 * 2. Tenant (app_metadata)
 * 3. Sucursal (Header x-sucursal-id + pertenencia en DB)
 * 4. Permisos (JWT)
 *
 * Optimizaciones implementadas:
 * - JWT caching (evita llamadas a Supabase)
 * - Request-level caching (evita múltiples validaciones en el mismo request)
 * - DB query caching (reduce queries repetitivas)
 * - Tipos estrictos para permisos
 */
export async function getAuthContext(
  options: GetAuthContextOptions = {},
): Promise<AuthContext> {
  // 🚀 OPTIMIZACIÓN: Request-level cache
  // Si ya validamos este request, retornar resultado cacheado
  const cachedContext = getRequestAuthContext();
  if (cachedContext) {
    // Validar permiso si se requiere uno nuevo
    if (options.permission && !cachedContext.isSuperAdmin) {
      if (!cachedContext.permissions.includes(options.permission)) {
        throw new PermisoError(`Permiso denegado: ${options.permission}`, 403);
      }
    }
    return cachedContext;
  }

  const { req, permission, checkActiveSession = false } = options;

  // 1. 🚀 Autenticación con JWT caching
  const user = await getCachedUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  // 2. Extraer Tenant
  const tenantIdRaw =
    user.app_metadata?.tenant_id || user.app_metadata?.tenantId;
  if (!tenantIdRaw) {
    throw new Error("Usuario sin TenantId configurado");
  }
  const tenantId = Number(tenantIdRaw);

  // 3. Verificar Sesión Activa (Opcional, para logout forzado)
  if (checkActiveSession) {
    const isValid = await checkSessionAlive(user.id, tenantId);
    if (!isValid) throw new Error("Sesión cerrada o expirada");
  }

  // 4. 🚀 Buscar Usuario en DB con cache
  const dbUsuario = await getCachedUserContext(user.id, tenantId);

  if (!dbUsuario) throw new Error("Usuario no encontrado en base de datos");
  if (dbUsuario.EstaBloqueado) throw new Error("Usuario bloqueado");

  const usuarioId = Number(dbUsuario.Id);
  const isSuperAdmin = dbUsuario.PerfilUsuario.some(
    (pu) => pu.Perfiles.Tipo === PerfilTipo.SUPERADMIN,
  );

  // 5. 🚀 Validar Sucursal con cache (Si se provee request)
  let sucursalId = 0;
  if (req) {
    const sucursalHeader = req.headers.get("x-sucursal-id");
    if (sucursalHeader) {
      sucursalId = Number(sucursalHeader);

      // Si es SuperAdmin, tiene acceso a todo. Si no, verificamos.
      if (!isSuperAdmin) {
        const tieneAcceso = await getCachedBranchAccess(
          usuarioId,
          sucursalId,
          tenantId,
        );

        if (!tieneAcceso) {
          throw new Error("No tienes acceso a la sucursal solicitada");
        }
      }
    }
  }

  // 6. 🚀 Validar Permiso (Solo JWT, sin fallback a DB)
  let permissions = (user.app_metadata?.permissions as string[]) || [];

  if (permission && !isSuperAdmin) {
    if (!permissions.includes(permission)) {
      // 🚀 FALLBACK: Verificar en DB por si el token está stale (no actualizado)
      // Esto pasa cuando se asignan permisos pero el usuario no ha relogueado
      try {
        const { calcularPermisosUsuario } =
          await import("./updateUserPermissions");
        const { permisos: dbPermissions } = await calcularPermisosUsuario(
          user.id,
        );

        if (!dbPermissions.includes(permission)) {
          throw new PermisoError(`Permiso denegado: ${permission}`, 403);
        }
        // Si tiene permiso en DB, permitimos continuar
        // Nota: El JWT seguirá stale hasta el próximo login/refresh
        permissions = dbPermissions;
      } catch (error) {
        if (error instanceof PermisoError) throw error;
        // Si falla la verificación en DB, asumir que no tiene permiso
        throw new PermisoError(`Permiso denegado: ${permission}`, 403);
      }
    }
  }

  // Construir contexto
  const context: AuthContext = {
    user,
    tenantId,
    usuarioId,
    sucursalId,
    isSuperAdmin,
    permissions,
  };

  // 🚀 Guardar en request-level cache
  setRequestAuthContext(context);

  return context;
}

// ============================================================================
// HELPER FUNCTIONS - Caching optimizado
// ============================================================================

/**
 * 🚀 Obtiene el usuario de Supabase con JWT caching
 * Evita llamadas de red repetitivas a Supabase
 */
async function getCachedUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("sb-access-token")?.value ||
    cookieStore.get("supabase-auth-token")?.value;

  if (!accessToken) {
    // Si no hay token, hacer llamada normal
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  // Verificar cache
  const cached = jwtCache.get(accessToken);
  const now = Date.now();

  if (cached && now - cached.timestamp < JWT_CACHE_TTL) {
    return cached.user;
  }

  // Cache miss - obtener de Supabase
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user && !error) {
    jwtCache.set(accessToken, { user, timestamp: now });

    // Limpieza periódica del cache (cada 100 requests aprox)
    if (Math.random() < 0.01) {
      cleanExpiredCache(jwtCache, JWT_CACHE_TTL);
    }
  }

  return user;
}

/**
 * 🚀 Obtiene datos del usuario de la DB con cache
 */
async function getCachedUserContext(
  authUserId: string,
  tenantId: number,
): Promise<UserContextData | null> {
  const cacheKey = `${authUserId}-${tenantId}`;
  const now = Date.now();
  const cached = userContextCache.get(cacheKey);

  if (cached && now - cached.timestamp < DB_CACHE_TTL) {
    return cached.data;
  }

  const dbUsuario = await prisma.usuario.findFirst({
    where: {
      AuthUserId: authUserId,
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
    },
    select: {
      Id: true,
      EstaBloqueado: true,
      PerfilUsuario: {
        select: {
          Perfiles: { select: { Tipo: true } },
        },
      },
    },
  });

  if (dbUsuario) {
    userContextCache.set(cacheKey, { data: dbUsuario, timestamp: now });
  }

  return dbUsuario;
}

/**
 * 🚀 Valida acceso a sucursal con cache
 */
async function getCachedBranchAccess(
  usuarioId: number,
  sucursalId: number,
  tenantId: number,
): Promise<boolean> {
  const cacheKey = `${usuarioId}-${sucursalId}-${tenantId}`;
  const now = Date.now();
  const cached = branchAccessCache.get(cacheKey);

  if (cached && now - cached.timestamp < DB_CACHE_TTL) {
    return cached.valid;
  }

  const count = await prisma.usuarioSucursal.count({
    where: {
      UsuarioId: BigInt(usuarioId),
      SucursalId: BigInt(sucursalId),
      TenantId: BigInt(tenantId),
    },
  });

  const isValid = count > 0;
  branchAccessCache.set(cacheKey, { valid: isValid, timestamp: now });
  return isValid;
}

/**
 * Verifica si la sesión sigue activa en la DB
 */
async function checkSessionAlive(
  userId: string,
  tenantId: number,
): Promise<boolean> {
  const cacheKey = `${userId}-${tenantId}`;
  const now = Date.now();
  const cached = sessionCache.get(cacheKey);

  if (cached && now - cached.timestamp < DB_CACHE_TTL) {
    return cached.valid;
  }

  // Verificar en DB con query optimizada
  const sesiones = await prisma.$queryRaw`
    SELECT "Id" FROM "SesionActiva"
    WHERE "TenantId" = ${BigInt(tenantId)}
    AND "UsuarioId" = (SELECT "Id" FROM "Usuario" WHERE "AuthUserId" = ${userId} LIMIT 1)
    AND "EstaActiva" = true
    LIMIT 1
  `;

  const isValid = Array.isArray(sesiones) && sesiones.length > 0;

  sessionCache.set(cacheKey, { valid: isValid, timestamp: now });
  return isValid;
}

/**
 * Limpia entradas expiradas del cache
 */
function cleanExpiredCache<T>(
  cache: Map<string, { timestamp: number } & T>,
  ttl: number,
): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > ttl) {
      cache.delete(key);
    }
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD Y COMPATIBILIDAD
// ============================================================================

/**
 * 🚀 Invalida todos los caches de un usuario específico
 * Útil cuando cambian permisos o se bloquea al usuario
 */
export function invalidateUserCache(authUserId: string, tenantId?: number) {
  // Limpiar JWT cache (todas las entradas del usuario)
  for (const [key] of jwtCache.entries()) {
    jwtCache.delete(key);
  }

  // Limpiar user context cache
  if (tenantId) {
    userContextCache.delete(`${authUserId}-${tenantId}`);
    sessionCache.delete(`${authUserId}-${tenantId}`);
  } else {
    // Limpiar todas las entradas del usuario
    for (const [key] of userContextCache.entries()) {
      if (key.startsWith(`${authUserId}-`)) {
        userContextCache.delete(key);
      }
    }
    for (const [key] of sessionCache.entries()) {
      if (key.startsWith(`${authUserId}-`)) {
        sessionCache.delete(key);
      }
    }
  }
}

/**
 * 🚀 Invalida cache de acceso a sucursales
 */
export function invalidateBranchCache(usuarioId: number) {
  for (const [key] of branchAccessCache.entries()) {
    if (key.startsWith(`${usuarioId}-`)) {
      branchAccessCache.delete(key);
    }
  }
}

/**
 * Mantenemos compatibilidad hacia atrás (deprecado)
 * @deprecated Usar getAuthContext directamente
 */
export async function getAuthUser(verificarSesionActiva: boolean = false) {
  try {
    const ctx = await getAuthContext({
      checkActiveSession: verificarSesionActiva,
    });
    return {
      user: ctx.user,
      tenantId: ctx.tenantId,
      error: null,
    };
  } catch (e: any) {
    return {
      user: null,
      tenantId: null,
      error: NextResponse.json({ message: e.message }, { status: 401 }),
    };
  }
}
