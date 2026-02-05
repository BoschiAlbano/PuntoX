import { z } from "zod";
import { TiposVenta } from "../../../prisma/generated/prisma";

// Función helper para validar formato de hora HH:mm
function isValidTimeFormat(time: string | null | undefined): boolean {
  if (!time) return true; // Opcional
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Función helper para convertir hora HH:mm a minutos para comparación
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export const createProductoSchema = z
  .object({
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
      .max(250, {
        message: "La descripción no puede superar los 250 caracteres",
      })
      .trim(),
    Detalle: z.string().max(500).optional().nullable(),
    Ubicacion: z.string().max(500).optional().nullable(),

    // Configuración de Venta
    ActivarLimiteVenta: z.boolean().default(false),
    LimiteVenta: z.number().min(0).default(0),
    ActivarHoraVenta: z.boolean().default(false),
    // Las horas suelen venir como string "HH:mm" del input type="time" o ISO Dates
    HoraLimiteVentaDesde: z.string().optional().nullable(),
    HoraLimiteVentaHasta: z.string().optional().nullable(),
    TipoVenta: z.nativeEnum(TiposVenta).default(TiposVenta.UNIDAD),

    // Stock
    PermiteStockNegativo: z.boolean().default(false),
    DescuentaStock: z.boolean().default(true),
    StockMinimo: z.number().min(0).default(0),
    VencimientoDias: z.number().int().min(0).default(0),

    Stock: z.number().min(0).default(0),

    // Estado
    EstaEliminado: z.boolean().default(false),

    // Imagen (Opcional, puede ser base64)
    Foto: z.any().optional(), // Se valida aparte o se procesa como Buffer

    Precio: z.object({
      PrecioCosto: z
        .number({ message: "El precio de costo debe ser un número" })
        .min(0),
      PorcentajeGanancia: z
        .number({ message: "El porcentaje de ganancia debe ser un número" })
        .min(0),
      PrecioPublico: z.number({
        message: "El precio publico debe ser un número",
      }),
      PorcentajeGanancia2: z
        .number({ message: "El porcentaje de ganancia debe ser un número" })
        .min(0),
      PrecioPublico2: z.number({
        message: "El precio publico debe ser un número",
      }),
    }),
  })
  .refine(
    (data) => {
      // Validar que StockMinimo <= Stock
      return data.StockMinimo <= data.Stock;
    },
    {
      message: "El stock mínimo no puede ser mayor que el stock actual",
      path: ["StockMinimo"],
    }
  )
  .refine(
    (data) => {
      // Validar que LimiteVenta <= Stock cuando ActivarLimiteVenta = true
      if (data.ActivarLimiteVenta) {
        return data.LimiteVenta <= data.Stock;
      }
      return true;
    },
    {
      message:
        "El límite de venta no puede ser mayor que el stock cuando está activado",
      path: ["LimiteVenta"],
    }
  )
  .refine(
    (data) => {
      // Validar formato de horas cuando ActivarHoraVenta = true
      if (data.ActivarHoraVenta) {
        if (data.HoraLimiteVentaDesde && !isValidTimeFormat(data.HoraLimiteVentaDesde)) {
          return false;
        }
        if (data.HoraLimiteVentaHasta && !isValidTimeFormat(data.HoraLimiteVentaHasta)) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Las horas deben tener el formato HH:mm (ej: 09:00, 18:30)",
      path: ["HoraLimiteVentaDesde"],
    }
  )
  .refine(
    (data) => {
      // Validar que HoraLimiteVentaDesde < HoraLimiteVentaHasta cuando ambas están presentes
      if (
        data.ActivarHoraVenta &&
        data.HoraLimiteVentaDesde &&
        data.HoraLimiteVentaHasta &&
        isValidTimeFormat(data.HoraLimiteVentaDesde) &&
        isValidTimeFormat(data.HoraLimiteVentaHasta)
      ) {
        return (
          timeToMinutes(data.HoraLimiteVentaDesde) <
          timeToMinutes(data.HoraLimiteVentaHasta)
        );
      }
      return true;
    },
    {
      message:
        "La hora de inicio debe ser menor que la hora de fin",
      path: ["HoraLimiteVentaHasta"],
    }
  );

export const updateProductoSchema = z
  .object({
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
      .max(250, {
        message: "La descripción no puede superar los 250 caracteres",
      })
      .trim()
      .optional(),
    Detalle: z.string().max(500).optional().nullable(),
    Ubicacion: z.string().max(500).optional().nullable(),

    // Precios (Se reciben como number desde el front, Prisma usa Decimal)
    Precio: z
      .object({
        PrecioCosto: z
          .number({ message: "El precio de costo debe ser un número" })
          .min(0)
          .optional(),
        PorcentajeGanancia: z
          .number({ message: "El porcentaje de ganancia debe ser un número" })
          .min(0)
          .optional(),
        PrecioPublico: z
          .number({
            message: "El precio publico debe ser un número",
          })
          .optional(),
        PorcentajeGanancia2: z
          .number({ message: "El porcentaje de ganancia debe ser un número" })
          .min(0)
          .optional(),
        PrecioPublico2: z
          .number({
            message: "El precio publico debe ser un número",
          })
          .optional(),
      })
      .optional(),
    // Configuración de Venta
    ActivarLimiteVenta: z.boolean().optional(),
    LimiteVenta: z.number().min(0).optional(),
    ActivarHoraVenta: z.boolean().optional(),
    // Las horas suelen venir como string "HH:mm" del input type="time" o ISO Dates
    HoraLimiteVentaDesde: z.string().optional().nullable(),
    HoraLimiteVentaHasta: z.string().optional().nullable(),
    TipoVenta: z.nativeEnum(TiposVenta).optional(),

    // Stock
    PermiteStockNegativo: z.boolean().optional(),
    DescuentaStock: z.boolean().optional(),
    StockMinimo: z.number().min(0).optional(),
    VencimientoDias: z.number().int().min(0).optional(),

    Stock: z.number().optional(),

    // Estado
    EstaEliminado: z.boolean().optional(),

    // Imagen (Opcional, puede ser base64)
    Foto: z.any().optional(), // Se valida aparte o se procesa como Buffer
  })
  .refine(
    (data) => {
      // Validar que hay al menos un campo además de Id
      const keys = Object.keys(data).filter((key) => key !== "Id");
      return keys.length > 0;
    },
    {
      message: "Debe proporcionar al menos un campo para actualizar además del Id",
      path: ["Id"],
    }
  )
  .refine(
    (data) => {
      // Validar que StockMinimo <= Stock cuando ambos están presentes
      if (data.StockMinimo !== undefined && data.Stock !== undefined) {
        return data.StockMinimo <= data.Stock;
      }
      return true;
    },
    {
      message: "El stock mínimo no puede ser mayor que el stock actual",
      path: ["StockMinimo"],
    }
  )
  .refine(
    (data) => {
      // Validar que LimiteVenta <= Stock cuando ActivarLimiteVenta = true y ambos están presentes
      if (
        data.ActivarLimiteVenta &&
        data.LimiteVenta !== undefined &&
        data.Stock !== undefined
      ) {
        return data.LimiteVenta <= data.Stock;
      }
      return true;
    },
    {
      message:
        "El límite de venta no puede ser mayor que el stock cuando está activado",
      path: ["LimiteVenta"],
    }
  )
  .refine(
    (data) => {
      // Validar formato de horas cuando ActivarHoraVenta = true
      if (data.ActivarHoraVenta) {
        if (
          data.HoraLimiteVentaDesde &&
          !isValidTimeFormat(data.HoraLimiteVentaDesde)
        ) {
          return false;
        }
        if (
          data.HoraLimiteVentaHasta &&
          !isValidTimeFormat(data.HoraLimiteVentaHasta)
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Las horas deben tener el formato HH:mm (ej: 09:00, 18:30)",
      path: ["HoraLimiteVentaDesde"],
    }
  )
  .refine(
    (data) => {
      // Validar que HoraLimiteVentaDesde < HoraLimiteVentaHasta cuando ambas están presentes
      if (
        data.ActivarHoraVenta &&
        data.HoraLimiteVentaDesde &&
        data.HoraLimiteVentaHasta &&
        isValidTimeFormat(data.HoraLimiteVentaDesde) &&
        isValidTimeFormat(data.HoraLimiteVentaHasta)
      ) {
        return (
          timeToMinutes(data.HoraLimiteVentaDesde) <
          timeToMinutes(data.HoraLimiteVentaHasta)
        );
      }
      return true;
    },
    {
      message: "La hora de inicio debe ser menor que la hora de fin",
      path: ["HoraLimiteVentaHasta"],
    }
  );

export type CreateProductoInput = z.infer<typeof createProductoSchema>;
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;

export interface Producto {
  Id: number;
  MarcaId: number;
  RubroId: number;
  UnidadMedidaId: number;
  IvaId: number;
  PrecioId: number;
  Codigo: number;
  CodigoBarra: string;
  Abreviatura?: string;
  Descripcion: string;
  Detalle?: string;
  Ubicacion?: string;
  Foto?: string; // Base64 o URL
  ActivarLimiteVenta: boolean;
  LimiteVenta: number;
  ActivarHoraVenta: boolean;
  HoraLimiteVentaDesde: string;
  HoraLimiteVentaHasta: string;
  PermiteStockNegativo: boolean;
  DescuentaStock: boolean;
  StockMinimo: number;
  VencimientoDias: number;
  TipoVenta: TiposVenta;
  Stock: number;
  EstaEliminado: boolean;
  SucursalNombre?: string | null; // Nombre de la sucursal del stock mostrado
  Precio: {
    PorcentajeGanancia?: number;
    PorcentajeGanancia2?: number;
    PrecioPublico?: number;
    PrecioPublico2?: number;
    PrecioCosto?: number;
  };
  Iva?: {
    Id?: number;
    Porcentaje?: number;
    Descripcion?: string;
  };
}
