import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";

/**
 * GET: Obtiene estadísticas de seguridad del tenant
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

    const tenantIdBigInt = BigInt(tenantId);

    // Ejecutar todos los queries en paralelo para minimizar latencia
    const [
      sesionesActivasResult,
      dispositivosActivosResult,
      ultimaSesionResult,
      actividad30DiasResult,
    ] = await Promise.all([
      // Sesiones activas ahora mismo
      prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "SesionActiva" WHERE "TenantId" = $1 AND "EstaActiva" = true`,
        tenantIdBigInt,
      ),
      // Dispositivos confiables registrados
      prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "DispositivoConfiable" WHERE "TenantId" = $1 AND "EstaActivo" = true`,
        tenantIdBigInt,
      ),
      // Última actividad detectada
      prisma.$queryRawUnsafe<Array<{ FechaUltimaActividad: Date | null }>>(
        `SELECT "FechaUltimaActividad" FROM "SesionActiva" WHERE "TenantId" = $1 AND "EstaActiva" = true ORDER BY "FechaUltimaActividad" DESC LIMIT 1`,
        tenantIdBigInt,
      ),
      // Accesos e IPs únicas en los últimos 30 días
      prisma.$queryRawUnsafe<Array<{ logins: bigint; ips_unicas: bigint }>>(
        `SELECT
           COUNT(*) AS logins,
           COUNT(DISTINCT "IpAddress") AS ips_unicas
         FROM "SesionActiva"
         WHERE "TenantId" = $1
           AND "FechaInicio" >= NOW() - INTERVAL '30 days'`,
        tenantIdBigInt,
      ),
    ]);

    const sesionesActivas = Number(sesionesActivasResult[0]?.count || 0);
    const dispositivosActivos = Number(
      dispositivosActivosResult[0]?.count || 0,
    );
    const ultimaSesion = ultimaSesionResult[0] || null;
    const loginUltimos30Dias = Number(actividad30DiasResult[0]?.logins || 0);
    const ipsUnicas30Dias = Number(
      actividad30DiasResult[0]?.ips_unicas || 0,
    );

    return NextResponse.json(
      {
        estadisticas: {
          sesionesActivas,
          dispositivosActivos,
          ultimaActividad: ultimaSesion?.FechaUltimaActividad
            ? ultimaSesion.FechaUltimaActividad.toISOString()
            : null,
          loginUltimos30Dias,
          ipsUnicas30Dias,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
