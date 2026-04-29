import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import prisma from "@/DB/prisma";

/**
 * GET /api/auth/session-status
 *
 * Heartbeat: verifica si la sesión del usuario sigue activa en nuestra DB.
 * El sessionProvider del cliente lo llama cada 30 segundos.
 *
 * - 200 { activa: true }             → sesión válida.
 * - 200 { activa: false, sesionCerrada: true } → sesión cerrada remotamente.
 *   El interceptor del sessionProvider detecta `sesionCerrada: true`
 *   y dispara el logout automático en el browser remoto.
 *
 * ⚠️ Implementación read-only:
 * En un GET Route Handler Next.js NO permite modificar cookies.
 * Por eso NO usamos getSupabaseServerClient() (que llama a cookieStore.set/remove
 * durante el auto-refresh del token).
 * En cambio, creamos un cliente read-only que ignora silenciosamente
 * los intentos de escritura de cookies, y extraemos el session_id
 * directamente del JWT de la cookie de Supabase.
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ activa: true }, { status: 200 });
    }

    // Cliente Supabase read-only: las cookies set/remove son no-ops.
    // getUser() valida el JWT con Supabase sin necesitar escribir cookies.
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

    // getUser() verifica el JWT con Supabase (network call, sin modificar cookies)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      // Token inválido o expirado — Supabase ya lo rechazó,
      // no es cierre remoto sino expiración normal
      return NextResponse.json({ activa: false }, { status: 200 });
    }

    const tenantId =
      user.app_metadata?.tenantId || user.app_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ activa: false }, { status: 200 });
    }

    // Extraer el SupabaseSessionId directamente del JWT en la cookie.
    // No llamamos a getSession() porque podría intentar refrescar el token
    // y escribir cookies (prohibido en GET handlers).
    let supabaseSessionId: string | null = null;
    const allCookies = req.cookies.getAll();
    // Supabase almacena el token en cookies con nombre sb-*-auth-token (puede estar en chunks)
    const authTokenCookie = allCookies.find(
      (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token") && !c.name.includes("."),
    );

    if (authTokenCookie?.value) {
      try {
        // El valor puede estar JSON-encoded como { access_token, ... }
        const parsed = JSON.parse(authTokenCookie.value);
        const accessToken = parsed?.access_token || parsed?.[0]?.access_token;
        if (accessToken) {
          const payload = JSON.parse(
            Buffer.from(accessToken.split(".")[1], "base64url").toString(),
          );
          supabaseSessionId = payload.session_id || null;
        }
      } catch {
        // Cookie en formato inesperado — continuar sin session_id
      }
    }

    // Verificar en nuestra DB si esta sesión sigue activa
    let sesionActiva: Array<{ Id: bigint }> = [];

    if (supabaseSessionId) {
      // Buscar por SupabaseSessionId exacto (más preciso)
      sesionActiva = await prisma.$queryRawUnsafe<Array<{ Id: bigint }>>(
        `
        SELECT sa."Id"
        FROM "SesionActiva" sa
        INNER JOIN "Usuario" u ON sa."UsuarioId" = u."Id"
        WHERE u."AuthUserId" = $1
          AND sa."TenantId" = $2
          AND sa."SupabaseSessionId" = $3
          AND sa."EstaActiva" = true
        LIMIT 1
      `,
        user.id,
        BigInt(tenantId),
        supabaseSessionId,
      );
    } else {
      // Fallback: verificar si existe al menos una sesión activa del usuario
      sesionActiva = await prisma.$queryRawUnsafe<Array<{ Id: bigint }>>(
        `
        SELECT sa."Id"
        FROM "SesionActiva" sa
        INNER JOIN "Usuario" u ON sa."UsuarioId" = u."Id"
        WHERE u."AuthUserId" = $1
          AND sa."TenantId" = $2
          AND sa."EstaActiva" = true
        LIMIT 1
      `,
        user.id,
        BigInt(tenantId),
      );
    }

    if (sesionActiva.length === 0) {
      // La sesión fue cerrada remotamente
      return NextResponse.json(
        { activa: false, sesionCerrada: true },
        { status: 200 },
      );
    }

    return NextResponse.json({ activa: true }, { status: 200 });
  } catch {
    // En caso de error no bloquear al usuario
    return NextResponse.json({ activa: true }, { status: 200 });
  }
}
