import z from "zod";

export const comboItemSchema = z.object({
  ArticuloId: z.union([z.number(), z.string()]),
  CantidadRequerida: z.number().min(0.001, "La cantidad debe ser mayor a 0"),
  ArticuloNombre: z.string().optional(), // Solo para uso en UI
});

export const createComboSchema = z.object({
  Nombre: z.string().min(1, "El nombre es requerido"),
  PrecioFinal: z.number().min(0, "El precio final no puede ser negativo"),
  EstaActiva: z.boolean().default(true),
  Items: z.array(comboItemSchema).min(1, "Debe añadir al menos 1 producto al combo"),
});

export const updateComboSchema = z.object({
  Id: z.union([z.number(), z.string()]),
  Nombre: z.string().min(1, "El nombre es requerido").optional(),
  PrecioFinal: z.number().min(0, "El precio final no puede ser negativo").optional(),
  EstaActiva: z.boolean().optional(),
  Items: z.array(comboItemSchema).min(1, "Debe añadir al menos 1 producto al combo").optional(),
});

export type ComboItemInput = z.infer<typeof comboItemSchema>;
export type CreateComboInput = z.infer<typeof createComboSchema>;
export type UpdateComboInput = z.infer<typeof updateComboSchema>;

export interface PromocionCombo {
  Id: number | string;
  Nombre: string;
  PrecioFinal: number;
  EstaActiva: boolean;
  CantidadProductos: number; // Campo calculado para la grilla
  Items?: {
    Id: number | string;
    ArticuloId: number | string;
    CantidadRequerida: number;
    ArticuloNombre?: string;
  }[];
}
