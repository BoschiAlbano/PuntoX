// Constantes para tipos de comprobante
export const TIPO_COMPROBANTE = {
  FACTURA: 1,
  PRESUPUESTO: 2,
  REMITO: 3,
  NOTA_CREDITO: 4,
  NOTA_DEBITO: 5,
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




