import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import prisma from "@/DB/prisma";
import { User } from "@supabase/supabase-js";
import { PerfilTipo } from "../../../prisma/generated/prisma";
import { PermisoError } from "../requirePermiso";

// Cache simple para verificación de sesión activa
const sessionCache = new Map<string, { valid: boolean; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 segundos

export interface AuthContext {
  user: User;
  tenantId: number;
  usuarioId: number;
  sucursalId: number; // Siempre presente si se valida contexto
  isSuperAdmin: boolean;
}

interface GetAuthContextOptions {
  req?: NextRequest; // Para leer headers (x-sucursal-id)
  permission?: string; // Permiso requerido
  checkActiveSession?: boolean; // Verificar en DB si la sesión sigue activa
}

/**
 * Función UNIFICADA de seguridad para Backend (API Routes / Server Actions).
 * Valida:
 * 1. Autenticación (Supabase)
 * 2. Tenant (app_metadata)
 * 3. Sucursal (Header x-sucursal-id + pertenencia en DB)
 * 4. Permisos (JWT o DB)
 */
export async function getAuthContext(
  options: GetAuthContextOptions = {}
): Promise<AuthContext> {
  const { req, permission, checkActiveSession = false } = options;
  const supabase = await getSupabaseServerClient();

  // 1. Autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
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

  // Buscar Usuario en DB para obtener ID numérico y validar estado
  // Usamos cache de request si fuera necesario, pero aquí es directo
  const dbUsuario = await prisma.usuario.findFirst({
    where: {
      AuthUserId: user.id,
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

  if (!dbUsuario) throw new Error("Usuario no encontrado en base de datos");
  if (dbUsuario.EstaBloqueado) throw new Error("Usuario bloqueado");

  const usuarioId = Number(dbUsuario.Id);
  const isSuperAdmin = dbUsuario.PerfilUsuario.some(
    (pu) => pu.Perfiles.Tipo === PerfilTipo.SUPERADMIN
  );

  // 4. Validar Sucursal (Si se provee request)
  let sucursalId = 0;
  if (req) {
    const sucursalHeader = req.headers.get("x-sucursal-id");
    if (sucursalHeader) {
      sucursalId = Number(sucursalHeader);

      // Si es SuperAdmin, tiene acceso a todo. Si no, verificamos.
      if (!isSuperAdmin) {
        const tieneAcceso = await prisma.usuarioSucursal.count({
          where: {
            UsuarioId: BigInt(usuarioId),
            SucursalId: BigInt(sucursalId),
            TenantId: BigInt(tenantId),
          },
        });

        if (tieneAcceso === 0) {
          throw new Error("No tienes acceso a la sucursal solicitada");
        }
      }
    } else {
      // Si el endpoint requiere contexto de sucursal pero no se envió header
      // Podríamos fallar o dejar pasar si es una operación global.
      // Por seguridad "secure by default", si no hay header, sucursalId es 0.
      // Si la lógica de negocio necesita sucursal, fallará más adelante.
    }
  }

  // 5. Validar Permiso (Si se requiere)
  if (permission) {
    // Si es SuperAdmin, pase libre
    if (!isSuperAdmin) {
      // Reutilizamos la lógica robusta de requirePermiso
      // Nota: requirePermiso hace sus propias queries, podríamos optimizarlo
      // integrando la lógica aquí, pero por ahora delegamos.
      // Hack: requirePermiso espera obtener el user de supabase de nuevo.
      // Para optimizar, le pasamos el permiso a validar manual o llamamos a la función.

      // Verificación rápida en JWT
      const permisosJWT = (user.app_metadata?.permissions as string[]) || [];
      if (!permisosJWT.includes(permission)) {
        // Fallback a DB (más lento pero seguro si el JWT está desactualizado)
        // Por ahora lanzamos error, el cliente debería refrescar token si faltan permisos.
        throw new PermisoError(`Permiso denegado: ${permission}`, 403);
      }
    }
  }

  return {
    user,
    tenantId,
    usuarioId,
    sucursalId,
    isSuperAdmin,
  };
}

// Helper interno para cache de sesión
async function checkSessionAlive(userId: string, tenantId: number) {
  const cacheKey = `${userId}-${tenantId}`;
  const now = Date.now();
  const cached = sessionCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.valid;
  }

  // Verificar en DB
  // Optimizamos query raw para velocidad
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

// Mantenemos compatibilidad hacia atrás temporalmente (opcional)
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
