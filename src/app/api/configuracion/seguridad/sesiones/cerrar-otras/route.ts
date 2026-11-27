import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";
import { sessionIdDesdeCookies } from "@/lib/auth/sesionActual";

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

    // Sesión actual (session_id del JWT en la cookie de Supabase), para
    // excluirla del cierre. Si no se puede identificar no se cierra nada:
    // antes se cerraban TODAS, incluida la actual, y el heartbeat echaba al
    // usuario del dispositivo desde el que pidió cerrar las demás.
    const currentSessionId = sessionIdDesdeCookies(req.cookies.getAll());
    if (!currentSessionId) {
      return NextResponse.json(
        { error: "No se pudo identificar tu sesión actual. Volvé a iniciar sesión e intentá de nuevo." },
        { status: 409 },
      );
    }

    const sesionesCerradas = await prisma.$executeRawUnsafe(
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
