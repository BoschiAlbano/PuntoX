import { z } from "zod";

// Ajuste: 4 tipos simples con signo integrado en el nombre
export const TipoAjustePrecioEnum = z.enum([
  "incremento_porcentaje", // base x (1 + valor/100)  ->  +5%
  "decremento_porcentaje", // base x (1 - valor/100)  ->  -5%
  "incremento_fijo", // base + valor             ->  +$50
  "decremento_fijo", // base - valor             ->  -$50
]);
export type TipoAjustePrecio = z.infer<typeof TipoAjustePrecioEnum>;

export const TipoRedondeoEnum = z.enum(["none", "ceil", "ceil_99", "floor"]);
export type TipoRedondeo = z.infer<typeof TipoRedondeoEnum>;

export const TipoObjetivoEnum = z.enum([
  "todas_las_listas",
  "lista_especifica",
  "costo",
]);
export type TipoObjetivo = z.infer<typeof TipoObjetivoEnum>;

export const actualizarPreciosMasivoSchema = z.object({
  articuloIds: z
    .array(z.number().int().positive())
    .min(1, "Debe seleccionar al menos 1 articulo"),
  objetivo: TipoObjetivoEnum.default("todas_las_listas"),
  listaPrecioId: z.number().int().positive().nullable().optional(),
  tipo: TipoAjustePrecioEnum,
  valor: z
    .number()
    .min(0, "El valor debe ser positivo")
    .max(500, "El incremento no puede superar el 500%"),
  redondear: z.boolean().default(false),
  redondeoTipo: TipoRedondeoEnum.default("none"),
});

export type ActualizarPreciosMasivoInput = z.infer<
  typeof actualizarPreciosMasivoSchema
>;
