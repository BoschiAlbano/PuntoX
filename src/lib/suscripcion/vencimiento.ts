/**
 * Reglas de vencimiento de la suscripción SaaS (compartidas por el cron de
 * avisos, el banner, el bloqueo de acceso y el panel del superadmin).
 *
 * Política (27/11/2026):
 * - Se avisa 7 días antes, 1 día antes y el día que vence.
 * - Después de vencer hay DIAS_GRACIA días de gracia: se usa normal, con aviso.
 * - Pasada la gracia, bloqueo total hasta que el superadmin renueva.
 * - Un comercio desactivado a mano (EstaActivo = false) también queda bloqueado.
 * - Sin FechaVencimiento (ej. Plan Ilimitado) nunca vence.
 */

const ZONA_HORARIA = "America/Argentina/Buenos_Aires";
const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** A partir de cuántos días antes se muestra el banner / se envía el 1er aviso. */
export const DIAS_PRIMER_AVISO = 7;

/** Días de uso normal después de vencer, antes del bloqueo. */
export const DIAS_GRACIA = 7;

/** Hasta cuántos días después de vencer puede corresponder un aviso. */
export const DIAS_MAX_AVISO_VENCIDO = DIAS_GRACIA + 1;

/**
 * - "7d" / "1d": antes de vencer.
 * - "vencido": vence hoy o está en gracia.
 * - "ultimo_dia": último día de gracia (mañana se bloquea).
 * - "bloqueado": primer día de bloqueo.
 */
export type EtapaAviso = "7d" | "1d" | "vencido" | "ultimo_dia" | "bloqueado";

export type EstadoSuscripcion =
  | "activa" // sin vencimiento o faltan más de DIAS_PRIMER_AVISO días
  | "por_vencer" // vence dentro de DIAS_PRIMER_AVISO días (o hoy)
  | "en_gracia" // venció hace 1..DIAS_GRACIA días: se usa con aviso
  | "vencida" // pasó la gracia: acceso bloqueado
  | "desactivada"; // EstaActivo = false: acceso bloqueado

/** Fecha calendario (YYYY-MM-DD) en hora de Argentina. */
export function fechaArgentina(fecha: Date): string {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

/**
 * Días calendario (hora de Argentina) desde `ahora` hasta `vencimiento`.
 * 0 = vence hoy, 1 = vence mañana, negativo = ya venció.
 */
export function diasHastaVencimiento(vencimiento: Date, ahora: Date): number {
  const a = Date.parse(`${fechaArgentina(ahora)}T00:00:00Z`);
  const v = Date.parse(`${fechaArgentina(vencimiento)}T00:00:00Z`);
  return Math.round((v - a) / MS_POR_DIA);
}

/**
 * Etapa de aviso que corresponde según los días restantes, o null si no hay
 * que avisar. Si el cron se saltea un día, igual se envía la etapa vigente.
 */
export function etapaAviso(dias: number): EtapaAviso | null {
  if (dias === -(DIAS_GRACIA + 1)) return "bloqueado";
  if (dias === -DIAS_GRACIA) return "ultimo_dia";
  if (dias <= 0) return dias > -DIAS_GRACIA ? "vencido" : null;
  if (dias === 1) return "1d";
  if (dias <= DIAS_PRIMER_AVISO) return "7d";
  return null;
}

/** Suma días calendario a una fecha (sin tocar la hora). */
function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * MS_POR_DIA);
}

/** Último día en que se puede usar el sistema vencido (fin de la gracia). */
export function ultimoDiaDeGracia(vencimiento: Date): Date {
  return sumarDias(vencimiento, DIAS_GRACIA);
}

/** Estado de la suscripción de un comercio en este momento. */
export function estadoSuscripcion(
  tenant: { EstaActivo: boolean; FechaVencimiento: Date | null },
  ahora: Date = new Date(),
): EstadoSuscripcion {
  if (!tenant.EstaActivo) return "desactivada";
  if (!tenant.FechaVencimiento) return "activa";
  const dias = diasHastaVencimiento(tenant.FechaVencimiento, ahora);
  if (dias >= 0) return dias <= DIAS_PRIMER_AVISO ? "por_vencer" : "activa";
  if (dias >= -DIAS_GRACIA) return "en_gracia";
  return "vencida";
}

/** El comercio no puede usar el sistema (vencida pasada la gracia, o desactivada). */
export const suscripcionBloqueada = (estado: EstadoSuscripcion) =>
  estado === "vencida" || estado === "desactivada";

/**
 * Desde qué fecha se suman los días al renovar:
 * - al día o en gracia: desde el vencimiento (pagar tarde no regala días);
 * - ya bloqueado (o sin fecha): desde hoy (los días bloqueados no se usaron).
 */
export function baseRenovacion(vencimiento: Date | null, ahora: Date = new Date()): Date {
  if (vencimiento && diasHastaVencimiento(vencimiento, ahora) >= -DIAS_GRACIA) {
    return new Date(vencimiento);
  }
  return new Date(ahora);
}

/** Fecha legible para el usuario, ej. "3/12/2026". */
export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", { timeZone: ZONA_HORARIA });
}

/** "vence hoy" / "vence mañana" / "vence en N días" / "venció el ...". */
export function describirVencimiento(vencimiento: Date, ahora: Date): string {
  const dias = diasHastaVencimiento(vencimiento, ahora);
  if (dias < 0) return `venció el ${formatearFecha(vencimiento)}`;
  if (dias === 0) return "vence hoy";
  if (dias === 1) return "vence mañana";
  return `vence en ${dias} días (el ${formatearFecha(vencimiento)})`;
}

/**
 * Link de WhatsApp para renovar, con mensaje precargado. El número se
 * configura en NEXT_PUBLIC_WHATSAPP_RENOVACION (con código de país, ej.
 * 5493511234567). Devuelve null si no está configurado.
 */
export function urlRenovacionWhatsapp(nombreComercio: string): string | null {
  const numero = (process.env.NEXT_PUBLIC_WHATSAPP_RENOVACION ?? "").replace(
    /\D/g,
    "",
  );
  if (!numero) return null;
  const texto = `Hola, quiero renovar la suscripción de PuntoX del comercio "${nombreComercio}".`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
