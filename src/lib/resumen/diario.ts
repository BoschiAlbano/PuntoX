/**
 * Resumen diario de cada comercio con "Resumen diario" activado
 * (Configuracion.NotificacionesResumenDiario).
 *
 * Lo ejecuta el cron /api/cron/resumen-diario a las 07:00 (Argentina) y
 * resume el DÍA ANTERIOR completo (00:00 a 23:59 hora Argentina):
 * - Notificación in-app (siempre, una por día).
 * - Email a los administradores, solo si hubo ventas.
 */
import prisma from "@/DB/prisma";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";
import { parseFechaDesde } from "@/lib/utils/rangoFechas";
import { fechaArgentina } from "@/lib/suscripcion/vencimiento";
import { destinatariosAdministradores } from "@/lib/email/destinatarios";
import { escapeHtml, renderEmailLayout, type DatoEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";

export const ENTIDAD_TIPO_RESUMEN = "RESUMEN_DIARIO";
const SITE_URL = "https://www.puntox.com.ar";

/** Comprobantes que cuentan como ventas. */
const TIPOS_VENTA = [
  TIPO_COMPROBANTE_VENTA.FACTURA_A,
  TIPO_COMPROBANTE_VENTA.FACTURA_B,
  TIPO_COMPROBANTE_VENTA.FACTURA_C,
  TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
  TIPO_COMPROBANTE_VENTA.REMITO,
  TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE,
];

/** Día anterior en hora Argentina: { fecha: "YYYY-MM-DD", desde, hasta (excl.) }. */
export function diaAnteriorArgentina(ahora: Date) {
  const hoy = fechaArgentina(ahora);
  const ayerUtc = new Date(`${hoy}T00:00:00Z`);
  ayerUtc.setUTCDate(ayerUtc.getUTCDate() - 1);
  const fecha = ayerUtc.toISOString().slice(0, 10);
  return { fecha, desde: parseFechaDesde(fecha), hasta: parseFechaDesde(hoy) };
}

export const formatearMonto = (n: number) =>
  `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "2026-11-25" → "25/11/2026" */
const fechaLegible = (iso: string) => iso.split("-").reverse().join("/");

export interface DatosResumen {
  ventasCount: number;
  ventasTotal: number;
  stockBajoCount: number;
  cajasAbiertas: number;
}

/** Texto de la notificación in-app. */
export function mensajeResumen(d: DatosResumen): string {
  let mensaje =
    d.ventasCount === 0
      ? "Sin ventas registradas."
      : `${d.ventasCount} venta${d.ventasCount !== 1 ? "s" : ""} por ${formatearMonto(d.ventasTotal)}.`;
  if (d.stockBajoCount > 0) {
    mensaje += ` ${d.stockBajoCount} producto${d.stockBajoCount !== 1 ? "s" : ""} con stock bajo.`;
  }
  if (d.cajasAbiertas > 0) {
    mensaje += ` ${d.cajasAbiertas > 1 ? `${d.cajasAbiertas} cajas siguen abiertas` : "1 caja sigue abierta"}.`;
  }
  return mensaje;
}

export function emailResumen(comercio: string, fecha: string, d: DatosResumen) {
  const dia = fechaLegible(fecha);
  const datos: DatoEmail[] = [
    { label: "Ventas", valor: String(d.ventasCount) },
    { label: "Total vendido", valor: formatearMonto(d.ventasTotal) },
    {
      label: "Ticket promedio",
      valor: formatearMonto(d.ventasCount ? d.ventasTotal / d.ventasCount : 0),
    },
    {
      label: "Productos con stock bajo",
      valor: String(d.stockBajoCount),
      tono: d.stockBajoCount > 0 ? "alerta" : undefined,
    },
    {
      label: "Cajas abiertas ahora",
      valor: String(d.cajasAbiertas),
      tono: d.cajasAbiertas > 0 ? "alerta" : undefined,
    },
  ];
  const asunto = `Resumen del ${dia} · ${comercio}`;
  const html = renderEmailLayout({
    preheader: `${d.ventasCount} ventas por ${formatearMonto(d.ventasTotal)}`,
    titulo: `Resumen del ${dia}`,
    parrafosHtml: [`Así terminó el día en <strong style="color:#181c1f;">${escapeHtml(comercio)}</strong>.`],
    datos,
    cta: { label: "Ver analíticas", url: `${SITE_URL}/analiticas` },
    notas: [
      "Recibís este resumen porque está activado en Configuración › Notificaciones.",
    ],
  });
  const text = [
    `Resumen del ${dia} · ${comercio}`,
    "",
    ...datos.map((x) => `${x.label}: ${x.valor}`),
    "",
    `Ver analíticas: ${SITE_URL}/analiticas`,
  ].join("\n");
  return { asunto, html, text };
}

async function calcularDatos(
  tenantId: bigint,
  desde: Date,
  hasta: Date,
): Promise<DatosResumen> {
  const ventas = await prisma.comprobante.aggregate({
    where: {
      TenantId: tenantId,
      EstaEliminado: false,
      Fecha: { gte: desde, lt: hasta },
      TipoComprobante: { in: TIPOS_VENTA },
    },
    _sum: { Total: true },
    _count: { Id: true },
  });

  const stockBajo = (await prisma.$queryRaw`
    SELECT COUNT(*) as "count"
    FROM "ArticuloStock" ast
    JOIN "Articulo" a ON ast."ArticuloId" = a."Id"
    WHERE ast."TenantId" = ${tenantId}
      AND a."EstaEliminado" = false
      AND ast."Stock" <= COALESCE(ast."StockMinimo", a."StockMinimo", 0)
  `) as Array<{ count: bigint }>;

  const cajasAbiertas = await prisma.caja.count({
    where: { TenantId: tenantId, EstaEliminado: false, FechaCierre: null },
  });

  return {
    ventasCount: ventas._count.Id,
    ventasTotal: Number(ventas._sum.Total ?? 0),
    stockBajoCount: Number(stockBajo[0]?.count ?? 0),
    cajasAbiertas,
  };
}

export interface ResumenEjecucion {
  fecha: string;
  procesados: number;
  emailsEnviados: number;
  errores: number;
}

export async function procesarResumenDiario(
  ahora: Date = new Date(),
): Promise<ResumenEjecucion> {
  const { fecha, desde, hasta } = diaAnteriorArgentina(ahora);

  const configs = await prisma.configuracion.findMany({
    where: {
      NotificacionesResumenDiario: true,
      EstaEliminado: false,
      Tenant: { EstaActivo: true, EstaEliminado: false },
    },
    select: { TenantId: true, Tenant: { select: { Nombre: true } } },
  });

  let procesados = 0;
  let emailsEnviados = 0;
  let errores = 0;

  for (const { TenantId: tenantId, Tenant } of configs) {
    try {
      // Una vez por día: si el cron corre de nuevo, no se repite.
      const existente = await prisma.notificacion.findFirst({
        where: {
          TenantId: tenantId,
          EntidadTipo: ENTIDAD_TIPO_RESUMEN,
          EntidadId: fecha,
        },
        select: { Id: true },
      });
      if (existente) continue;

      const datos = await calcularDatos(tenantId, desde, hasta);

      await prisma.notificacion.create({
        data: {
          TenantId: tenantId,
          UsuarioId: null,
          Tipo: datos.stockBajoCount > 0 || datos.cajasAbiertas > 0 ? "WARNING" : "INFO",
          Titulo: `Resumen del ${fechaLegible(fecha)}`,
          Mensaje: mensajeResumen(datos),
          AccionUrl: "/analiticas",
          EntidadTipo: ENTIDAD_TIPO_RESUMEN,
          EntidadId: fecha,
          Leida: false,
        },
      });
      procesados++;

      // Email solo si hubo ventas (evita emails vacíos los días cerrados).
      if (datos.ventasCount > 0) {
        const { emails } = await destinatariosAdministradores(tenantId);
        if (emails.length > 0) {
          const { asunto, html, text } = emailResumen(Tenant.Nombre, fecha, datos);
          const res = await sendEmail({ to: emails, subject: asunto, html, text });
          if (res.ok) emailsEnviados++;
          else if (!res.skipped) {
            console.error(`[resumen-diario] Email tenant ${tenantId}:`, res.error);
          }
        }
      }
    } catch (err) {
      console.error(`[resumen-diario] Error tenant ${tenantId}:`, err);
      errores++;
    }
  }

  return { fecha, procesados, emailsEnviados, errores };
}
