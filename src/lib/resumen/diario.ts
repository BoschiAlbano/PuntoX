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
import { TIPO_COMPROBANTE_VENTA, TIPO_PAGO } from "@/lib/constants/comprobantes";
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

/** Cantidad máxima de filas por sección del email (el resto: "y N más"). */
const MAX_FILAS = 5;

export interface ItemStockBajo {
  nombre: string;
  sucursal: string | null;
  stock: number;
  minimo: number;
}

export interface ClienteSobreLimite {
  nombre: string;
  saldo: number;
  limite: number;
}

export interface CajaConDiferencia {
  sucursal: string | null;
  /** Contado − esperado: negativo = falta plata, positivo = sobra. */
  diferencia: number;
}

export interface DatosResumen {
  ventasCount: number;
  ventasTotal: number;
  stockBajoCount: number;
  cajasAbiertas: number;
  /** Detalle (hasta MAX_FILAS) de los productos con stock bajo. */
  stockBajo?: ItemStockBajo[];
  clientesSobreLimiteCount?: number;
  /** Detalle (hasta MAX_FILAS) de clientes con saldo mayor a su límite. */
  clientesSobreLimite?: ClienteSobreLimite[];
  /** Cajas cerradas ese día con diferencia en el arqueo de efectivo. */
  cajasConDiferencia?: CajaConDiferencia[];
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

const textoDiferencia = (d: number) =>
  `${d > 0 ? "Sobran" : "Faltan"} ${formatearMonto(Math.abs(d))}`;

/** Texto de la notificación in-app. */
export function mensajeResumen(d: DatosResumen): string {
  const partes = [
    d.ventasCount === 0
      ? "Sin ventas registradas."
      : `${plural(d.ventasCount, "venta", "ventas")} por ${formatearMonto(d.ventasTotal)}.`,
  ];
  if (d.stockBajoCount > 0) {
    partes.push(`${plural(d.stockBajoCount, "producto", "productos")} con stock bajo.`);
  }
  const clientes = d.clientesSobreLimiteCount ?? 0;
  if (clientes > 0) {
    partes.push(`${plural(clientes, "cliente superó", "clientes superaron")} su límite de crédito.`);
  }
  const diferencias = d.cajasConDiferencia?.length ?? 0;
  if (diferencias > 0) {
    partes.push(`${plural(diferencias, "caja cerró", "cajas cerraron")} con diferencia.`);
  }
  if (d.cajasAbiertas > 0) {
    partes.push(d.cajasAbiertas > 1 ? `${d.cajasAbiertas} cajas siguen abiertas.` : "1 caja sigue abierta.");
  }
  return partes.join(" ");
}

/** Sección de detalle con título, filas y "y N más". */
function seccion<T>(
  titulo: string,
  total: number,
  filas: T[],
  aDato: (f: T) => DatoEmail,
): DatoEmail[] {
  if (total === 0) return [];
  const datos: DatoEmail[] = [
    { label: `${titulo} (${total})`, valor: "", seccion: true },
    ...filas.map(aDato),
  ];
  if (total > filas.length) {
    datos.push({ label: `y ${total - filas.length} más`, valor: "" });
  }
  return datos;
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
      label: "Cajas abiertas ahora",
      valor: String(d.cajasAbiertas),
      tono: d.cajasAbiertas > 0 ? "alerta" : undefined,
    },
    ...seccion("Cajas cerradas con diferencia", d.cajasConDiferencia?.length ?? 0, d.cajasConDiferencia ?? [], (c) => ({
      label: c.sucursal ?? "Sucursal",
      valor: textoDiferencia(c.diferencia),
      tono: "alerta",
    })),
    ...seccion("Clientes sobre su límite de crédito", d.clientesSobreLimiteCount ?? 0, d.clientesSobreLimite ?? [], (c) => ({
      label: c.nombre,
      valor: `${formatearMonto(c.saldo)} / límite ${formatearMonto(c.limite)}`,
      tono: "alerta",
    })),
    ...seccion("Stock bajo", d.stockBajoCount, d.stockBajo ?? [], (s) => ({
      label: s.sucursal ? `${s.nombre} · ${s.sucursal}` : s.nombre,
      valor: `${s.stock} (mín. ${s.minimo})`,
    })),
  ];
  const asunto = `Resumen del ${dia} · ${comercio}`;
  const html = renderEmailLayout({
    preheader: mensajeResumen(d),
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
    ...datos.map((x) => (x.seccion ? `\n${x.label}` : `${x.label}${x.valor ? `: ${x.valor}` : ""}`)),
    "",
    `Ver analíticas: ${SITE_URL}/analiticas`,
  ].join("\n");
  return { asunto, html, text };
}

