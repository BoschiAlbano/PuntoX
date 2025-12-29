import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";

/**
 * GET: Obtiene las sesiones activas del tenant
 */
export async function GET() {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error || !tenantId) {
      return error || NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tenantIdBigInt = BigInt(tenantId);
    const sesiones = await prisma.$queryRawUnsafe(`
      SELECT 
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
      ORDER BY sa."FechaUltimaActividad" DESC
      LIMIT 50
    `, tenantIdBigInt) as Array<{
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
      return NextResponse.json(
        { sesiones: [] },
        { status: 200 }
      );
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
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

/**
 * DELETE: Cierra una sesión específica
 */
export async function DELETE(req: Request) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error || !tenantId) {
      return error || NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sesionId = searchParams.get("id");

    if (!sesionId) {
      return NextResponse.json({ error: "ID de sesión requerido" }, { status: 400 });
    }

    const sesionIdBigInt = BigInt(sesionId);
    const tenantIdBigInt = BigInt(tenantId);

    // Verificar que la sesión pertenece al tenant y cerrarla
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "SesionActiva"
      SET "EstaActiva" = false
      WHERE "Id" = $1
        AND "TenantId" = $2
    `, sesionIdBigInt, tenantIdBigInt);

    // Si no se actualizó ninguna fila, la sesión no existe o no pertenece al tenant
    if (result === 0) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Sesión cerrada correctamente" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

