import z from "zod";

// Schema para crear proveedor
export const createProveedorSchema = z.object({
  RazonSocial: z.string().min(1, "La razón social es requerida"),
  CUIT: z.string().min(1, "El CUIT es requerido").max(15, "El CUIT no puede exceder los 15 caracteres"),
  Direccion: z.string().min(1, "La dirección es requerida"),
  Telefono: z.string().max(25, "El teléfono no puede exceder los 25 caracteres").optional().nullable(),
  Mail: z.string().email("Email inválido"),
  LocalidadId: z.union([z.number(), z.string()]),
  CondicionIvaId: z.union([z.number(), z.string()]),
});

// Schema para actualizar proveedor
export const updateProveedorSchema = z.object({
  Id: z.union([z.number(), z.string()]),
  RazonSocial: z.string().min(1, "La razón social es requerida").optional(),
  CUIT: z.string().min(1, "El CUIT es requerido").max(15, "El CUIT no puede exceder los 15 caracteres").optional(),
  Direccion: z.string().min(1, "La dirección es requerida").optional(),
  Telefono: z.string().max(25, "El teléfono no puede exceder los 25 caracteres").optional().nullable(),
  Mail: z.string().email("Email inválido").optional(),
  LocalidadId: z.union([z.number(), z.string()]).optional(),
  CondicionIvaId: z.union([z.number(), z.string()]).optional(),
});

export type CreateProveedorInput = z.infer<typeof createProveedorSchema>;
export type UpdateProveedorInput = z.infer<typeof updateProveedorSchema>;

export interface Proveedor {
  Id: number;
  RazonSocial: string;
  CUIT: string;
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
}
