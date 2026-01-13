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
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract basic user info
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Password, ...userSafe } = dbUser as any;

    // Extract branches
    const branches = dbUser.Sucursales.map((us) => ({
      ...us.Sucursal,
      esDefault: us.EsDefault,
    }));

    // Determine default branch (or first available if none default)
    let currentBranch =
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

    const permissions = Array.from(permissionsSet);

    // Helper to handle BigInt serialization
    const serialize = (data: any): any => {
      return JSON.parse(
        JSON.stringify(data, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );
    };

    return NextResponse.json(
      serialize({
        user: userSafe,
        tenant: dbUser.Tenant,
        branches,
        currentBranch,
        permissions,
        roles,
      })
    );
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
