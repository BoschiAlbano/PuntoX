/**
 * Funciones de cálculo para ventas
 */

/**
 * Calcula el subtotal de un producto
 */
export function calcularSubtotal(
  precio: number,
  cantidad: number,
  descuento: number = 0
): number {
  return precio * cantidad * (1 - descuento / 100);
}

/**
 * Calcula el IVA de un subtotal
 */
export function calcularIva(subtotal: number, porcentajeIva: number): number {
  return subtotal * (porcentajeIva / 100);
}

/**
 * Calcula el total de una venta
 */
export function calcularTotal(
  subtotal: number,
  iva21: number,
  iva105: number,
  descuento: number = 0
): number {
  return subtotal + iva21 + iva105 - descuento;
}

