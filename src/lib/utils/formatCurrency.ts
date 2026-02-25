/**
 * Formatea un valor numérico como moneda usando Intl.NumberFormat.
 * Usa la moneda configurada en la app (Configuracion.Moneda).
 *
 * @param value - Valor numérico a formatear
 * @param currency - Código ISO de moneda (ej: ARS, USD, EUR). Por defecto "ARS"
 * @returns String formateado (ej: "$ 1.234,56" para ARS)
 */
export function formatCurrency(value: number, currency = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea un valor numérico como moneda en notación compacta (ej: 1,2K, 1,5M).
 * Útil para ejes de gráficas.
 */
export function formatCurrencyCompact(value: number, currency = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    notation: "compact",
  }).format(value);
}

/**
 * Retorna el símbolo de moneda para un código ISO (ej: ARS → "$", EUR → "€").
 */
export function getCurrencySymbol(currency = "ARS"): string {
  return (
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? "$"
  );
}

/**
 * Opciones para NumberInput/formatOptions de HeroUI.
 * Usar con formatOptions en campos monetarios.
 *
 * @param currency - Código ISO de moneda (ej: ARS, USD, EUR). Por defecto "ARS"
 */
export function getCurrencyFormatOptions(currency = "ARS") {
  return {
    style: "currency" as const,
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
}
