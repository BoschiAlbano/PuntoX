// Constantes para tipos de comprobante
export const TIPO_COMPROBANTE = {
  FACTURA_A: 1,
  FACTURA_B: 2,
  FACTURA_C: 3,
  PRESUPUESTO: 4,
  REMITO: 5,
  NOTA_CREDITO: 6,
  NOTA_DEBITO: 7,
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
