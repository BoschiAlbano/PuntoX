import { z } from "zod";

export const createProductoSchema = z.object({
  // Relaciones (IDs) - Se esperan números
  MarcaId: z.number().int({ message: "MarcaId debe ser un entero" }),
  RubroId: z.number().int({ message: "RubroId debe ser un entero" }),
  UnidadMedidaId: z
    .number()
    .int({ message: "UnidadMedidaId debe ser un entero" }),
  IvaId: z.number().int({ message: "IvaId debe ser un entero" }),

  // Identificación
  Codigo: z.number().int({ message: "El código debe ser un número entero" }),
  CodigoBarra: z
    .string({ message: "El código de barras debe ser texto" })
    .min(1, { message: "El código de barras es obligatorio" })
    .max(100, {
      message: "El código de barras no puede superar los 100 caracteres",
    }),
  Abreviatura: z.string().max(20).optional().nullable(),

  // Descripción
  Descripcion: z
    .string({ message: "La descripción debe ser texto" })
    .min(1, { message: "La descripción es obligatoria" })
    .max(250, { message: "La descripción no puede superar los 250 caracteres" })
    .trim(),
  Detalle: z.string().max(500).optional().nullable(),
  Ubicacion: z.string().max(500).optional().nullable(),

  // Precios (Se reciben como number desde el front, Prisma usa Decimal)
  PrecioCosto: z
    .number({ message: "El precio de costo debe ser un número" })
    .min(0),
  PorcentajeGanancia: z
    .number({ message: "El porcentaje de ganancia debe ser un número" })
    .min(0),
  PrecioPublico: z.number({ message: "El precio publico debe ser un número" }),
  PorcentajeGanancia2: z
    .number({ message: "El porcentaje de ganancia debe ser un número" })
    .min(0),
  PrecioPublico2: z.number({ message: "El precio publico debe ser un número" }),
  // Configuración de Venta
  ActivarLimiteVenta: z.boolean().default(false),
  LimiteVenta: z.number().min(0).default(0),
  ActivarHoraVenta: z.boolean().default(false),
  // Las horas suelen venir como string "HH:mm" del input type="time" o ISO Dates
  HoraLimiteVentaDesde: z.string().optional().nullable(),
  HoraLimiteVentaHasta: z.string().optional().nullable(),
  TipoVenta: z.number().int().default(0), // 0: Normal, 1: Peso, etc.

  // Stock
  PermiteStockNegativo: z.boolean().default(false),
  DescuentaStock: z.boolean().default(true),
  StockMinimo: z.number().min(0).default(0),
  VencimientoDias: z.number().int().min(0).default(0),

  // Estado
  EstaEliminado: z.boolean().default(false),

  // Imagen (Opcional, puede ser base64)
  Foto: z.any().optional(), // Se valida aparte o se procesa como Buffer
});

export const updateProductoSchema = z.object({
  Id: z.number().int({ message: "Id debe ser un entero" }),
  // Relaciones (IDs) - Se esperan números
  MarcaId: z.number().int({ message: "MarcaId debe ser un entero" }).optional(),
  RubroId: z.number().int({ message: "RubroId debe ser un entero" }).optional(),
  UnidadMedidaId: z
    .number()
    .int({ message: "UnidadMedidaId debe ser un entero" })
    .optional(),
  IvaId: z.number().int({ message: "IvaId debe ser un entero" }).optional(),

  // Identificación
  Codigo: z
    .number()
    .int({ message: "El código debe ser un número entero" })
    .optional(),
  CodigoBarra: z
    .string({ message: "El código de barras debe ser texto" })
    .min(1, { message: "El código de barras es obligatorio" })
    .max(100, {
      message: "El código de barras no puede superar los 100 caracteres",
    })
    .optional(),
  Abreviatura: z.string().max(20).optional().nullable(),

  // Descripción
  Descripcion: z
    .string({ message: "La descripción debe ser texto" })
    .min(1, { message: "La descripción es obligatoria" })
    .max(250, { message: "La descripción no puede superar los 250 caracteres" })
    .trim()
    .optional(),
  Detalle: z.string().max(500).optional().nullable(),
  Ubicacion: z.string().max(500).optional().nullable(),

  // Precios (Se reciben como number desde el front, Prisma usa Decimal)
  PrecioCosto: z
    .number({ message: "El precio de costo debe ser un número" })
    .min(0)
    .optional(),
  PorcentajeGanancia: z
    .number({ message: "El porcentaje de ganancia debe ser un número" })
    .min(0)
    .optional(),
  PrecioPublico: z
    .number({ message: "El precio publico debe ser un número" })
    .optional(),
  PorcentajeGanancia2: z
    .number({ message: "El porcentaje de ganancia debe ser un número" })
    .min(0)
    .optional(),
  PrecioPublico2: z
    .number({ message: "El precio publico debe ser un número" })
    .optional(),
  // Configuración de Venta
  ActivarLimiteVenta: z.boolean().default(false).optional(),
  LimiteVenta: z.number().min(0).default(0).optional(),
  ActivarHoraVenta: z.boolean().default(false).optional(),
  // Las horas suelen venir como string "HH:mm" del input type="time" o ISO Dates
  HoraLimiteVentaDesde: z.string().optional().nullable(),
  HoraLimiteVentaHasta: z.string().optional().nullable(),
  TipoVenta: z.number().int().default(0).optional(), // 0: Normal, 1: Peso, etc.

  // Stock
  PermiteStockNegativo: z.boolean().default(false).optional(),
  DescuentaStock: z.boolean().default(true).optional(),
  StockMinimo: z.number().min(0).default(0).optional(),
  VencimientoDias: z.number().int().min(0).default(0).optional(),

  // Estado
  EstaEliminado: z.boolean().default(false).optional(),

  // Imagen (Opcional, puede ser base64)
  Foto: z.any().optional(), // Se valida aparte o se procesa como Buffer
});

export type CreateProductoInput = z.infer<typeof createProductoSchema>;
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;
