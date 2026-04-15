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
// Permisos
export const PERMISSIONS = {
  // Ventas
  VENTAS: "ventas",

  // Caja
  CAJA: "caja",

  // Productos
  PRODUCTOS: "productos",

  // Proveedores
  PROVEEDORES: "proveedores",

  // Compras
  COMPRAS: "compras",

  // Empleados
  EMPLEADOS: "empleados",

  // Clientes
  CLIENTES: "clientes",

  // Reportes
  REPORTES: "reportes",

  // Configuración
  CONFIGURACION: "configuracion",

  // Sucursales
  SUCURSALES: "sucursales",

  // Auditoría
  AUDITORIA: "auditoria",

  // Analíticas
  ANALITICAS: "analiticas",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Tipos de perfil
export const TIPO_PERFIL = {
  ADMINISTRADOR: "ADMINISTRADOR",
  EMPLEADO: "EMPLEADO",
  SUPERADMIN: "SUPERADMIN",
} as const;

export type TipoPerfil = (typeof TIPO_PERFIL)[keyof typeof TIPO_PERFIL];

export const TIPO_PAGO_LABELS: Record<number, string> = {
  [TIPO_PAGO.EFECTIVO]: "Efectivo",
  [TIPO_PAGO.TARJETA]: "Tarjeta",
  [TIPO_PAGO.CHEQUE]: "Cheque",
  [TIPO_PAGO.CUENTA_CORRIENTE]: "Cuenta Corriente",
  [TIPO_PAGO.TRANSFERENCIA]: "Transferencia",
};

export const TIPO_MOVIMIENTO_LABELS: Record<number, string> = {
  [TIPO_MOVIMIENTO.ENTRADA]: "Entrada",
  [TIPO_MOVIMIENTO.SALIDA]: "Salida",
};

export const TIPO_COMPROBANTE_VENTA_LABELS: Record<number, string> = {
  [TIPO_COMPROBANTE_VENTA.FACTURA_A]: "Factura A",
  [TIPO_COMPROBANTE_VENTA.FACTURA_B]: "Factura B",
  [TIPO_COMPROBANTE_VENTA.FACTURA_C]: "Factura C",
  [TIPO_COMPROBANTE_VENTA.PRESUPUESTO]: "Presupuesto",
  [TIPO_COMPROBANTE_VENTA.REMITO]: "Remito",
  [TIPO_COMPROBANTE_VENTA.NOTA_CREDITO]: "Nota de Crédito",
  [TIPO_COMPROBANTE_VENTA.CUENTA_CORRIENTE_CLIENTE]: "Cuenta Corriente Cliente",
};

export const TIPO_COMPROBANTE_COMPRA_LABELS: Record<number, string> = {
  [TIPO_COMPROBANTE_COMPRA.COMPRA]: "Compra",
  [TIPO_COMPROBANTE_COMPRA.CTA_CORRIENTE_PROVEEDOR]:
    "Cuenta Corriente Proveedor",
};

export const ESTADO_FACTURA_LABELS: Record<number, string> = {
  [ESTADO_FACTURA.PENDIENTE]: "Pendiente",
  [ESTADO_FACTURA.CONFIRMADO]: "Confirmado",
  [ESTADO_FACTURA.ANULADO]: "Anulado",
};
