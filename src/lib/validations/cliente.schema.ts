import z from "zod";
// Schema para crear cliente
export const createClienteSchema = z.object({
  Nombre: z.string().min(1, "El nombre es requerido"),
  Apellido: z.string().min(1, "El apellido es requerido"),
  Dni: z.string().max(8).optional().nullable(),
  Direccion: z.string().min(1, "La dirección es requerida"),
  Telefono: z.string().max(25).optional().nullable(),
  Mail: z.string().email("Email inválido"),
  LocalidadId: z.union([z.number(), z.string()]),
  CondicionIvaId: z.union([z.number(), z.string()]),
  ActivarCtaCte: z.boolean().optional().default(false),
  TieneLimiteCompra: z.boolean().optional().default(false),
  ListaPrecioId: z.union([z.number(), z.string()]).optional().nullable(),
  MontoMaximoCtaCte: z
    .number()
    .min(0)
    .max(999_999_999_999, "El monto máximo de cuenta corriente no puede exceder el límite")
    .optional()
    .default(0),
});

// Schema para actualizar cliente
export const updateClienteSchema = z.object({
  Id: z.union([z.number(), z.string()]),
  Nombre: z.string().min(1).optional(),
  Apellido: z.string().min(1).optional(),
  Dni: z.string().max(8).optional().nullable(),
  Direccion: z.string().min(1).optional(),
  Telefono: z.string().max(25).optional().nullable(),
  Mail: z.string().email().optional(),
  LocalidadId: z.union([z.number(), z.string()]).optional(),
  CondicionIvaId: z.union([z.number(), z.string()]).optional(),
  ActivarCtaCte: z.boolean().optional(),
  TieneLimiteCompra: z.boolean().optional(),
  ListaPrecioId: z.union([z.number(), z.string()]).optional().nullable(),
  MontoMaximoCtaCte: z
    .number()
    .min(0)
    .max(999_999_999_999, "El monto máximo de cuenta corriente no puede exceder el límite")
    .optional(),
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;

export interface Cliente {
  Id: number;
  Nombre: string;
  Apellido: string;
  Dni: string | null;
  Direccion: string;
  Telefono: string | null;
  Mail: string;
  LocalidadId: number;
  Localidad: string;
  ProvinciaId: number;
  Provincia: string;
  DepartamentoId: number;
  Departamento: string;
  CondicionIvaId: number;
  CondicionIva: string;
  ActivarCtaCte: boolean;
  TieneLimiteCompra: boolean;
  MontoMaximoCtaCte: number;
  ListaPrecioId?: number | null;
}
