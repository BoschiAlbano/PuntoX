import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";

/**
 * GET: Obtiene estadísticas de seguridad del tenant
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

    // Contar sesiones activas
    const sesionesActivasResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM "SesionActiva" WHERE "TenantId" = $1 AND "EstaActiva" = true`,
      tenantIdBigInt,
    );
    const sesionesActivas = Number(sesionesActivasResult[0]?.count || 0);

    // Contar dispositivos confiables activos
    const dispositivosActivosResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM "DispositivoConfiable" WHERE "TenantId" = $1 AND "EstaActivo" = true`,
      tenantIdBigInt,
    );
    const dispositivosActivos = Number(
      dispositivosActivosResult[0]?.count || 0,
    );

    // Obtener última actividad
    const ultimaSesionResult = await prisma.$queryRawUnsafe<
      Array<{ FechaUltimaActividad: Date | null }>
    >(
      `SELECT "FechaUltimaActividad" FROM "SesionActiva" WHERE "TenantId" = $1 AND "EstaActiva" = true ORDER BY "FechaUltimaActividad" DESC LIMIT 1`,
      tenantIdBigInt,
    );
    const ultimaSesion = ultimaSesionResult[0] || null;

    // Contar intentos fallidos en los últimos 7 días
    const fecha7DiasAtras = new Date();
    fecha7DiasAtras.setDate(fecha7DiasAtras.getDate() - 7);

    const intentosFallidosResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM "IntentoLogin" WHERE "TenantId" = $1 AND "Exitoso" = false AND "FechaIntento" >= $2`,
      tenantIdBigInt,
      fecha7DiasAtras,
    );
    const intentosFallidos = Number(intentosFallidosResult[0]?.count || 0);

    // Contar intentos exitosos en los últimos 7 días
    const intentosExitososResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM "IntentoLogin" WHERE "TenantId" = $1 AND "Exitoso" = true AND "FechaIntento" >= $2`,
      tenantIdBigInt,
      fecha7DiasAtras,
    );
    const intentosExitosos = Number(intentosExitososResult[0]?.count || 0);

    return NextResponse.json(
      {
        estadisticas: {
          sesionesActivas,
          dispositivosActivos,
          ultimaActividad: ultimaSesion?.FechaUltimaActividad
            ? ultimaSesion.FechaUltimaActividad.toISOString()
            : null,
          intentosFallidos7Dias: intentosFallidos,
          intentosExitosos7Dias: intentosExitosos,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
