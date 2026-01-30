// Constantes para tipos de comprobante
export const TIPO_COMPROBANTE_VENTA = {
  FACTURA_A: 1,
  FACTURA_B: 2,
  FACTURA_C: 3,
  PRESUPUESTO: 4,
  REMITO: 5,
  NOTA_CREDITO: 6,
  CUENTA_CORRIENTE_CLIENTE: 7,
} as const;

export const TIPO_COMPROBANTE_COMPRA = {
  COMPRA: 8,
  CTA_CORRIENTE_PROVEEDOR: 9,
} as const;

// Constantes para tipos de pago
export const TIPO_PAGO = {
  EFECTIVO: 1,
  TARJETA: 2,
  CHEQUE: 3,
  CUENTA_CORRIENTE: 4,
  TRANSFERENCIA: 5,
} as const;

// Constantes para estados de factura
export const ESTADO_FACTURA = {
  PENDIENTE: 1,
  CONFIRMADO: 2,
  ANULADO: 3,
} as const;

// Constantes para tipos de movimiento
export const TIPO_MOVIMIENTO = {
  ENTRADA: 1,
  SALIDA: 2,
} as const;
