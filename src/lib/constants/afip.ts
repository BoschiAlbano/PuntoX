// Tipos de comprobante AFIP (códigos oficiales WSFEv1)
export const CBTE_TIPO_AFIP = {
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
} as const;

export type CbteTipoAfip = (typeof CBTE_TIPO_AFIP)[keyof typeof CBTE_TIPO_AFIP];

// Mapeo: tipo comprobante local (de comprobantes.ts) → tipo AFIP
// Local types: FACTURA_A=1, FACTURA_B=2, FACTURA_C=3, NOTA_CREDITO=6
export const TIPO_COMPROBANTE_LOCAL_A_AFIP: Record<number, number> = {
  1: CBTE_TIPO_AFIP.FACTURA_A,      // FACTURA_A local → 1 AFIP
  2: CBTE_TIPO_AFIP.FACTURA_B,      // FACTURA_B local → 6 AFIP
  3: CBTE_TIPO_AFIP.FACTURA_C,      // FACTURA_C local → 11 AFIP
};

// Tipos de comprobante local que requieren autorización AFIP
export const TIPOS_COMPROBANTE_FISCAL = [1, 2, 3, 6] as const; // FACTURA_A, FACTURA_B, FACTURA_C, NOTA_CREDITO

// Tipos de documento receptor (códigos AFIP)
export const DOC_TIPO_AFIP = {
  CUIT: 80,
  CUIL: 86,
  CDI: 87,
  LE: 89,
  LC: 90,
  CI_EXTRANJERA: 91,
  PASAPORTE: 94,
  DNI: 96,
  SIN_IDENTIFICAR: 99, // Consumidor Final
} as const;

export type DocTipoAfip = (typeof DOC_TIPO_AFIP)[keyof typeof DOC_TIPO_AFIP];

// Alícuotas IVA (códigos AFIP WSFEv1)
export const IVA_AFIP = {
  NO_GRAVADO: 1,
  EXENTO: 2,
  CERO: 3,
  DIEZ_CINCO: 4,   // 10.5%
  VEINTIUNO: 5,     // 21%
  VEINTISIETE: 6,   // 27%
  CINCO: 8,         // 5%
  DOS_CINCO: 9,     // 2.5%
} as const;

export type IvaAfipId = (typeof IVA_AFIP)[keyof typeof IVA_AFIP];

// Mapeo: porcentaje IVA → código AFIP
export const PORCENTAJE_IVA_A_AFIP: Record<string, number> = {
  '0': IVA_AFIP.CERO,
  '0.00': IVA_AFIP.CERO,
  '2.5': IVA_AFIP.DOS_CINCO,
  '2.50': IVA_AFIP.DOS_CINCO,
  '5': IVA_AFIP.CINCO,
  '5.00': IVA_AFIP.CINCO,
  '10.5': IVA_AFIP.DIEZ_CINCO,
  '10.50': IVA_AFIP.DIEZ_CINCO,
  '21': IVA_AFIP.VEINTIUNO,
  '21.00': IVA_AFIP.VEINTIUNO,
  '27': IVA_AFIP.VEINTISIETE,
  '27.00': IVA_AFIP.VEINTISIETE,
};

// IVA AFIP → porcentaje decimal
export const IVA_AFIP_A_PORCENTAJE: Record<number, number> = {
  [IVA_AFIP.CERO]: 0,
  [IVA_AFIP.DOS_CINCO]: 2.5,
  [IVA_AFIP.CINCO]: 5,
  [IVA_AFIP.DIEZ_CINCO]: 10.5,
  [IVA_AFIP.VEINTIUNO]: 21,
  [IVA_AFIP.VEINTISIETE]: 27,
};

// Conceptos AFIP
export const CONCEPTO_AFIP = {
  PRODUCTOS: 1,
  SERVICIOS: 2,
  PRODUCTOS_Y_SERVICIOS: 3,
} as const;

// Monedas AFIP
export const MONEDA_AFIP = {
  PESO_ARGENTINO: 'PES',
  DOLAR_ESTADOUNIDENSE: 'DOL',
  EURO: '060',
  REAL: '012',
} as const;

// Mapeo: moneda del sistema → código AFIP
export const MONEDA_LOCAL_A_AFIP: Record<string, string> = {
  'ARS': MONEDA_AFIP.PESO_ARGENTINO,
  'USD': MONEDA_AFIP.DOLAR_ESTADOUNIDENSE,
  'EUR': MONEDA_AFIP.EURO,
};

// Condiciones IVA que determinan tipo de factura
export const CONDICION_IVA_AFIP = {
  RESPONSABLE_INSCRIPTO: 1,
  RESPONSABLE_NO_INSCRIPTO: 2,
  NO_RESPONSABLE: 3,
  MONOTRIBUTISTA: 4,
  EXENTO: 5,
  CONSUMIDOR_FINAL: 6,
  NO_CATEGORIZADO: 7,
  IMPORTADOR: 8,
  EXTERIOR: 9,
  LIBERADO: 10,
  IVA_RNI_AGENTE_RETENCION: 11,
} as const;

