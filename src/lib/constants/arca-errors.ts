/**
 * Módulo de manejo de errores de ARCA (ex-AFIP).
 *
 * Centraliza el mapeo de códigos de error a mensajes legibles para el usuario,
 * y provee utilidades para parsear la respuesta cruda de ARCA.
 */

// ─── Mapa de códigos conocidos ────────────────────────────────────────────────
// Fuente: https://www.afip.gob.ar/fe/documentos/ErroresObservaciones.pdf
const ARCA_ERROR_MAP: Record<number, string> = {
  // ── Fechas ──
  10016: "Fecha del comprobante fuera del rango permitido (debe estar entre N-5 y N+5 días)",
  10017: "Fecha de servicio inválida",
  10018: "Fecha de vencimiento de pago inválida",

  // ── Tipo de comprobante ──
  10020: "Tipo de comprobante no válido para este punto de venta",
  10021: "Tipo de comprobante inexistente",
  10022: "Tipo de documento del receptor no válido",

  // ── Números y rangos ──
  10023: "El número de comprobante ya fue utilizado",
  10024: "El número de comprobante debe ser consecutivo al último autorizado",
  10025: "Rango de comprobantes agotado para este punto de venta",

  // ── Documento del receptor ──
  10030: "CUIT del receptor inválido",
  10031: "CUIT del receptor no encontrado en_padron",
  10032: "El receptor no puede ser el mismo que el emisor",
  10033: "Documento del receptor no válido para el tipo de comprobante",

  // ── Importes ──
  10040: "El importe total no coincide con la suma de neto + IVA + tributos",
  10041: "El importe neto no puede ser cero o negativo",
  10042: "El importe de IVA no coincide con las alícuotas informadas",
  10043: "El importe total no puede ser cero",
  10044: "Error en el cálculo de IVA: la suma de alícuotas no coincide",
  10045: "El monto conciliado no puede ser negativo",

  // ── IVA ──
  10051: "Alícuota IVA no válida para el tipo de comprobante",
  10052: "Base imponible de IVA inválida",
  10053: "Importe de IVA inválido",

  // ── Condiciones IVA ──
  10060: "Condición IVA del receptor no válida para el tipo de comprobante",
  10061: "Emisor no autorizado a emitir este tipo de comprobante",
  10062: "El emisor no se encuentra habilitado para facturación electrónica",

  // ── Moneda ──
  10070: "Código de moneda no válido",
  10071: "Tipo de cambio no válido",

  // ── Certificado / Autenticación ──
  20010: "Certificado digital vencido o inválido",
  20011: "Error de autenticación con ARCA",
  20012: "Servicio de ARCA momentáneamente no disponible",

  // ── Punto de venta ──
  30001: "Punto de venta no válido o no registrado",
  30002: "Punto de venta no habilitado para facturación electrónica",
};

// Mensaje por defecto para códigos no conocidos
const DEFAULT_ERROR_MSG = "Error no identificado en ARCA. Verifique los datos del comprobante.";

// ─── Funciones públicas ───────────────────────────────────────────────────────

/**
 * Dado un código de error numérico de ARCA, retorna el mensaje legible.
 * Si el código no está en el mapa, retorna el mensaje por defecto.
 */
export function getArcaErrorMessage(code: number): string {
  return ARCA_ERROR_MAP[code] ?? DEFAULT_ERROR_MSG;
}

/**
 * Extrae los códigos de error numéricos de un string crudo de ARCA.
 * El formato típico es: "[10016] Campo CbteFch ..."
 * También soporta errores de cabecera: "[20010] Certificado..."
 */
export function extractArcaErrorCodes(raw: string): number[] {
  const matches = raw.match(/\[(\d+)\]/g);
  if (!matches) return [];
  return matches
    .map((m) => parseInt(m.replace(/[\[\]]/g, ""), 10))
    .filter((n) => !isNaN(n));
}

/**
 * Toma el string crudo de observaciones/errores de ARCA y retorna un mensaje
 * filtrado y legible para el usuario.
 *
 * Ejemplo de input: "[10016] Campo CbteFch Debe estar comprendido en el rango ..."
 * Output: "Fecha del comprobante fuera del rango permitido (debe estar entre N-5 y N+5 días)"
 */
export function parseArcaObservations(raw: string): string {
  if (!raw || !raw.trim()) return "Sin detalle de error";

  const codes = extractArcaErrorCodes(raw);
  if (codes.length === 0) return raw.trim();

  const messages = codes.map((code) => getArcaErrorMessage(code));
  // Eliminar duplicados manteniendo orden
  const unique = [...new Set(messages)];
  return unique.join(" | ");
}

/**
 * Interfaz para observaciones parseadas de ARCA.
 */
export interface ArcaObservation {
  code: number;
  message: string;
  raw: string;
}

/**
 * Parsea las observaciones de ARCA en un array de objetos estructurados.
 * Útil si necesitás mostrar cada error por separado en la UI.
 */
export function parseArcaObservationsDetailed(raw: string): ArcaObservation[] {
  if (!raw || !raw.trim()) return [];

  // Extraer cada par [código] mensaje
  const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
  const result: ArcaObservation[] = [];

  for (const part of parts) {
    const codeMatch = part.match(/^\[(\d+)\]\s*(.*)/);
    if (codeMatch) {
      const code = parseInt(codeMatch[1], 10);
      const rawMsg = codeMatch[2];
      result.push({
        code,
        message: getArcaErrorMessage(code),
        raw: rawMsg || part,
      });
    } else {
      // Sin código, texto libre
      result.push({ code: 0, message: part, raw: part });
    }
  }

  return result;
}
