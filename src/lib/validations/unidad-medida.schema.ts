import { z } from "zod";

/**
 * Schema de validación para crear una nueva Unidad de Medida
 */
export const createUnidadMedidaSchema = z.object({
  Descripcion: z
    .string({ message: "La descripción debe ser un texto" })
    .min(1, { message: "La descripción no puede estar vacía" })
    .max(250, { message: "La descripción no puede exceder los 250 caracteres" })
    .trim(),
  EstaEliminado: z.boolean().optional().default(false),
});

/**
 * Schema de validación para actualizar una Unidad de Medida existente
 */
export const updateUnidadMedidaSchema = z.object({
  Id: z.number(),
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
export type CreateUnidadMedidaInput = z.infer<typeof createUnidadMedidaSchema>;
export type UpdateUnidadMedidaInput = z.infer<typeof updateUnidadMedidaSchema>;

export interface UnidadMedida {
  Id: number;
  Descripcion: string;
}
