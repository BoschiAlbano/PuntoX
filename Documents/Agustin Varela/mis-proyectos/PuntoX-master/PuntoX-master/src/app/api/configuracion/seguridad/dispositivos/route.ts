import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";

/**
 * GET: Obtiene los dispositivos confiables del tenant
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: PERMISSIONS.CONFIGURACION,
    });

    if (!tenantId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tenantIdBigInt = BigInt(tenantId);
    const dispositivos = (await prisma.$queryRawUnsafe(
      `
      SELECT 
        dc."Id",
        dc."TenantId",
        dc."UsuarioId",
        dc."NombreDispositivo",
        dc."UserAgent",
        dc."IpAddress",
        dc."FechaRegistro",
        dc."FechaUltimoUso",
        u."Nombre" as "UsuarioNombre"
      FROM "DispositivoConfiable" dc
      INNER JOIN "Usuario" u ON dc."UsuarioId" = u."Id"
      WHERE dc."TenantId" = $1
        AND dc."EstaActivo" = true
      ORDER BY dc."FechaUltimoUso" DESC
    `,
      tenantIdBigInt,
    )) as Array<{
      Id: bigint;
      TenantId: bigint;
      UsuarioId: bigint;
      NombreDispositivo: string;
      UserAgent: string | null;
      IpAddress: string | null;
      FechaRegistro: Date;
      FechaUltimoUso: Date;
      UsuarioNombre: string;
    }>;

    const dispositivosFormateados = (dispositivos || []).map((dispositivo) => ({
      id: Number(dispositivo.Id),
      usuarioId: Number(dispositivo.UsuarioId),
      usuarioNombre: dispositivo.UsuarioNombre,
      nombreDispositivo: dispositivo.NombreDispositivo,
      userAgent: dispositivo.UserAgent,
      ipAddress: dispositivo.IpAddress,
      fechaRegistro: dispositivo.FechaRegistro.toISOString(),
      fechaUltimoUso: dispositivo.FechaUltimoUso.toISOString(),
    }));

    return NextResponse.json(
      { dispositivos: dispositivosFormateados },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

/**
 * DELETE: Elimina un dispositivo confiable
 */
export async function DELETE(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: PERMISSIONS.CONFIGURACION,
    });

    if (!tenantId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dispositivoId = searchParams.get("id");

    if (!dispositivoId) {
      return NextResponse.json(
        { error: "ID de dispositivo requerido" },
        { status: 400 },
      );
    }

    const dispositivoIdBigInt = BigInt(dispositivoId);
    const tenantIdBigInt = BigInt(tenantId);

    // Verificar que el dispositivo pertenece al tenant y desactivarlo
    const result = await prisma.$executeRawUnsafe(
      `
      UPDATE "DispositivoConfiable"
      SET "EstaActivo" = false
      WHERE "Id" = $1
        AND "TenantId" = $2
    `,
      dispositivoIdBigInt,
      tenantIdBigInt,
    );

    // Si no se actualizó ninguna fila, el dispositivo no existe o no pertenece al tenant
    if (result === 0) {
      return NextResponse.json(
        { error: "Dispositivo no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Dispositivo eliminado correctamente" },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
