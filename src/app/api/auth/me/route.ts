import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import prisma from "@/DB/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch Prisma user with all necessary relations
    const dbUser = await prisma.usuario.findUnique({
      where: { AuthUserId: supabaseUser.id },
      include: {
        Tenant: true,
        Sucursales: {
          where: {
            Sucursal: {
              EstaEliminado: false,
            },
          },
          include: {
            Sucursal: true,
          },
        },
        PerfilUsuario: {
          include: {
            Perfiles: {
              include: {
                PerfilPermiso: {
                  include: {
                    Permiso: true,
                  },
                },
              },
            },
          },
        },
        Persona_Empleado: {
          select: {
            Persona: {
              select: {
                Nombre: true,
                Apellido: true,
                Mail: true,
              },
            },
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract basic user info
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Password, ...userSafe } = dbUser as any;

    const usuarioDTO: UserDto = {
      Id: userSafe.Id,
      Nombre: userSafe.Persona_Empleado.Persona.Nombre,
      Apellido: userSafe.Persona_Empleado.Persona.Apellido,
      Email: userSafe.Persona_Empleado.Persona.Mail,
      Usuario: userSafe.Nombre,
    };

    // Extract branches
    const branches = dbUser.Sucursales.map((us) => ({
      ...us.Sucursal,
      esDefault: us.EsDefault,
    }));

    // Determine default branch (or first available if none default)
    const currentBranch =
      branches.find((b) => b.esDefault) || branches[0] || null;

    // Extract permissions (keys) from all profiles
    const permissionsSet = new Set<string>();
    dbUser.PerfilUsuario.forEach((pu) => {
      pu.Perfiles.PerfilPermiso.forEach((pp) => {
        if (pp.Permiso && !pp.Permiso.EstaEliminado && pp.Permiso.Clave) {
          permissionsSet.add(pp.Permiso.Clave);
        }
      });
    });

    // Also include roles
    const roles = dbUser.PerfilUsuario.map((pu) => pu.Perfiles);

    const isSuperAdmin = roles.some((r) => r.Tipo === "SUPERADMIN");
    const isAdministrador =
      !isSuperAdmin && roles.some((r) => r.Tipo === "ADMINISTRADOR");

    const permissions = Array.from(permissionsSet);

    return NextResponse.json({
      user: usuarioDTO,
      tenant: dbUser.Tenant,
      branches,
      currentBranch,
      permissions,
      roles,
      isSuperAdmin,
      isAdministrador,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

interface UserDto {
  Id: string;
  Nombre: string;
  Apellido: string;
  Email: string;
  Usuario: string;
}
