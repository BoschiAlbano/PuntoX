import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

// Extrae el session_id del JWT (claim estable por sesión en Supabase)
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
 * GET: Obtiene las sesiones activas del tenant.
 * Agrega el campo `esActual` comparando SupabaseSessionId con la sesión en curso.
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.CONFIGURACION,
    });

    if (!tenantId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener session_id actual para marcar la sesión propia
    const supabase = await getSupabaseServerClient();
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    const currentSessionId = currentSession?.access_token
      ? extractSessionIdFromJwt(currentSession.access_token)
      : null;

    const tenantIdBigInt = BigInt(tenantId);
    const sesiones = (await prisma.$queryRawUnsafe(
      `
      SELECT DISTINCT ON (sa."UsuarioId", COALESCE(sa."Dispositivo", ''), COALESCE(sa."IpAddress", ''))
        sa."Id",
        sa."TenantId",
        sa."UsuarioId",
        sa."SupabaseSessionId",
        sa."IpAddress",
        sa."UserAgent",
        sa."Dispositivo",
        sa."Ubicacion",
        sa."FechaInicio",
        sa."FechaUltimaActividad",
        sa."EstaActiva",
        sa."EsConfiable",
        u."Nombre" as "UsuarioNombre"
      FROM "SesionActiva" sa
      INNER JOIN "Usuario" u ON sa."UsuarioId" = u."Id"
      WHERE sa."TenantId" = $1
        AND sa."EstaActiva" = true
      ORDER BY sa."UsuarioId", COALESCE(sa."Dispositivo", ''), COALESCE(sa."IpAddress", ''), sa."FechaUltimaActividad" DESC
    `,
      tenantIdBigInt,
    )) as Array<{
      Id: bigint;
      TenantId: bigint;
      UsuarioId: bigint;
      SupabaseSessionId: string | null;
      IpAddress: string | null;
      UserAgent: string | null;
      Dispositivo: string | null;
      Ubicacion: string | null;
      FechaInicio: Date;
      FechaUltimaActividad: Date;
      EstaActiva: boolean;
      EsConfiable: boolean;
      UsuarioNombre: string;
    }>;

    if (!sesiones || sesiones.length === 0) {
      return NextResponse.json({ sesiones: [] }, { status: 200 });
    }

    const sesionesFormateadas = sesiones.map((sesion) => ({
      id: Number(sesion.Id),
      usuarioId: Number(sesion.UsuarioId),
      usuarioNombre: sesion.UsuarioNombre,
      ipAddress: sesion.IpAddress,
      userAgent: sesion.UserAgent,
      dispositivo: sesion.Dispositivo,
      ubicacion: sesion.Ubicacion,
      fechaInicio: sesion.FechaInicio.toISOString(),
      fechaUltimaActividad: sesion.FechaUltimaActividad.toISOString(),
      esConfiable: sesion.EsConfiable,
      esActual:
        !!currentSessionId &&
        !!sesion.SupabaseSessionId &&
        sesion.SupabaseSessionId === currentSessionId,
    }));

    return NextResponse.json(
      { sesiones: sesionesFormateadas },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
