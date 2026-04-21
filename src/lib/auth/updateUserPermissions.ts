import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import prisma from "@/DB/prisma";
import { PerfilTipo } from "../../../prisma/generated/prisma";

/**
 * Calcula los permisos de un usuario desde la base de datos
 */
export async function calcularPermisosUsuario(authUserId: string): Promise<{
  permisos: string[];
  isSuperAdmin: boolean;
  isAdministrador: boolean;
  roles: Array<{ id: number; nombre: string; tipo: string }>;
}> {
  const usuario = await prisma.usuario.findFirst({
    where: { AuthUserId: authUserId, EstaEliminado: false },
    select: {
      Id: true,
      TenantId: true,
      PerfilUsuario: {
        select: {
          Perfiles: {
            select: {
              Id: true,
              Descripcion: true,
              Tipo: true,
              PerfilPermiso: {
                select: {
                  Permiso: {
                    select: { Clave: true, EstaEliminado: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!usuario || !usuario.TenantId) {
    return {
      permisos: [],
      isSuperAdmin: false,
      isAdministrador: false,
      roles: [],
    };
  }

  const isSuperAdmin = usuario.PerfilUsuario.some(
    (pu) => pu.Perfiles.Tipo === PerfilTipo.SUPERADMIN,
  );

  const isAdministrador =
    !isSuperAdmin &&
    usuario.PerfilUsuario.some(
      (pu) => pu.Perfiles.Tipo === PerfilTipo.ADMINISTRADOR,
    );

  const permisos = usuario.PerfilUsuario.flatMap((pu) =>
    pu.Perfiles.PerfilPermiso.filter((pp) => !pp.Permiso?.EstaEliminado).map(
      (pp) => {
        const clave = pp.Permiso?.Clave ?? "";
        // Normalizar formato con guión → formato con dos puntos
        // Ej: "ventas-page" → "ventas:page" (datos legacy en la DB)
        return clave.replace(/-(page|get|set)$/, ":$1");
      },
    ),
  ).filter((c) => c);

  const roles = usuario.PerfilUsuario.map((pu) => ({
    id: Number(pu.Perfiles.Id),
    nombre: pu.Perfiles.Descripcion || "",
    tipo: pu.Perfiles.Tipo ?? "EMPLEADO",
  }));

  return {
    permisos: Array.from(new Set(permisos)), // Eliminar duplicados
    isSuperAdmin,
    isAdministrador,
    roles,
  };
}

/**
 * Actualiza los permisos del usuario en el JWT (app_metadata de Supabase)
 * Esta función debe llamarse:
 * - Al hacer login
 * - Cuando se cambian roles/permisos de un usuario
 * - Cuando se actualiza un rol que tiene usuarios asignados
 */
export async function actualizarPermisosEnJWT(
  authUserId: string,
): Promise<void> {
  try {
    const { permisos, isSuperAdmin, isAdministrador, roles } =
      await calcularPermisosUsuario(authUserId);

    // Obtener el usuario actual para preservar otros metadatos
    const { data: currentUser } =
      await getSupabaseServiceClient().auth.admin.getUserById(authUserId);
    const currentMetadata = currentUser?.user?.app_metadata || {};

    // Actualizar app_metadata con permisos y versión
    const newMetadata = {
      ...currentMetadata,
      permissions: permisos,
      isSuperAdmin,
      isAdministrador,
      roles: roles.map((r) => ({ id: r.id, nombre: r.nombre, tipo: r.tipo })),
      permissionsVersion: Date.now(), // Timestamp para invalidar cache
    };

    const { error } =
      await getSupabaseServiceClient().auth.admin.updateUserById(authUserId, {
        app_metadata: newMetadata,
      });

    if (error) {
      console.error(
        `Error actualizando permisos para usuario ${authUserId}:`,
        error,
      );
      throw error;
    }
  } catch (error) {
    console.error("Error en actualizarPermisosEnJWT:", error);
    throw error;
  }
}

/**
 * Actualiza permisos de todos los usuarios afectados cuando se modifica un rol
 * Útil cuando se edita/elimina un rol o se cambian sus permisos
 */
export async function actualizarPermisosUsuariosDelRol(
  rolId: bigint,
  tenantId: bigint,
): Promise<void> {
  try {
    // Obtener todos los usuarios que tienen este rol
    const usuariosConRol = await prisma.perfilUsuario.findMany({
      where: {
        Perfil_Id: rolId,
        TenantId: tenantId,
      },
      select: {
        Usuario: {
          select: {
            AuthUserId: true,
          },
        },
      },
    });

    // Actualizar permisos de cada usuario
    const updatePromises = usuariosConRol
      .map((pu) => pu.Usuario.AuthUserId)
      .filter((authUserId): authUserId is string => !!authUserId)
      .map((authUserId) => actualizarPermisosEnJWT(authUserId));

    await Promise.allSettled(updatePromises);
  } catch (error) {
    console.error("Error actualizando permisos de usuarios del rol:", error);
    throw error;
  }
}
