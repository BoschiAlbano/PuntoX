import { z } from "zod";

/**
 * Schema de validación para crear una nueva Marca
 */
export const createRubroSchema = z.object({
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
export const updateRubroSchema = z.object({
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
export type CreateRubroInput = z.infer<typeof createRubroSchema>;
export type UpdateRubroInput = z.infer<typeof updateRubroSchema>;

export interface Rubro {
  Id: number;
  Descripcion: string;
}
