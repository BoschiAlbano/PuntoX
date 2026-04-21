import { z } from "zod";

/**
 * Schema de validación para crear una nueva Lista de Precio
 */
export const createListaPrecioSchema = z.object({
  Nombre: z
    .string({ message: "El nombre debe ser un texto" })
    .min(1, { message: "El nombre no puede estar vacío" })
    .max(100, { message: "El nombre no puede exceder los 100 caracteres" })
    .trim(),
  PorDefecto: z.boolean().optional().default(false),
  Activa: z.boolean().optional().default(true),
  EstaEliminado: z.boolean().optional().default(false),
});

/**
 * Schema de validación para actualizar una Lista de Precio existente
 */
export const updateListaPrecioSchema = z.object({
  Id: z.number(),
  Nombre: z
    .string()
    .min(1, { message: "El nombre no puede estar vacío" })
    .max(100, { message: "El nombre no puede exceder los 100 caracteres" })
    .trim()
    .optional(),
  PorDefecto: z.boolean().optional(),
  Activa: z.boolean().optional(),
  EstaEliminado: z.boolean().optional(),
});

/**
 * Tipos TypeScript inferidos desde los schemas
 */
export type CreateListaPrecioInput = z.infer<typeof createListaPrecioSchema>;
export type UpdateListaPrecioInput = z.infer<typeof updateListaPrecioSchema>;

export interface ListaPrecio {
  Id: number;
  Nombre: string;
  PorDefecto: boolean;
  Activa: boolean;
  EstaEliminado: boolean;
  CantidadArticulos?: number;
}
