import { z } from "zod";

/**
 * Schema de validación para crear un nuevo IVA
 */
export const createIvaSchema = z.object({
  Descripcion: z
    .string({ message: "La descripción debe ser un texto" })
    .min(1, { message: "La descripción no puede estar vacía" })
    .max(250, { message: "La descripción no puede exceder los 250 caracteres" })
    .trim(),
  Porcentaje: z
    .number({ message: "El porcentaje debe ser un número" })
    .min(0, { message: "El porcentaje no puede ser negativo" })
    .max(100, { message: "El porcentaje no puede ser mayor a 100" }),
  EstaEliminado: z.boolean().optional().default(false),
});

/**
 * Schema de validación para actualizar un IVA existente
 */
export const updateIvaSchema = z.object({
  Id: z.number(),
  Descripcion: z
    .string()
    .min(1, { message: "La descripción no puede estar vacía" })
    .max(250, { message: "La descripción no puede exceder los 250 caracteres" })
    .trim()
    .optional(),
  Porcentaje: z
    .number()
    .min(0, { message: "El porcentaje no puede ser negativo" })
    .max(100, { message: "El porcentaje no puede ser mayor a 100" })
    .optional(),
  EstaEliminado: z.boolean().optional(),
});

/**
 * Tipos TypeScript inferidos desde los schemas
 */
export type CreateIvaInput = z.infer<typeof createIvaSchema>;
export type UpdateIvaInput = z.infer<typeof updateIvaSchema>;

export interface Iva {
  Id: number;
  Descripcion: string;
  Porcentaje: number;
}
