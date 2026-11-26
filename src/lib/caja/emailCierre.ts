/**
 * Email "Caja cerrada" a los administradores, con el arqueo del turno.
 * Se activa con Configuracion.NotificacionesCierreCaja (Configuración ›
 * Notificaciones). Lo dispara PATCH /api/caja?accion=cerrar en segundo plano
 * (after()), así que nunca bloquea ni hace fallar el cierre.
 *
 * Efectivo esperado = monto inicial + entradas en efectivo − salidas en
 * efectivo (misma fórmula que la pantalla Caja Actual).
 */
import prisma from "@/DB/prisma";
import { destinatariosAdministradores } from "@/lib/email/destinatarios";
import { escapeHtml, renderEmailLayout, type DatoEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import { formatearMonto } from "@/lib/resumen/diario";

const SITE_URL = "https://www.puntox.com.ar";
const ZONA = "America/Argentina/Buenos_Aires";

const hora = (d: Date) =>
  d.toLocaleString("es-AR", {
    timeZone: ZONA,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23", // "20:30" en lugar de "08:30 p. m."
  });

interface UsuarioCaja {
  Nombre: string;
  Persona_Empleado: { Persona: { Nombre: string; Apellido: string } | null } | null;
}

const nombreDe = (u: UsuarioCaja | null) => {
  const p = u?.Persona_Empleado?.Persona;
  return p ? `${p.Nombre} ${p.Apellido}`.trim() : (u?.Nombre ?? "—");
};

export interface CajaParaEmail {
  MontoInicial: unknown;
  MontoCierre: unknown;
  FechaApertura: Date;
  FechaCierre: Date | null;
  TotalEntradaEfectivo: unknown;
  TotalSalidaEfectivo: unknown;
  TotalEntradaTarjeta: unknown;
  TotalEntradaTransf: unknown;
  TotalEntradaCheque: unknown;
  TotalEntradaCtaCte: unknown;
  TotalSalidaTarjeta: unknown;
  TotalSalidaTransf: unknown;
  TotalSalidaCheque: unknown;
  TotalSalidaCtaCte: unknown;
  Ganancia: unknown;
  Sucursal: { Nombre: string } | null;
  Tenant: { Nombre: string };
  Usuario_Caja_UsuarioAperturaIdToUsuario: UsuarioCaja | null;
  Usuario_Caja_UsuarioCierreIdToUsuario: UsuarioCaja | null;
}

/** Arqueo: efectivo esperado, contado y diferencia (contado − esperado). */
export function calcularArqueo(caja: CajaParaEmail) {
  const n = (v: unknown) => Number(v ?? 0);
  const esperado =
    n(caja.MontoInicial) + n(caja.TotalEntradaEfectivo) - n(caja.TotalSalidaEfectivo);
  const contado = n(caja.MontoCierre);
  const diferencia = Math.round((contado - esperado) * 100) / 100;
  const entradas = {
    efectivo: n(caja.TotalEntradaEfectivo),
    tarjeta: n(caja.TotalEntradaTarjeta),
    transferencia: n(caja.TotalEntradaTransf),
    cheque: n(caja.TotalEntradaCheque),
    ctaCte: n(caja.TotalEntradaCtaCte),
  };
  const salidas =
    n(caja.TotalSalidaEfectivo) +
    n(caja.TotalSalidaTarjeta) +
    n(caja.TotalSalidaTransf) +
    n(caja.TotalSalidaCheque) +
    n(caja.TotalSalidaCtaCte);
  const totalEntradas = Object.values(entradas).reduce((a, b) => a + b, 0);
  return { esperado, contado, diferencia, entradas, totalEntradas, salidas, ganancia: n(caja.Ganancia) };
}

export function emailCierreCaja(caja: CajaParaEmail) {
  const a = calcularArqueo(caja);
  const sucursal = caja.Sucursal?.Nombre ?? "Sucursal";
  const comercio = caja.Tenant.Nombre;

  const textoDiferencia =
    a.diferencia === 0
      ? "Sin diferencia"
      : `${a.diferencia > 0 ? "Sobran" : "Faltan"} ${formatearMonto(Math.abs(a.diferencia))}`;

  const medios: [string, number][] = [
    ["Efectivo", a.entradas.efectivo],
    ["Tarjeta", a.entradas.tarjeta],
    ["Transferencia", a.entradas.transferencia],
    ["Cheque", a.entradas.cheque],
    ["Cuenta corriente", a.entradas.ctaCte],
  ];

  const datos: DatoEmail[] = [
    { label: "Arqueo de efectivo", valor: "", seccion: true },
    { label: "Efectivo esperado", valor: formatearMonto(a.esperado) },
    { label: "Efectivo contado", valor: formatearMonto(a.contado) },
    {
      label: "Diferencia",
      valor: textoDiferencia,
      tono: a.diferencia === 0 ? "ok" : "alerta",
    },
    { label: "Entradas por medio de pago", valor: "", seccion: true },
    // Solo medios con movimiento, pero siempre el efectivo
    ...medios
      .filter(([label, v]) => v !== 0 || label === "Efectivo")
      .map(([label, v]) => ({ label, valor: formatearMonto(v) })),
    { label: "Total entradas", valor: formatearMonto(a.totalEntradas) },
    { label: "Salidas y gastos", valor: formatearMonto(a.salidas) },
    { label: "Ganancia del turno", valor: formatearMonto(a.ganancia) },
  ];

  const abrio = nombreDe(caja.Usuario_Caja_UsuarioAperturaIdToUsuario);
  const cerro = nombreDe(caja.Usuario_Caja_UsuarioCierreIdToUsuario);
  const turno = `${hora(caja.FechaApertura)} a ${caja.FechaCierre ? hora(caja.FechaCierre) : "—"}`;

  const asunto =
    a.diferencia === 0
      ? `Caja cerrada · ${sucursal} · ${formatearMonto(a.totalEntradas)}`
      : `Caja cerrada con diferencia · ${sucursal} · ${textoDiferencia}`;

  const html = renderEmailLayout({
    preheader: `${textoDiferencia}. Entradas ${formatearMonto(a.totalEntradas)}.`,
    titulo: `Caja cerrada · ${sucursal}`,
    parrafosHtml: [
      `<strong style="color:#181c1f;">${escapeHtml(comercio)}</strong> · Turno ${escapeHtml(turno)}.<br>Abrió ${escapeHtml(abrio)} y cerró ${escapeHtml(cerro)}.`,
    ],
    datos,
    cta: { label: "Ver historial de cajas", url: `${SITE_URL}/caja` },
    notas: [
      "Recibís este email porque \"Email al cerrar caja\" está activado en Configuración › Notificaciones.",
    ],
  });

  const text = [
    `Caja cerrada · ${sucursal} (${comercio})`,
    `Turno ${turno}. Abrió ${abrio} y cerró ${cerro}.`,
    "",
    ...datos.filter((d) => !d.seccion).map((d) => `${d.label}: ${d.valor}`),
    "",
    `Ver historial de cajas: ${SITE_URL}/caja`,
  ].join("\n");

  return { asunto, html, text };
}

const SELECT_USUARIO = {
  select: {
    Nombre: true,
    Persona_Empleado: {
      select: { Persona: { select: { Nombre: true, Apellido: true } } },
    },
  },
} as const;

/** Envía el email si la opción está activada. Nunca lanza: registra errores. */
export async function enviarEmailCierreCaja(
  cajaId: bigint,
  tenantId: bigint,
): Promise<"enviado" | "desactivado" | "sin_destinatarios" | "error"> {
  try {
    const config = await prisma.configuracion.findFirst({
      where: { TenantId: tenantId, EstaEliminado: false },
      orderBy: { Id: "desc" }, // misma fila que usa Configuración
      select: { NotificacionesCierreCaja: true },
    });
    if (!config?.NotificacionesCierreCaja) return "desactivado";

    const caja = await prisma.caja.findFirst({
      where: { Id: cajaId, TenantId: tenantId },
      select: {
        MontoInicial: true,
        MontoCierre: true,
        FechaApertura: true,
        FechaCierre: true,
        TotalEntradaEfectivo: true,
        TotalSalidaEfectivo: true,
        TotalEntradaTarjeta: true,
        TotalEntradaTransf: true,
        TotalEntradaCheque: true,
        TotalEntradaCtaCte: true,
        TotalSalidaTarjeta: true,
        TotalSalidaTransf: true,
        TotalSalidaCheque: true,
        TotalSalidaCtaCte: true,
        Ganancia: true,
        Sucursal: { select: { Nombre: true } },
        Tenant: { select: { Nombre: true } },
        Usuario_Caja_UsuarioAperturaIdToUsuario: SELECT_USUARIO,
        Usuario_Caja_UsuarioCierreIdToUsuario: SELECT_USUARIO,
      },
    });
    if (!caja) return "error";

    const { emails } = await destinatariosAdministradores(tenantId);
    if (emails.length === 0) return "sin_destinatarios";

    const { asunto, html, text } = emailCierreCaja(caja as CajaParaEmail);
    const res = await sendEmail({ to: emails, subject: asunto, html, text });
    if (res.ok) return "enviado";
    if (!res.skipped) console.error("[cierre-caja] Email:", res.error);
    return "error";
  } catch (error) {
    console.error("[cierre-caja] Error al enviar el email:", error);
    return "error";
  }
}
