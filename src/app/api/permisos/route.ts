import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

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
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 }
      );
    }

    const permisos = usuario.PerfilUsuario.flatMap((pu) =>
      pu.Perfiles.PerfilPermiso.filter((pp) => !pp.Permiso?.EstaEliminado).map(
        (pp) => pp.Permiso?.Clave ?? ""
      )
    ).filter((c) => c);

    const roles = usuario.PerfilUsuario.map((pu) => ({
      id: Number(pu.Perfiles.Id),
      nombre: pu.Perfiles.Descripcion,
      tipo: pu.Perfiles.Tipo ?? "EMPLEADO",
    }));

    return NextResponse.json(
      {
        usuarioId: Number(usuario.Id),
        tenantId: Number(usuario.TenantId),
        permisos,
        roles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error obteniendo permisos", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los permisos" },
      { status: 500 }
    );
  }
}