export async function calcularDatos(
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

  // Stock bajo: total y los más críticos (menor margen sobre el mínimo).
  const stockBajo = (await prisma.$queryRaw`
    SELECT a."Descripcion" AS nombre,
           s."Nombre" AS sucursal,
           ast."Stock"::float AS stock,
           COALESCE(ast."StockMinimo", a."StockMinimo", 0)::float AS minimo,
           COUNT(*) OVER ()::int AS total
    FROM "ArticuloStock" ast
    JOIN "Articulo" a ON ast."ArticuloId" = a."Id"
    LEFT JOIN "Sucursal" s ON s."Id" = ast."SucursalId"
    WHERE ast."TenantId" = ${tenantId}
      AND a."EstaEliminado" = false
      AND ast."Stock" <= COALESCE(ast."StockMinimo", a."StockMinimo", 0)
    ORDER BY ast."Stock" - COALESCE(ast."StockMinimo", a."StockMinimo", 0) ASC, a."Descripcion"
    LIMIT ${MAX_FILAS}
  `) as Array<ItemStockBajo & { total: number }>;

  // Clientes con límite de compra cuyo saldo de cuenta corriente lo supera.
  // Saldo = ventas a cuenta corriente − pagos (misma regla que /api/clientes).
  const sobreLimite = (await prisma.$queryRaw`
    WITH ventas AS (
      SELECT fcc."ClienteId" AS id, SUM(fp."Monto") AS total
      FROM "FormaPago" fp
      JOIN "FormaPago_CtaCte" fcc ON fcc."Id" = fp."Id"
      JOIN "Comprobante" c ON c."Id" = fp."ComprobanteId"
      WHERE fp."TenantId" = ${tenantId}
        AND fp."TipoPago" = ${TIPO_PAGO.CUENTA_CORRIENTE}
        AND fp."EstaEliminado" = false
        AND c."EstaEliminado" = false
      GROUP BY fcc."ClienteId"
    ), pagos AS (
      SELECT cc."ClienteId" AS id, SUM(c."Total") AS total
      FROM "Comprobante" c
      JOIN "Comprobante_CuentaCorriente" cc ON cc."Id" = c."Id"
      WHERE c."TenantId" = ${tenantId}
        AND c."EstaEliminado" = false
        AND c."TipoComprobante" = ${TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE}
      GROUP BY cc."ClienteId"
    )
    SELECT trim(p."Nombre" || ' ' || p."Apellido") AS nombre,
           (COALESCE(v.total, 0) - COALESCE(pg.total, 0))::float AS saldo,
           pc."MontoMaximoCtaCte"::float AS limite,
           COUNT(*) OVER ()::int AS total
    FROM "Persona_Cliente" pc
    JOIN "Persona" p ON p."Id" = pc."Id"
    LEFT JOIN ventas v ON v.id = pc."Id"
    LEFT JOIN pagos pg ON pg.id = pc."Id"
    WHERE p."TenantId" = ${tenantId}
      AND p."EstaEliminado" = false
      AND pc."TieneLimiteCompra" = true
      AND pc."MontoMaximoCtaCte" > 0
      AND COALESCE(v.total, 0) - COALESCE(pg.total, 0) > pc."MontoMaximoCtaCte"
    ORDER BY (COALESCE(v.total, 0) - COALESCE(pg.total, 0)) - pc."MontoMaximoCtaCte" DESC
    LIMIT ${MAX_FILAS}
  `) as Array<ClienteSobreLimite & { total: number }>;

  // Cajas cerradas ese día con diferencia en el arqueo de efectivo
  // (esperado = inicial + entradas − salidas en efectivo, como en Caja Actual).
  const cajasCerradas = await prisma.caja.findMany({
    where: {
      TenantId: tenantId,
      EstaEliminado: false,
      FechaCierre: { gte: desde, lt: hasta },
    },
    select: {
      MontoInicial: true,
      MontoCierre: true,
      TotalEntradaEfectivo: true,
      TotalSalidaEfectivo: true,
      Sucursal: { select: { Nombre: true } },
    },
  });
  const cajasConDiferencia = cajasCerradas
    .map((c) => ({
      sucursal: c.Sucursal?.Nombre ?? null,
      diferencia:
        Math.round(
          (Number(c.MontoCierre ?? 0) -
            (Number(c.MontoInicial) + Number(c.TotalEntradaEfectivo) - Number(c.TotalSalidaEfectivo))) *
            100,
        ) / 100,
    }))
    .filter((c) => c.diferencia !== 0);

  const cajasAbiertas = await prisma.caja.count({
    where: { TenantId: tenantId, EstaEliminado: false, FechaCierre: null },
  });

  return {
    ventasCount: ventas._count.Id,
    ventasTotal: Number(ventas._sum.Total ?? 0),
    stockBajoCount: stockBajo[0]?.total ?? 0,
    stockBajo: stockBajo.map(({ nombre, sucursal, stock, minimo }) => ({ nombre, sucursal, stock, minimo })),
    clientesSobreLimiteCount: sobreLimite[0]?.total ?? 0,
    clientesSobreLimite: sobreLimite.map(({ nombre, saldo, limite }) => ({ nombre, saldo, limite })),
    cajasConDiferencia,
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
