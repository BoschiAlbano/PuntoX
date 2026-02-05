import { z } from "zod";

export const createUsuarioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  dni: z.string().optional().nullable(),
  direccion: z.string().min(1, "La dirección es requerida"),
  telefono: z.string().optional().nullable(),
  mail: z.string().email("Email inválido").optional().or(z.literal("")),
  localidadId: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  departamentoId: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
  provinciaId: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
  nombreUsuario: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rolId: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
  sucursalId: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
});

export const updateUsuarioSchema = z.object({
  personaId: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  nombre: z.string().min(1, "El nombre es requerido").optional(),
  apellido: z.string().min(1, "El apellido es requerido").optional(),
  dni: z.string().optional().nullable(),
  direccion: z.string().min(1, "La dirección es requerida").optional(),
  telefono: z.string().optional().nullable(),
  localidadId: z.union([z.number(), z.string()]).optional().transform((val) => val ? Number(val) : undefined),
  departamentoId: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
  provinciaId: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
  rolId: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
  sucursalId: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;

