import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import {
  TIPO_COMPROBANTE_VENTA,
} from "@/lib/constants/comprobantes";

/**
 * GET /api/cron/resumen-diario
 *
 * Genera una notificación INFO con el resumen del día para cada tenant
 * que tenga habilitada la opción "Resumen diario" en configuración.
 *
 * Pensado para ser llamado por Vercel Cron a las 23:00 todos los días.
 * Seguridad: requiere header Authorization con CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  // Verificar autorización (mismo patrón que cleanup-sesiones)
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

  // Tipos de comprobante que cuentan como ventas del día
  const TIPOS_VENTA = [
    TIPO_COMPROBANTE_VENTA.FACTURA_A,
    TIPO_COMPROBANTE_VENTA.FACTURA_B,
    TIPO_COMPROBANTE_VENTA.FACTURA_C,
    TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
    TIPO_COMPROBANTE_VENTA.REMITO,
    TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE,
  ];

  const now = new Date();
  const hoyInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hoyFin = new Date(hoyInicio);
  hoyFin.setDate(hoyFin.getDate() + 1);
  // Identificador del día para deduplicación (YYYY-MM-DD)
  const fechaId = hoyInicio.toISOString().split("T")[0];

  // Obtener todos los tenants con resumenDiario habilitado
  const configs = await prisma.configuracion.findMany({
    where: {
      NotificacionesResumenDiario: true,
      EstaEliminado: false,
    },
    select: { TenantId: true },
  });

  let procesados = 0;
  let errores = 0;

  for (const config of configs) {
    const tenantId = config.TenantId;

    try {
      // Evitar duplicados si el cron se ejecuta más de una vez en el día
      const existing = await prisma.notificacion.findFirst({
        where: {
          TenantId: tenantId,
          EntidadTipo: "RESUMEN_DIARIO",
          EntidadId: fechaId,
        },
      });

      if (existing) continue;

      // --- Datos del resumen ---

      // 1. Ventas del día (cantidad + monto total)
      const ventasHoy = await prisma.comprobante.aggregate({
        where: {
          TenantId: tenantId,
          EstaEliminado: false,
          Fecha: { gte: hoyInicio, lt: hoyFin },
          TipoComprobante: { in: TIPOS_VENTA },
        },
        _sum: { Total: true },
        _count: { Id: true },
      });

      const ventasCount = ventasHoy._count.Id;
      const ventasTotal = Number(ventasHoy._sum.Total ?? 0);

      // 2. Productos con stock bajo (todas las sucursales del tenant)
      const stockBajoResult = (await prisma.$queryRaw`
        SELECT COUNT(*) as "count"
        FROM "ArticuloStock" ast
        JOIN "Articulo" a ON ast."ArticuloId" = a."Id"
        WHERE ast."TenantId" = ${tenantId}
          AND a."EstaEliminado" = false
          AND ast."Stock" <= COALESCE(ast."StockMinimo", a."StockMinimo", 0)
      `) as Array<{ count: bigint }>;
      const stockBajoCount = Number(stockBajoResult[0]?.count ?? 0);

      // 3. Cajas que quedaron abiertas al momento del resumen
      const cajasAbiertas = await prisma.caja.count({
        where: {
          TenantId: tenantId,
          EstaEliminado: false,
          FechaCierre: null,
        },
      });

      // --- Construir mensaje ---
      const montoFormateado = ventasTotal.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      let mensaje: string;
      if (ventasCount === 0) {
        mensaje = "Sin ventas registradas hoy.";
      } else {
        mensaje = `${ventasCount} venta${ventasCount !== 1 ? "s" : ""} por $${montoFormateado}.`;
      }

      if (stockBajoCount > 0) {
        mensaje += ` ${stockBajoCount} producto${stockBajoCount !== 1 ? "s" : ""} con stock bajo.`;
      }

      if (cajasAbiertas > 0) {
        mensaje += ` ${cajasAbiertas > 1 ? `${cajasAbiertas} cajas abiertas` : "Caja abierta"} al cierre del día.`;
      }

      // Nivel de severidad: WARNING si hay stock bajo o caja abierta, INFO en caso contrario
      const tipo = stockBajoCount > 0 || cajasAbiertas > 0 ? "WARNING" : "INFO";

      await prisma.notificacion.create({
        data: {
          TenantId: tenantId,
          UsuarioId: null, // broadcast para todos los admins del tenant
          Tipo: tipo,
          Titulo: "Resumen del día",
          Mensaje: mensaje,
          AccionUrl: "/analiticas",
          EntidadTipo: "RESUMEN_DIARIO",
          EntidadId: fechaId,
          Leida: false,
        },
      });

      procesados++;
    } catch (err) {
      console.error(
        `[resumen-diario] Error al procesar tenant ${tenantId}:`,
        err,
      );
      errores++;
    }
  }

  console.log(
    `[resumen-diario] Completado: ${procesados} procesados, ${errores} errores`,
  );

  return NextResponse.json({
    message: "Resumen diario generado",
    procesados,
    errores,
    timestamp: now.toISOString(),
  });
}
