import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { calcularPermisosUsuario, actualizarPermisosEnJWT } from "@/lib/auth/updateUserPermissions";

type PermisoResult = {
  tenantId: number;
  usuarioId: number;
  permisos: string[];
};

export class PermisoError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Obtiene permisos del usuario desde JWT (rápido) o DB (fallback)
 * Prioriza JWT para evitar queries innecesarias
 */
export async function requirePermiso(
  clavePermiso: string
): Promise<PermisoResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new PermisoError("No autenticado", 401);
  }

  // Obtener tenantId del usuario (necesario para retornar)
  const usuario = await prisma.usuario.findFirst({
    where: { AuthUserId: user.id, EstaEliminado: false },
    select: {
      Id: true,
      TenantId: true,
    },
  });

  if (!usuario || !usuario.TenantId) {
    throw new PermisoError("Usuario no encontrado en el tenant", 401);
  }

  const tenantId = Number(usuario.TenantId);
  const usuarioId = Number(usuario.Id);

  // Intentar leer permisos del JWT (app_metadata)
  const metadata = user.app_metadata || {};
  const permisosJWT = (metadata.permissions as string[]) || [];
  const isSuperAdminJWT = metadata.isSuperAdmin === true;

  // Si tiene permisos en JWT, usarlos (rápido, sin DB)
  if (permisosJWT.length > 0 || isSuperAdminJWT) {
    if (isSuperAdminJWT) {
      return {
        tenantId,
        usuarioId,
        permisos: ["*"], // SuperAdmin tiene acceso completo
      };
    }

    const tienePermiso = permisosJWT.includes(clavePermiso);
    if (!tienePermiso) {
      throw new PermisoError("Sin permisos", 403);
    }

    return {
      tenantId,
      usuarioId,
      permisos: permisosJWT,
    };
  }

  // Fallback: Si no hay permisos en JWT, calcular desde DB
  // Esto puede pasar si el usuario es antiguo o si hubo un error
  // También actualizamos el JWT para futuras requests
  try {
    const { permisos, isSuperAdmin } = await calcularPermisosUsuario(user.id);

    // Actualizar JWT para futuras requests (no bloqueamos si falla)
    actualizarPermisosEnJWT(user.id).catch((err) => {
      console.warn("No se pudo actualizar permisos en JWT:", err);
    });

    if (isSuperAdmin) {
      return {
        tenantId,
        usuarioId,
        permisos: ["*"],
      };
    }

    const tienePermiso = permisos.includes(clavePermiso);
    if (!tienePermiso) {
      throw new PermisoError("Sin permisos", 403);
    }

    return {
      tenantId,
      usuarioId,
      permisos,
    };
  } catch (error) {
    if (error instanceof PermisoError) {
      throw error;
    }
    console.error("Error calculando permisos:", error);
    throw new PermisoError("Error verificando permisos", 500);
  }
}
