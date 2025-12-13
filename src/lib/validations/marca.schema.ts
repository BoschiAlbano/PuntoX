import { z } from "zod";

/**
 * Schema de validación para crear una nueva Marca
 */
export const createMarcaSchema = z.object({
  Descripcion: z
    .string({ message: "La descripción debe ser un texto" })
    .min(1, { message: "La descripción no puede estar vacía" })
    .max(250, { message: "La descripción no puede exceder los 250 caracteres" })
    .trim(),
  EstaEliminado: z.boolean().optional().default(false),
});

/**
 * Schema de validación para actualizar una Marca existente
 */
export const updateMarcaSchema = z.object({
  Descripcion: z
    .string()
    .min(1, { message: "La descripción no puede estar vacía" })
    .max(250, { message: "La descripción no puede exceder los 250 caracteres" })
    .trim()
    .optional(),
  EstaEliminado: z.boolean().optional(),
});

/**
 * Tipos TypeScript inferidos desde los schemas
 */
export type CreateMarcaInput = z.infer<typeof createMarcaSchema>;
export type UpdateMarcaInput = z.infer<typeof updateMarcaSchema>;

export interface Marca {
  Id: number;
  Descripcion: string;
}
