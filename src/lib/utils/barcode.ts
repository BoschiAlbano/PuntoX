export interface ScaleBarcodeResult {
  plu: string;
  value: number; // Peso o Precio
  type: "weight" | "price";
  originalBarcode: string;
  valueRaw: number;
}

interface ScaleConfig {
  active: boolean;
  prefix: string;
  isWeight: boolean; // true = peso, false = precio
  codeLength?: number; // Longitud del PLU (default 5 for EAN-13 standard 2+5+5+1)
  priceDecimals?: number; // Cantidad de decimales para el precio (default 2)
}

/**
 * Parsea un código de barras de balanza (EAN-13)
 * Formato esperado: PP CCCCC VVVVV D
 * PP: Prefijo (2 dígitos)
 * CCCCC: Código del producto / PLU (5 dígitos)
 * VVVVV: Valor (Peso o Precio) (5 dígitos). Se asume 3 decimales para peso, 2 para precio (o configurable)?
 * D: Dígito verificador
 */
export function parseScaleBarcode(
  barcode: string,
  config: ScaleConfig,
): ScaleBarcodeResult | null {
  if (!config.active) return null;
  if (!barcode || barcode.length !== 13) return null;

  const prefix = config.prefix || "20"; // Default prefix if empty
  if (!barcode.startsWith(prefix)) return null;

  // Extraer partes
  // Asumiendo estructura estándar: 2 (prefix) + 5 (PLU) + 5 (Value) + 1 (Check)
  const prefixLength = prefix.length;
  // Ajustamos si el codeLength es diferente, pero por defecto EAN-13 balanza es fijo.
  const pluLength = 5;
  const valueLength = 5;

  const plu = barcode.substring(prefixLength, prefixLength + pluLength);
  const valueString = barcode.substring(
    prefixLength + pluLength,
    prefixLength + pluLength + valueLength,
  );

  const valueRaw = parseInt(valueString, 10);

  let value = 0;
  // Interpretación del valor
  if (config.isWeight) {
    // Si es peso, usualmente son 3 decimales (kg)
    // Ej: 01500 -> 1.500 kg
    value = valueRaw / 1000;
  } else {
    // Si es precio, usamos la configuración de decimales
    // Default 2 decimales: Ej: 00500 -> $5.00
    // Si es 0 decimales: Ej: 00500 -> $500
    const decimals =
      config.priceDecimals !== undefined ? config.priceDecimals : 2;
    value = valueRaw / Math.pow(10, decimals);
  }

  // Validar dígito verificador
  if (!isValidEan13(barcode)) {
    return null;
  }

  return {
    plu,
    value,
    type: config.isWeight ? "weight" : "price",
    originalBarcode: barcode,
    valueRaw,
  };
}

/**
 * Valida el dígito verificador de un código EAN-13 (Módulo 10)
 */
function isValidEan13(code: string): boolean {
  if (code.length !== 13) return false;

  const digits = code.split("").map(Number);
  const checkDigit = digits[12];

  let sum = 0;
  // Sumar los primeros 12 dígitos con peso 1 (impares) y 3 (pares)
  // Nota: índices 0-11. Posiciones reales 1-12.
  // Pos 1 (indice 0) -> peso 1
  // Pos 2 (indice 1) -> peso 3
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digits[i] * weight;
  }

  const remainder = sum % 10;
  const calculatedCheckDigit = remainder === 0 ? 0 : 10 - remainder;

  return checkDigit === calculatedCheckDigit;
}

// Ejemplo: 2000001005001 - Articulo venta por unidad
// PP: 20
// CCCCC: 00001
// VVVVV: 00500
// D: 1

// Ejemplo: 2000002005001 - Articulo venta por peso
// PP: 20
// CCCCC: 00002
// VVVVV: 00500
// D: 1
