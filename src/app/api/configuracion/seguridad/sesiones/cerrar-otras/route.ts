import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

// Extrae el session_id del JWT
function extractSessionIdFromJwt(accessToken: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString(),
    );
    return payload.session_id || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/configuracion/seguridad/sesiones/cerrar-otras
 *
 * Cierra todas las sesiones del usuario actual EXCEPTO la sesión en curso.
 * El cliente debe llamar a `supabase.auth.signOut({ scope: 'others' })` antes
 * de llamar a este endpoint para revocar los refresh tokens en Supabase.
 * Este endpoint sincroniza el estado en nuestra DB.
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.CONFIGURACION,
    });

    if (!tenantId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener session_id actual para excluirla del cierre
    const supabase = await getSupabaseServerClient();
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    const currentSessionId = currentSession?.access_token
      ? extractSessionIdFromJwt(currentSession.access_token)
      : null;

    // Cerrar todas las sesiones del usuario excepto la actual
    let sesionesCerradas: number;

    if (currentSessionId) {
      sesionesCerradas = await prisma.$executeRawUnsafe(
        `
        UPDATE "SesionActiva"
        SET "EstaActiva" = false
        WHERE "TenantId" = $1
          AND "UsuarioId" = $2
          AND "EstaActiva" = true
          AND ("SupabaseSessionId" IS NULL OR "SupabaseSessionId" != $3)
      `,
        BigInt(tenantId),
        BigInt(usuarioId),
        currentSessionId,
      );
    } else {
      // Fallback: cerrar todas (no debería pasar pero por seguridad)
      sesionesCerradas = await prisma.$executeRawUnsafe(
        `
        UPDATE "SesionActiva"
        SET "EstaActiva" = false
        WHERE "TenantId" = $1
          AND "UsuarioId" = $2
          AND "EstaActiva" = true
      `,
        BigInt(tenantId),
        BigInt(usuarioId),
      );
    }

    return NextResponse.json(
      {
        message: `${sesionesCerradas} sesión(es) cerrada(s) correctamente`,
        sesionesCerradas,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
