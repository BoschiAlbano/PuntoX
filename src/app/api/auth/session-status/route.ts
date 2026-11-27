import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import prisma from "@/DB/prisma";
import { sessionIdDesdeCookies } from "@/lib/auth/sesionActual";

/**
 * GET /api/auth/session-status
 *
 * Heartbeat: verifica si la sesión del usuario sigue activa en nuestra DB.
 * El sessionProvider del cliente lo llama cada 30 segundos.
 *
 * Respuestas:
 * - 200 { activa: true }                            → sesión válida.
 * - 200 { activa: false, sesionCerrada: true }      → sesión cerrada remotamente.
 * - 200 { activa: false, sesionExpirada: true }     → inactiva por más de N días (config del tenant).
 * - 200 { activa: false }                           → token inválido/expirado (flujo normal de Supabase).
 *
 * ⚠️ Read-only para cookies: en GET handlers Next.js no permite modificar cookies.
 * Creamos un cliente Supabase con set/remove como no-ops y leemos el JWT directamente.
 * Las operaciones de escritura a la DB (Prisma) sí están permitidas.
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ activa: true }, { status: 200 });
    }

    // Cliente Supabase read-only (set/remove son no-ops para no violar restricción de GET handler)
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set() {
          // No-op intencional: GET handler no puede modificar cookies
        },
        remove() {
          // No-op intencional: GET handler no puede modificar cookies
        },
      },
    });

    // getUser() valida el JWT con Supabase sin necesitar escribir cookies
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ activa: false }, { status: 200 });
    }

    const tenantId =
      user.app_metadata?.tenantId || user.app_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ activa: false }, { status: 200 });
    }

    // Identificar ESTA sesión por el session_id del JWT (cookie de Supabase).
    // Si no se puede identificar, no se expulsa a nadie: antes se tomaba "la
    // sesión más reciente del usuario", que podía ser la de otro dispositivo,
    // y cerrar sesión en uno desconectaba a todos.
    const supabaseSessionId = sessionIdDesdeCookies(req.cookies.getAll());
    if (!supabaseSessionId) {
      return NextResponse.json({ activa: true }, { status: 200 });
    }

    const [sesiones, configTenant] = await Promise.all([
      prisma.$queryRawUnsafe<
        Array<{ Id: bigint; FechaUltimaActividad: Date; EstaActiva: boolean }>
      >(
        `
        SELECT sa."Id", sa."FechaUltimaActividad", sa."EstaActiva"
        FROM "SesionActiva" sa
        INNER JOIN "Usuario" u ON sa."UsuarioId" = u."Id"
        WHERE u."AuthUserId" = $1
          AND sa."TenantId" = $2
          AND sa."SupabaseSessionId" = $3
        ORDER BY sa."FechaUltimaActividad" DESC
        LIMIT 1
      `,
        user.id,
        BigInt(tenantId),
        supabaseSessionId,
      ),
      prisma.configuracion.findFirst({
        where: { TenantId: BigInt(tenantId), EstaEliminado: false },
        select: {
          ExpirarSesiones30Dias: true,
          DiasExpiracionSesion: true,
        },
      }),
    ]);

    // Sin ningún registro → usuario recién logueado, sesión aún no registrada en DB.
    // No patear: el POST /registrar-sesion se dispara en paralelo y puede no haber terminado.
    if (!sesiones || sesiones.length === 0) {
      return NextResponse.json({ activa: true }, { status: 200 });
    }

    const sesion = sesiones[0];

    // Registro existe pero está inactivo → fue cerrada remotamente
    if (!sesion.EstaActiva) {
      return NextResponse.json(
        { activa: false, sesionCerrada: true },
        { status: 200 },
      );
    }

    // Verificar expiración por inactividad (configuración del tenant)
    if (configTenant?.ExpirarSesiones30Dias) {
      const diasConfig = configTenant.DiasExpiracionSesion ?? 30;
      const diasMs = diasConfig * 24 * 60 * 60 * 1000;
      const ultimaActividad = sesion.FechaUltimaActividad;
      const inactiva = Date.now() - ultimaActividad.getTime() > diasMs;

      if (inactiva) {
        // Cerrar la sesión por inactividad
        await prisma.$executeRawUnsafe(
          `UPDATE "SesionActiva" SET "EstaActiva" = false WHERE "Id" = $1`,
          sesion.Id,
        );
        return NextResponse.json(
          { activa: false, sesionCerrada: true, sesionExpirada: true },
          { status: 200 },
        );
      }
    }

    // Actualizar FechaUltimaActividad para mantener la sesión viva
    // (solo si ha pasado más de 1 minuto desde la última actualización para no saturar DB)
    const UN_MINUTO_MS = 60 * 1000;
    const debeActualizar =
      Date.now() - sesion.FechaUltimaActividad.getTime() > UN_MINUTO_MS;

    if (debeActualizar) {
      await prisma.$executeRawUnsafe(
        `UPDATE "SesionActiva" SET "FechaUltimaActividad" = NOW() WHERE "Id" = $1`,
        sesion.Id,
      );
    }

    return NextResponse.json({ activa: true }, { status: 200 });
  } catch {
    // En caso de error no bloquear al usuario
    return NextResponse.json({ activa: true }, { status: 200 });
  }
}
