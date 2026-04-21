import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

/**
 * GET: Obtiene las sesiones activas del tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar sesión activa solo en endpoints críticos de seguridad
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.CONFIGURACION,
    });

    if (!tenantId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tenantIdBigInt = BigInt(tenantId);
    // Obtener sesiones agrupadas por usuario/dispositivo/IP para evitar duplicados
    // Mostramos solo la sesión más reciente de cada combinación única
    const sesiones = (await prisma.$queryRawUnsafe(
      `
      SELECT DISTINCT ON (sa."UsuarioId", COALESCE(sa."Dispositivo", ''), COALESCE(sa."IpAddress", ''))
        sa."Id",
        sa."TenantId",
        sa."UsuarioId",
        sa."TokenHash",
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
      TokenHash: string;
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

    // Si no hay resultados, retornar array vacío
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
    }));

    return NextResponse.json(
      { sesiones: sesionesFormateadas },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

/**
 * DELETE: Cierra una sesión específica
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verificar sesión activa solo en endpoints críticos de seguridad
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.CONFIGURACION,
    });

    if (!tenantId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sesionId = searchParams.get("id");

    if (!sesionId) {
      return NextResponse.json(
        { error: "ID de sesión requerido" },
        { status: 400 },
      );
    }

    const sesionIdBigInt = BigInt(sesionId);
    const tenantIdBigInt = BigInt(tenantId);

    // Obtener el usuario actual para verificar si es su propia sesión
    const supabase = await getSupabaseServerClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Buscar el usuario en la BD
    const usuarioActual = await prisma.usuario.findFirst({
      where: {
        AuthUserId: currentUser.id,
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      select: { Id: true },
    });

    // Primero obtener la sesión para obtener usuario/dispositivo/IP
    const sesion = await prisma.$queryRawUnsafe<
      Array<{
        UsuarioId: bigint;
        Dispositivo: string | null;
        IpAddress: string | null;
        TokenHash: string;
      }>
    >(
      `
      SELECT "UsuarioId", "Dispositivo", "IpAddress", "TokenHash"
      FROM "SesionActiva"
      WHERE "Id" = $1
        AND "TenantId" = $2
        AND "EstaActiva" = true
      LIMIT 1
    `,
      sesionIdBigInt,
      tenantIdBigInt,
    );

    if (!sesion || sesion.length === 0) {
      return NextResponse.json(
        { error: "Sesión no encontrada o ya cerrada" },
        { status: 404 },
      );
    }

    // Verificar si es la sesión actual del usuario
    const esSesionActual =
      usuarioActual && sesion[0].UsuarioId === usuarioActual.Id;

    // Cerrar todas las sesiones del mismo usuario/dispositivo/IP para evitar duplicados
    const result = await prisma.$executeRawUnsafe(
      `
      UPDATE "SesionActiva"
      SET "EstaActiva" = false
      WHERE "TenantId" = $1
        AND "UsuarioId" = $2
        AND COALESCE("Dispositivo", '') = COALESCE($3, '')
        AND COALESCE("IpAddress", '') = COALESCE($4, '')
        AND "EstaActiva" = true
    `,
      tenantIdBigInt,
      sesion[0].UsuarioId,
      sesion[0].Dispositivo,
      sesion[0].IpAddress,
    );

    // Si se cerró la sesión actual, también invalidar todas las sesiones activas del usuario
    // para forzar el logout en todos sus dispositivos
    if (esSesionActual && usuarioActual) {
      await prisma.$executeRawUnsafe(
        `
        UPDATE "SesionActiva"
        SET "EstaActiva" = false
        WHERE "TenantId" = $1
          AND "UsuarioId" = $2
          AND "EstaActiva" = true
      `,
        tenantIdBigInt,
        usuarioActual.Id,
      );
    }

    return NextResponse.json(
      {
        message: esSesionActual
          ? "Tu sesión ha sido cerrada. Serás deslogueado."
          : "Sesión cerrada correctamente",
        sesionesCerradas: result,
        requiereLogout: esSesionActual, // Flag para indicar que el frontend debe hacer logout
        sesionId: Number(sesionIdBigInt),
        usuarioId: Number(sesion[0].UsuarioId),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
