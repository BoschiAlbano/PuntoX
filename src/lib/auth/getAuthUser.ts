import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import prisma from "@/DB/prisma";

// Cache simple para verificación de sesión activa (evita verificar en cada request)
const sesionActivaCache = new Map<string, { valido: boolean; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 segundos de cache

/**
 * Invalida el cache de sesión activa para un usuario específico
 * Útil cuando se cierra una sesión
 */
export function invalidarCacheSesionActiva(userId: string, tenantId: number | string) {
  const cacheKey = `${userId}-${tenantId}`;
  sesionActivaCache.delete(cacheKey);
}

/**
 * Obtiene el usuario autenticado y su tenantId desde Supabase app_metadata
 * Soporta tanto tenantId (camelCase) como tenant_id (snake_case)
 * @param verificarSesionActiva - Si es true, verifica que el usuario tenga al menos una sesión activa en la BD (por defecto: false para mejor performance)
 * @returns Objeto con user, tenantId y una función errorResponse si no está autenticado
 */
export async function getAuthUser(verificarSesionActiva: boolean = false) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Si hay error al obtener el usuario o no hay usuario
  if (authError || !user) {
    console.error("[getAuthUser] Error al obtener usuario:", authError?.message || "Usuario no encontrado");
    return {
      user: null,
      tenantId: null,
      error: NextResponse.json({ message: "No autenticado" }, { status: 401 }),
    };
  }

  // Obtener tenantId de app_metadata (busca primero tenant_id, luego tenantId como fallback)
  const tenantId = user?.app_metadata?.tenant_id || user?.app_metadata?.tenantId;

  // Si no hay tenantId, retornamos un objeto con error
  if (!tenantId) {
    console.error("[getAuthUser] Usuario sin tenantId en app_metadata:", {
      userId: user.id,
      email: user.email,
      app_metadata: user.app_metadata,
    });
    return {
      user: null,
      tenantId: null,
      error: NextResponse.json({ 
        message: "Usuario sin tenantId configurado",
        details: "El usuario no tiene un tenantId asociado en app_metadata"
      }, { status: 401 }),
    };
  }

  // Verificar si el usuario tiene sesiones activas (opcional, para detectar sesiones cerradas)
  if (verificarSesionActiva) {
    try {
      const cacheKey = `${user.id}-${tenantId}`;
      const cached = sesionActivaCache.get(cacheKey);
      const now = Date.now();

      // Si hay cache válido, usarlo
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        if (!cached.valido) {
          return {
            user: null,
            tenantId: null,
            error: NextResponse.json({ 
              message: "Sesión cerrada",
              details: "Tu sesión ha sido cerrada. Por favor, inicia sesión nuevamente.",
              sesionCerrada: true
            }, { status: 401 }),
          };
        }
      } else {
        // Verificar en BD solo si no hay cache o está expirado
        const usuario = await prisma.usuario.findFirst({
          where: {
            AuthUserId: user.id,
            TenantId: BigInt(tenantId),
            EstaEliminado: false,
          },
          select: { Id: true },
        });

        if (usuario) {
          // Verificación optimizada: solo verificar si existe al menos una sesión activa (más rápido que COUNT)
          const sesionesActivas = await prisma.$queryRawUnsafe<Array<{
            Id: bigint;
          }>>(`
            SELECT "Id"
            FROM "SesionActiva"
            WHERE "TenantId" = $1
              AND "UsuarioId" = $2
              AND "EstaActiva" = true
            LIMIT 1
          `, BigInt(tenantId), usuario.Id);

          const tieneSesionActiva = sesionesActivas && sesionesActivas.length > 0;

          // Actualizar cache
          sesionActivaCache.set(cacheKey, {
            valido: tieneSesionActiva,
            timestamp: now
          });

          // Limpiar cache expirado periódicamente (solo mantener últimos 100)
          if (sesionActivaCache.size > 100) {
            for (const [key, value] of sesionActivaCache.entries()) {
              if ((now - value.timestamp) > CACHE_TTL) {
                sesionActivaCache.delete(key);
              }
            }
          }

          if (!tieneSesionActiva) {
            return {
              user: null,
              tenantId: null,
              error: NextResponse.json({ 
                message: "Sesión cerrada",
                details: "Tu sesión ha sido cerrada. Por favor, inicia sesión nuevamente.",
                sesionCerrada: true
              }, { status: 401 }),
            };
          }
        }
      }
    } catch (error) {
      // Si hay error verificando la sesión, continuar (no bloquear el acceso)
      console.warn("[getAuthUser] Error verificando sesión activa:", error);
    }
  }

  return {
    user,
    tenantId: Number(tenantId),
    error: null,
  };
}
