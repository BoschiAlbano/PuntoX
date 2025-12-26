import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

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

  // Buscar usuario interno por AuthUserId y traer roles/permisos.
  const usuario = await prisma.usuario.findFirst({
    where: { AuthUserId: user.id, EstaEliminado: false },
    select: {
      Id: true,
      TenantId: true,
      PerfilUsuario: {
        select: {
          Perfiles: {
            select: {
              Id: true,
              Tipo: true,
              Descripcion: true,
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
    throw new PermisoError("Usuario no encontrado en el tenant", 401);
  }

  const tenantId = usuario.TenantId;
  
  // Verificar si es SuperAdmin - tiene acceso completo sin verificar permisos
  const esSuperAdmin = usuario.PerfilUsuario.some(
    (pu) => {
      const descripcion = pu.Perfiles.Descripcion?.trim() || "";
      return descripcion === "SuperAdmin" || descripcion.toLowerCase() === "superadmin";
    }
  );
  
  // SuperAdmin tiene acceso a todo, no necesita verificar permisos específicos
  if (esSuperAdmin) {
    return {
      tenantId: Number(tenantId),
      usuarioId: Number(usuario.Id),
      permisos: ["*"], // Indica acceso completo
    };
  }

  const permisos = usuario.PerfilUsuario.flatMap((pu) =>
    pu.Perfiles.PerfilPermiso.filter((pp) => !pp.Permiso?.EstaEliminado).map(
      (pp) => pp.Permiso?.Clave ?? ""
    )
  ).filter((c) => c);

  const tienePermiso = permisos.some((p) => p === clavePermiso);

  // Opción B: Solo SuperAdmin tiene bypass automático
  // Administradores y Empleados necesitan permisos explícitos asignados
  // (Removida la auto-asignación de permisos a administradores)
  
  if (!tienePermiso) {
    throw new PermisoError("Sin permisos", 403);
  }

  return {
    tenantId: Number(tenantId),
    usuarioId: Number(usuario.Id),
    permisos,
  };
}
