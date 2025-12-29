import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";

/**
 * GET: Obtiene intentos de login sospechosos
 * Un intento se considera sospechoso si:
 * - Hay más de 3 intentos fallidos en la última hora desde la misma IP
 * - Hay más de 5 intentos fallidos en las últimas 24 horas desde la misma IP
 * - Hay intentos desde múltiples IPs diferentes en poco tiempo
 */
export async function GET() {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error || !tenantId) {
      return error || NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tenantIdBigInt = BigInt(tenantId);

    // Obtener intentos fallidos de las últimas 24 horas
    const fecha24HorasAtras = new Date();
    fecha24HorasAtras.setHours(fecha24HorasAtras.getHours() - 24);

    // Intentos fallidos agrupados por IP en las últimas 24 horas
    const intentosPorIP = await prisma.$queryRawUnsafe<Array<{
      IpAddress: string;
      count: bigint;
      ultimoIntento: Date;
    }>>(`
      SELECT 
        "IpAddress",
        COUNT(*) as count,
        MAX("FechaIntento") as "ultimoIntento"
      FROM "IntentoLogin"
      WHERE "TenantId" = $1
        AND "Exitoso" = false
        AND "FechaIntento" >= $2
        AND "IpAddress" IS NOT NULL
      GROUP BY "IpAddress"
      HAVING COUNT(*) >= 3
      ORDER BY count DESC
      LIMIT 20
    `, tenantIdBigInt, fecha24HorasAtras);

    // Intentos fallidos de la última hora
    const fecha1HoraAtras = new Date();
    fecha1HoraAtras.setHours(fecha1HoraAtras.getHours() - 1);

    const intentosUltimaHora = await prisma.$queryRawUnsafe<Array<{
      IpAddress: string;
      count: bigint;
    }>>(`
      SELECT 
        "IpAddress",
        COUNT(*) as count
      FROM "IntentoLogin"
      WHERE "TenantId" = $1
        AND "Exitoso" = false
        AND "FechaIntento" >= $2
        AND "IpAddress" IS NOT NULL
      GROUP BY "IpAddress"
      HAVING COUNT(*) >= 3
      ORDER BY count DESC
    `, tenantIdBigInt, fecha1HoraAtras);

    // Detectar múltiples IPs en poco tiempo (última hora)
    const ipsUnicas = await prisma.$queryRawUnsafe<Array<{
      count: bigint;
    }>>(`
      SELECT COUNT(DISTINCT "IpAddress") as count
      FROM "IntentoLogin"
      WHERE "TenantId" = $1
        AND "Exitoso" = false
        AND "FechaIntento" >= $2
        AND "IpAddress" IS NOT NULL
    `, tenantIdBigInt, fecha1HoraAtras);

    const ipsUnicasCount = Number(ipsUnicas[0]?.count || 0);

    // Obtener últimos intentos fallidos con detalles
    const ultimosIntentos = await prisma.$queryRawUnsafe<Array<{
      Id: bigint;
      FechaIntento: Date;
      IpAddress: string | null;
      Exitoso: boolean;
      UsuarioId: bigint | null;
      UsuarioNombre: string | null;
    }>>(`
      SELECT 
        il."Id",
        il."FechaIntento",
        il."IpAddress",
        il."Exitoso",
        il."UsuarioId",
        u."Nombre" as "UsuarioNombre"
      FROM "IntentoLogin" il
      LEFT JOIN "Usuario" u ON il."UsuarioId" = u."Id"
      WHERE il."TenantId" = $1
        AND il."Exitoso" = false
        AND il."FechaIntento" >= $2
      ORDER BY il."FechaIntento" DESC
      LIMIT 50
    `, tenantIdBigInt, fecha24HorasAtras);

    const sospechosos = intentosPorIP.map((item) => ({
      ipAddress: item.IpAddress,
      intentos24Horas: Number(item.count),
      ultimoIntento: item.ultimoIntento.toISOString(),
      esCritico: Number(item.count) >= 10 || intentosUltimaHora.some(
        (h) => h.IpAddress === item.IpAddress && Number(h.count) >= 5
      ),
    }));

    const alertas = [];
    
    // Alerta 1: Muchos intentos desde una IP
    if (sospechosos.some((s) => s.intentos24Horas >= 10)) {
      alertas.push({
        tipo: "critico",
        titulo: "Múltiples intentos fallidos desde la misma IP",
        descripcion: "Se detectaron más de 10 intentos fallidos desde una misma dirección IP en las últimas 24 horas.",
        ips: sospechosos.filter((s) => s.intentos24Horas >= 10).map((s) => s.ipAddress),
      });
    }

    // Alerta 2: Muchos intentos en la última hora
    if (intentosUltimaHora.length > 0) {
      alertas.push({
        tipo: "advertencia",
        titulo: "Actividad sospechosa en la última hora",
        descripcion: "Se detectaron múltiples intentos fallidos en la última hora.",
        ips: intentosUltimaHora.map((i) => i.IpAddress),
      });
    }

    // Alerta 3: Múltiples IPs diferentes
    if (ipsUnicasCount >= 5) {
      alertas.push({
        tipo: "advertencia",
        titulo: "Intentos desde múltiples ubicaciones",
        descripcion: `Se detectaron intentos fallidos desde ${ipsUnicasCount} direcciones IP diferentes en la última hora.`,
      });
    }

    return NextResponse.json({
      sospechosos,
      alertas,
      ultimosIntentos: ultimosIntentos.map((intento) => ({
        id: Number(intento.Id),
        fecha: intento.FechaIntento.toISOString(),
        ipAddress: intento.IpAddress,
        usuarioNombre: intento.UsuarioNombre,
        usuarioId: intento.UsuarioId ? Number(intento.UsuarioId) : null,
      })),
      estadisticas: {
        ipsUnicasUltimaHora: ipsUnicasCount,
        intentosFallidos24Horas: ultimosIntentos.length,
      },
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}

