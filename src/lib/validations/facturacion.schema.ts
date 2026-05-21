import { z } from 'zod';

/**
 * Schema para upload de certificado digital AFIP.
 */
export const certificadoUploadSchema = z.object({
  certificado: z
    .string()
    .min(1, 'El certificado es requerido')
    .refine(
      (val) => val.includes('BEGIN CERTIFICATE') || val.includes('BEGIN TRUSTED CERTIFICATE'),
      'El archivo no parece ser un certificado válido (.crt/.pem)'
    ),
  clavePrivada: z
    .string()
    .min(1, 'La clave privada es requerida')
    .refine(
      (val) => val.includes('BEGIN') && (val.includes('PRIVATE KEY') || val.includes('RSA PRIVATE KEY')),
      'El archivo no parece ser una clave privada válida (.key/.pem)'
    ),
});

/**
 * Schema para configuración de punto de venta por sucursal.
 */
export const puntoVentaSucursalSchema = z.object({
  sucursalId: z.number().int().positive('ID de sucursal inválido'),
  puntoVentaAfip: z
    .number()
    .int()
    .min(1, 'El punto de venta debe ser al menos 1')
    .max(9998, 'El punto de venta no puede ser mayor a 9998'),
  domicilioFiscal: z.string().max(400).optional(),
});

/**
 * Schema para actualización masiva de puntos de venta.
 */
export const puntosVentaBulkSchema = z.object({
  puntosVenta: z.array(puntoVentaSucursalSchema).min(1, 'Debe configurar al menos un punto de venta'),
});

/**
 * Schema extendido para configuración fiscal (extiende el schema existente).
 */
export const fiscalConfigExtendidoSchema = z
  .object({
    moneda: z.string().optional(),
    zonaHoraria: z.string().optional(),
    idioma: z.string().optional(),
    condicionIvaId: z.number().int().positive().optional().nullable(),
    puntoVenta: z.string().optional(),
    inicioActividades: z.string().optional(),
    tipoIva: z.string().optional(),
    // Campos nuevos
    ingresosBrutos: z.string().max(50).optional(),
    afipHabilitado: z.boolean().optional(),
    afipEntornoProduccion: z.boolean().optional(),
  })
  .passthrough();

/**
 * Schema para verificación de conexión ARCA.
 */
export const verificarConexionSchema = z.object({
  // No requiere parámetros, usa la configuración del tenant
}).optional();
