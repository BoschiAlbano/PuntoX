/**
 * Funciones de cálculo para ventas
 */

/**
 * Calcula el subtotal de un producto
 * @throws {Error} Si los parámetros son inválidos
 */
export function calcularSubtotal(
  precio: number,
  cantidad: number,
  descuento: number = 0
): number {
  // Validaciones
  if (precio < 0) {
    throw new Error("El precio no puede ser negativo");
  }
  if (cantidad < 0) {
    throw new Error("La cantidad no puede ser negativa");
  }
  if (descuento < 0 || descuento > 100) {
    throw new Error("El descuento debe estar entre 0 y 100%");
  }

  const resultado = precio * cantidad * (1 - descuento / 100);
  // Asegurar que el resultado no sea negativo (por redondeo)
  return Math.max(0, Math.round(resultado * 100) / 100);
}

/**
 * Calcula el IVA de un subtotal
 * @throws {Error} Si los parámetros son inválidos
 */
export function calcularIva(subtotal: number, porcentajeIva: number): number {
  // Validaciones
  if (subtotal < 0) {
    throw new Error("El subtotal no puede ser negativo");
  }
  if (porcentajeIva < 0 || porcentajeIva > 100) {
    throw new Error("El porcentaje de IVA debe estar entre 0 y 100%");
  }

  const resultado = subtotal * (porcentajeIva / 100);
  // Redondear a 2 decimales
  return Math.round(resultado * 100) / 100;
}

/**
 * Calcula el total de una venta
 * @throws {Error} Si los parámetros son inválidos
 */
export function calcularTotal(
  subtotal: number,
  iva21: number,
  iva105: number,
  descuento: number = 0
): number {
  // Validaciones
  if (subtotal < 0) {
    throw new Error("El subtotal no puede ser negativo");
  }
  if (iva21 < 0) {
    throw new Error("El IVA 21% no puede ser negativo");
  }
  if (iva105 < 0) {
    throw new Error("El IVA 10.5% no puede ser negativo");
  }
  if (descuento < 0) {
    throw new Error("El descuento no puede ser negativo");
  }

  const totalSinDescuento = subtotal + iva21 + iva105;
  if (descuento > totalSinDescuento) {
    throw new Error("El descuento no puede ser mayor que el total sin descuento");
  }

  const resultado = totalSinDescuento - descuento;
  // Asegurar que el resultado no sea negativo y redondear a 2 decimales
  return Math.max(0, Math.round(resultado * 100) / 100);
}

