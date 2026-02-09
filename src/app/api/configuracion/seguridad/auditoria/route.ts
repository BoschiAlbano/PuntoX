import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";

/**
 * GET /api/configuracion/seguridad/auditoria
 * Obtiene estadísticas de auditoría para la sección de seguridad
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

    // Calcular fechas para los últimos 7 y 30 días
    const fecha7DiasAtras = new Date();
    fecha7DiasAtras.setDate(fecha7DiasAtras.getDate() - 7);
    const fecha30DiasAtras = new Date();
    fecha30DiasAtras.setDate(fecha30DiasAtras.getDate() - 30);

    // Obtener estadísticas usando SQL directo (PostgreSQL)
    // Primero obtener totales
    const totalEventosResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM "AuditoriaEmpleado" WHERE "TenantId" = $1`,
      tenantIdBigInt,
    );
    const totalEventos = Number(totalEventosResult[0]?.count || 0);

    const eventosErrorResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM "AuditoriaEmpleado" WHERE "TenantId" = $1 AND "Severidad" = 'ERROR'`,
      tenantIdBigInt,
    );
    const eventosError = Number(eventosErrorResult[0]?.count || 0);

    const eventosWarningResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM "AuditoriaEmpleado" WHERE "TenantId" = $1 AND "Severidad" = 'WARNING'`,
      tenantIdBigInt,
    );
    const eventosWarning = Number(eventosWarningResult[0]?.count || 0);

    const eventosUltimos7DiasResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM "AuditoriaEmpleado" WHERE "TenantId" = $1 AND "Fecha" >= $2`,
      tenantIdBigInt,
      fecha7DiasAtras,
    );
    const eventosUltimos7Dias = Number(
      eventosUltimos7DiasResult[0]?.count || 0,
    );

    const eventosUltimos30DiasResult = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM "AuditoriaEmpleado" WHERE "TenantId" = $1 AND "Fecha" >= $2`,
      tenantIdBigInt,
      fecha30DiasAtras,
    );
    const eventosUltimos30Dias = Number(
      eventosUltimos30DiasResult[0]?.count || 0,
    );

    const stats = {
      totalEventos,
      eventosError,
      eventosWarning,
      eventosUltimos7Dias,
      eventosUltimos30Dias,
    };

    // Obtener últimos 5 eventos recientes
    const eventosRecientes = await prisma.$queryRawUnsafe<
      Array<{
        Id: bigint;
        Fecha: Date;
        Accion: string;
        Severidad: string;
        Detalle: string | null;
        IpAddress: string | null;
        UsuarioNombre: string;
        PersonaNombre: string | null;
        PersonaApellido: string | null;
      }>
    >(
      `
      SELECT 
        a."Id",
        a."Fecha",
        a."Accion",
        a."Severidad",
        a."Detalle",
        a."IpAddress",
        u."Nombre" as "UsuarioNombre",
        pe."Nombre" as "PersonaNombre",
        pe."Apellido" as "PersonaApellido"
      FROM "AuditoriaEmpleado" a
      INNER JOIN "Usuario" u ON a."UsuarioId" = u."Id"
      LEFT JOIN "Persona_Empleado" pe_rel ON u."EmpleadoId" = pe_rel."Id"
      LEFT JOIN "Persona" pe ON pe_rel."Id" = pe."Id"
      WHERE a."TenantId" = $1
      ORDER BY a."Fecha" DESC
      LIMIT 5
    `,
      tenantIdBigInt,
    );

    const eventos = eventosRecientes.map((evento) => {
      const nombreCompleto =
        evento.PersonaNombre && evento.PersonaApellido
          ? `${evento.PersonaNombre} ${evento.PersonaApellido}`
          : evento.UsuarioNombre;

      return {
        id: Number(evento.Id),
        fecha: evento.Fecha.toISOString(),
        accion: evento.Accion,
        severidad: evento.Severidad,
        detalle: evento.Detalle,
        ipAddress: evento.IpAddress,
        usuario: nombreCompleto,
      };
    });

    return NextResponse.json({
      estadisticas: stats,
      eventosRecientes: eventos,
    });
  } catch (error) {
    return handleError(error);
  }
}
