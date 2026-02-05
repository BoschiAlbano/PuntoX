import prisma from "@/DB/prisma";
import { createError } from "@/lib/errors/types";

/**
 * Verifies if a branch exists, belongs to the tenant, and if the user has access to it.
 * @param tenantId The tenant ID
 * @param authUserId The Supabase Auth User ID
 * @param sucursalId The branch ID to verify
 * @returns The branch and user object if successful
 */
export async function verifyUserBranchAccess(
  tenantId: bigint,
  authUserId: string,
  sucursalId: bigint | string | number | null | undefined
) {
  if (!sucursalId) return null;

  const sucursalIdBigInt = BigInt(sucursalId);

  // 1. Check if branch exists and belongs to tenant
  const sucursal = await prisma.sucursal.findFirst({
    where: {
      Id: sucursalIdBigInt,
      TenantId: tenantId,
      EstaEliminado: false,
      EstaActiva: true,
    },
  });

  if (!sucursal) {
    throw createError.notFound("Sucursal no encontrada o inactiva");
  }

  // 2. Check if user has access to this branch
  // Find user's internal ID
  const usuario = await prisma.usuario.findUnique({
    where: { AuthUserId: authUserId },
    select: { Id: true, TenantId: true },
  });

  if (!usuario || usuario.TenantId !== tenantId) {
    throw createError.unauthorized(
      "Usuario no encontrado o conflicto de tenant"
    );
  }

  const access = await prisma.usuarioSucursal.findFirst({
    where: {
      UsuarioId: usuario.Id,
      SucursalId: sucursalIdBigInt,
      TenantId: tenantId,
    },
  });

  if (!access) {
    throw createError.forbidden("No tienes acceso a esta sucursal");
  }

  return { sucursal, usuarioId: usuario.Id };
}
