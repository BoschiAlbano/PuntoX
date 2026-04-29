import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";

/**
 * POST /api/auth/cleanup-sesiones
 *
 * Job de limpieza bulk: cierra todas las sesiones que superaron el período
 * de inactividad configurado por cada tenant.
 *
 * Pensado para ser llamado por Vercel Cron (vercel.json) una vez al día.
 * También puede llamarse manualmente desde herramientas de administración.
 *
 * Seguridad: requiere header Authorization con CRON_SECRET para evitar ejecución no autorizada.
 * Si no hay CRON_SECRET configurado, solo acepta llamadas desde localhost (dev).
 *
 * SQL: cierra sesiones donde FechaUltimaActividad < NOW() - interval de días del tenant.
 * Hace JOIN con Configuracion para respetar ExpirarSesiones30Dias y DiasExpiracionSesion
 * de cada tenant individualmente.
 */
export async function POST(req: NextRequest) {
  // Validar autorización
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  } else {
    // Sin CRON_SECRET configurado: solo permitir en desarrollo desde localhost
    const host = req.headers.get("host") || "";
    const isLocal =
      host.startsWith("localhost") || host.startsWith("127.0.0.1");
    if (!isLocal) {
      return NextResponse.json(
        { error: "CRON_SECRET no configurado" },
        { status: 401 },
      );
    }
  }

  try {
    // PASO 1: Cerrar sesiones inactivas según configuración de cada tenant
    const sesionesExpiradas = await prisma.$executeRaw`
      UPDATE "SesionActiva" sa
      SET "EstaActiva" = false
      FROM (
        SELECT c."TenantId", c."DiasExpiracionSesion"
        FROM "Configuracion" c
        WHERE c."ExpirarSesiones30Dias" = true
          AND c."EstaEliminado" = false
      ) cfg
      WHERE sa."TenantId" = cfg."TenantId"
        AND sa."EstaActiva" = true
        AND sa."FechaUltimaActividad" < NOW() - (cfg."DiasExpiracionSesion" * INTERVAL '1 day')
    `;

    // PASO 2: Borrar registros inactivos antiguos (retención configurable, default 90 días).
    // Mantiene el historial reciente para auditoría de seguridad.
    // Los registros activos NUNCA se borran aquí.
    const retentionDays = parseInt(
      process.env.SESION_RETENTION_DAYS || "90",
      10,
    );
    const sesionesEliminadas = await prisma.$executeRawUnsafe(
      `
      DELETE FROM "SesionActiva"
      WHERE "EstaActiva" = false
        AND "FechaUltimaActividad" < NOW() - ($1 * INTERVAL '1 day')
    `,
      retentionDays,
    );

    console.log(
      `[cleanup-sesiones] Expiradas: ${sesionesExpiradas} | Eliminadas (>${retentionDays}d): ${sesionesEliminadas}`,
    );

    return NextResponse.json(
      {
        message: "Limpieza completada",
        sesionesExpiradas,
        sesionesEliminadas,
        retentionDays,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[cleanup-sesiones] Error:", error);
    return NextResponse.json(
      { error: "Error al ejecutar limpieza" },
      { status: 500 },
    );
  }
}
