// Argentina no tiene horario de verano: el offset es fijo (UTC-3).
const OFFSET_AR = "-03:00";
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Interpreta el inicio de un rango de fechas recibido por query string.
 * Un valor "YYYY-MM-DD" (lo que envían los filtros de la UI) es el comienzo de ese día en Argentina.
 */
export function parseFechaDesde(valor: string): Date {
  return SOLO_FECHA.test(valor)
    ? new Date(`${valor}T00:00:00.000${OFFSET_AR}`)
    : new Date(valor);
}

/**
 * Interpreta el fin de un rango de fechas recibido por query string.
 * Un valor "YYYY-MM-DD" incluye TODO ese día (hasta 23:59:59.999 en Argentina); sin esto,
 * `lte: new Date("2026-10-22")` corta a medianoche y excluye las ventas del último día.
 */
export function parseFechaHasta(valor: string): Date {
  return SOLO_FECHA.test(valor)
    ? new Date(`${valor}T23:59:59.999${OFFSET_AR}`)
    : new Date(valor);
}
