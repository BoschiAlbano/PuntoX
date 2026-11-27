/**
 * Dueño del comercio (Tenant.UsuarioDuenoId): el usuario que se crea con la
 * tienda. Otros usuarios con rol Administrador tienen el mismo acceso, pero
 * no pueden bloquearlo, cambiarle la contraseña, editarlo ni eliminarlo.
 * Solo él mismo o el superadmin. La propiedad la transfiere el superadmin.
 */
import prisma from "@/DB/prisma";
import { createError } from "@/lib/errors/types";

type Id = bigint | number | string;

/** Id del usuario dueño del comercio, o null si no tiene. */
export async function idDuenoDelTenant(tenantId: Id): Promise<bigint | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { Id: BigInt(tenantId) },
    select: { UsuarioDuenoId: true },
  });
  return tenant?.UsuarioDuenoId ?? null;
}

/**
 * Tira 403 si `usuarioAfectadoId` es el dueño del comercio y quien actúa no
 * es el propio dueño ni el superadmin.
 *
 * `accion` completa el mensaje: "No podés {accion} al dueño del comercio."
 */
export async function assertPuedeActuarSobreDueno(params: {
  tenantId: Id;
  usuarioAfectadoId: Id;
  actorId: Id;
  isSuperAdmin: boolean;
  accion: string;
}): Promise<void> {
  if (params.isSuperAdmin) return;
  const dueno = await idDuenoDelTenant(params.tenantId);
  if (dueno === null) return;
  const afectado = BigInt(params.usuarioAfectadoId);
  if (afectado !== dueno) return;
  if (BigInt(params.actorId) === dueno) return;
  throw createError.forbidden(`No podés ${params.accion} al dueño del comercio.`);
}
