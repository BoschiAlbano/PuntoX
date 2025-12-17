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

async function ensurePermisoParaAdmins(
  tenantId: bigint,
  clavePermiso: string,
  descripcion?: string
) {
  // Crea el permiso y lo asigna a todos los roles ADMINISTRADOR del tenant, si no existe.
  const permiso = await prisma.permiso.upsert({
    where: { Clave_TenantId: { Clave: clavePermiso, TenantId: tenantId } },
    update: { Descripcion: descripcion ?? clavePermiso, EstaEliminado: false },
    create: {
      Clave: clavePermiso,
      Descripcion: descripcion ?? clavePermiso,
      TenantId: tenantId,
    },
  });

  const rolesAdmin = await prisma.perfiles.findMany({
    where: {
      TenantId: tenantId,
      EstaEliminado: false,
      Tipo: "ADMINISTRADOR",
    },
    select: { Id: true },
  });

  if (rolesAdmin.length) {
    await prisma.perfilPermiso.createMany({
      data: rolesAdmin.map((rol) => ({
        PerfilId: rol.Id,
        PermisoId: permiso.Id,
        TenantId: tenantId,
      })),
      skipDuplicates: true,
    });
  }
}

export async function requirePermiso(
  clavePermiso: string,
  opts?: { descripcionPermiso?: string }
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
  const permisos = usuario.PerfilUsuario.flatMap((pu) =>
    pu.Perfiles.PerfilPermiso.filter((pp) => !pp.Permiso?.EstaEliminado).map(
      (pp) => pp.Permiso?.Clave ?? ""
    )
  ).filter((c) => c);

  const tienePermiso = permisos.some((p) => p === clavePermiso);

  // Si no lo tiene pero es admin, intentar asignarlo automáticamente a los roles admin del tenant.
  const esAdmin = usuario.PerfilUsuario.some(
    (pu) => pu.Perfiles.Tipo === "ADMINISTRADOR"
  );
  if (!tienePermiso && esAdmin) {
    await ensurePermisoParaAdmins(
      tenantId,
      clavePermiso,
      opts?.descripcionPermiso
    );
    // Re-evaluar permisos después de asignar.
    const refreshed = await prisma.perfilPermiso.findFirst({
      where: {
        Perfil: {
          TenantId: tenantId,
          PerfilUsuario: { some: { Usuario_Id: usuario.Id } },
        },
        Permiso: { Clave: clavePermiso, EstaEliminado: false },
      },
    });
    if (refreshed) {
      permisos.push(clavePermiso);
    }
  }

  if (!permisos.includes(clavePermiso)) {
    throw new PermisoError("Sin permisos", 403);
  }

  return {
    tenantId: Number(tenantId),
    usuarioId: Number(usuario.Id),
    permisos,
  };
}