// Mapeo: descripción local de CondicionIva → código AFIP
export const CONDICION_IVA_LOCAL_TO_AFIP: Record<string, number> = {
  "responsable inscripto": CONDICION_IVA_AFIP.RESPONSABLE_INSCRIPTO,
  "monotributista": CONDICION_IVA_AFIP.MONOTRIBUTISTA,
  "exento": CONDICION_IVA_AFIP.EXENTO,
  "no responsable": CONDICION_IVA_AFIP.NO_RESPONSABLE,
  "consumidor final": CONDICION_IVA_AFIP.CONSUMIDOR_FINAL,
};

// Estados de factura electrónica
export const ESTADO_FACTURA_ELECTRONICA = {
  PENDIENTE: 'PENDIENTE',
  AUTORIZADO: 'AUTORIZADO',
  RECHAZADO: 'RECHAZADO',
} as const;

// Resultado AFIP
export const RESULTADO_AFIP = {
  APROBADO: 'A',
  RECHAZADO: 'R',
  PARCIAL: 'P',
} as const;

// Labels para mostrar en UI
export const CBTE_TIPO_AFIP_LABELS: Record<number, string> = {
  [CBTE_TIPO_AFIP.FACTURA_A]: 'Factura A',
  [CBTE_TIPO_AFIP.NOTA_DEBITO_A]: 'Nota de Débito A',
  [CBTE_TIPO_AFIP.NOTA_CREDITO_A]: 'Nota de Crédito A',
  [CBTE_TIPO_AFIP.FACTURA_B]: 'Factura B',
  [CBTE_TIPO_AFIP.NOTA_DEBITO_B]: 'Nota de Débito B',
  [CBTE_TIPO_AFIP.NOTA_CREDITO_B]: 'Nota de Crédito B',
  [CBTE_TIPO_AFIP.FACTURA_C]: 'Factura C',
  [CBTE_TIPO_AFIP.NOTA_DEBITO_C]: 'Nota de Débito C',
  [CBTE_TIPO_AFIP.NOTA_CREDITO_C]: 'Nota de Crédito C',
};

export const ESTADO_FE_LABELS: Record<string, string> = {
  [ESTADO_FACTURA_ELECTRONICA.PENDIENTE]: 'Pendiente',
  [ESTADO_FACTURA_ELECTRONICA.AUTORIZADO]: 'Autorizado',
  [ESTADO_FACTURA_ELECTRONICA.RECHAZADO]: 'Rechazado',
};

/**
 * Determina qué tipo de comprobante AFIP emitir según condición IVA del emisor y receptor.
 * Regla:
 * - Emisor Resp. Inscripto + Receptor Resp. Inscripto → Factura A
 * - Emisor Resp. Inscripto + Receptor Consumidor Final/Exento/Monotributista → Factura B
 * - Emisor Monotributista/Exento + Cualquier receptor → Factura C
 */
export function determinarTipoCbteAfip(
  condicionIvaEmisor: number,
  condicionIvaReceptor: number,
  tipoComprobanteLocal: number, // 1=FA, 2=FB, 3=FC from local system
): number | null {
  // Si el tipo local ya determina A/B/C, mapeamos directamente
  const afipTipo = TIPO_COMPROBANTE_LOCAL_A_AFIP[tipoComprobanteLocal];
  return afipTipo ?? null;
}

/**
 * Verifica si un tipo de comprobante local requiere autorización AFIP
 */
export function requiereAutorizacionAfip(tipoComprobanteLocal: number): boolean {
  return TIPOS_COMPROBANTE_FISCAL.includes(tipoComprobanteLocal as any);
}

/**
 * Determina el código AFIP de Nota de Crédito (A/B/C) a partir del tipo LOCAL
 * de la FACTURA que se está acreditando (no de la nota de crédito en sí).
 * AFIP no tiene un único código de "Nota de Crédito": la letra tiene que
 * coincidir con la de la factura asociada (Factura A → NC-A, etc.).
 * Retorna null si el tipo local no corresponde a ninguna Factura A/B/C.
 */
export function getCbteTipoNotaCredito(
  tipoFacturaOriginalLocal: number,
): number | null {
  switch (tipoFacturaOriginalLocal) {
    case 1: // FACTURA_A
      return CBTE_TIPO_AFIP.NOTA_CREDITO_A;
    case 2: // FACTURA_B
      return CBTE_TIPO_AFIP.NOTA_CREDITO_B;
    case 3: // FACTURA_C
      return CBTE_TIPO_AFIP.NOTA_CREDITO_C;
    default:
      return null;
  }
}
