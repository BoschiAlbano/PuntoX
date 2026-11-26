/**
 * Reglas de vencimiento de la suscripción SaaS (compartidas por el cron de
 * avisos, el banner del dashboard y los emails).
 *
 * Política actual: solo avisos, sin bloqueo. Se avisa 7 días antes, 1 día
 * antes y el día que vence.
 */

const ZONA_HORARIA = "America/Argentina/Buenos_Aires";
const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** A partir de cuántos días antes se muestra el banner / se envía el 1er aviso. */
export const DIAS_PRIMER_AVISO = 7;

/** Un vencido solo se avisa si venció hace como máximo estos días. */
export const DIAS_MAX_AVISO_VENCIDO = 7;

export type EtapaAviso = "7d" | "1d" | "vencido";

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
  if (dias <= 0) return dias >= -DIAS_MAX_AVISO_VENCIDO ? "vencido" : null;
  if (dias === 1) return "1d";
  if (dias <= DIAS_PRIMER_AVISO) return "7d";
  return null;
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
