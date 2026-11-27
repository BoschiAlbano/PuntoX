import { z } from "zod";

/** Un límite del plan: número entero positivo, o null = ilimitado. */
const limite = z
  .number({ message: "El límite debe ser un número" })
  .int({ message: "El límite debe ser un número entero" })
  .min(1, { message: "El límite debe ser al menos 1" })
  .max(1_000_000, { message: "El límite es demasiado alto" })
  .nullable();

/** Límites de un plan. Se guardan como JSON en PlanSaaS.Caracteristicas. */
export const planLimitesSchema = z.object({
  maxSucursales: limite,
  maxUsuarios: limite,
  maxArticulos: limite,
  incluyeAFIP: z.boolean(),
});

export type PlanLimites = z.infer<typeof planLimitesSchema>;

export const createPlanSchema = z.object({
  Nombre: z
    .string({ message: "El nombre es requerido" })
    .trim()
    .min(1, { message: "El nombre es requerido" })
    .max(200, { message: "El nombre no puede exceder los 200 caracteres" }),
  Descripcion: z
    .string()
    .trim()
    .max(800, { message: "La descripción no puede exceder los 800 caracteres" })
    .nullable()
    .optional(),
  CostoMensual: z
    .number({ message: "El costo debe ser un número" })
    .min(0, { message: "El costo no puede ser negativo" })
    .max(99_999_999, { message: "El costo es demasiado alto" }),
  Limites: planLimitesSchema,
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  Id: z.union([z.number(), z.string().regex(/^\d+$/)]),
});
