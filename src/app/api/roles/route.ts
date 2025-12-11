import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { requirePermiso } from "@/lib/requirePermiso";

type RolTipo = "ADMINISTRADOR" | "EMPLEADO";

const rolSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional().nullable(),
  tipo: z.enum(["ADMINISTRADOR", "EMPLEADO"]).default("EMPLEADO"),
  permisos: z.array(z.string().min(1)).optional().default([]),
});

function normalizePermisoKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapRolTipo(tipo?: string | null): RolTipo {
  if (tipo === "ADMINISTRADOR" || tipo === "EMPLEADO") return tipo;
  return "EMPLEADO";
}

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("empleados:admin");

    const roles = await prisma.perfiles.findMany({
      where: { TenantId: BigInt(tenantId), EstaEliminado: false },
      select: {
        Id: true,
        Descripcion: true,
        Tipo: true,
        PerfilUsuario: { select: { Usuario_Id: true } },
        PerfilPermiso: {
          select: {
            Permiso: {
              select: { Clave: true, Descripcion: true, EstaEliminado: true },
            },
          },
        },
      },
      orderBy: { Descripcion: "asc" },
    });

    const response = roles.map((rol) => ({
      id: Number(rol.Id),
      nombre: rol.Descripcion,
      tipo: mapRolTipo((rol as any).Tipo as string | undefined),
      descripcion: null as string | null,
      usuarios: rol.PerfilUsuario.length,
      permisos: rol.PerfilPermiso.filter(
        (pp) => !pp.Permiso?.EstaEliminado
      ).map((pp) => pp.Permiso?.Descripcion ?? pp.Permiso?.Clave ?? ""),
    }));

    return NextResponse.json({ roles: response }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener roles", error);
    return NextResponse.json(
      { error: "Error al obtener roles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("empleados:admin");
    const json = await req.json().catch(() => null);
    const parsed = rolSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const data = parsed.data;
    // Si es rol administrador, nos aseguramos de incluir el permiso core de empleados.
    const permisosSolicitados = Array.from(
      new Set([
        ...(data.permisos ?? []),
        ...(data.tipo === "ADMINISTRADOR" ? ["empleados:admin"] : []),
      ])
    );

    const tenantIdBigInt = BigInt(tenantId);

    const existing = await prisma.perfiles.findFirst({
      where: {
        TenantId: tenantIdBigInt,
        Descripcion: data.nombre.trim(),
        EstaEliminado: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un rol con ese nombre" },
        { status: 400 }
      );
    }

    const permisosUnicos = Array.from(
      new Set(
        permisosSolicitados.map((p) => p.trim()).filter((p) => p.length > 0)
      )
    );

    const created = await prisma.$transaction(async (tx) => {
      const rol = await tx.perfiles.create({
        data: {
          Descripcion: data.nombre.trim(),
          Tipo: data.tipo,
          EstaEliminado: false,
          TenantId: tenantIdBigInt,
        },
      });

      let permisos = [] as {
        Id: bigint;
        Clave: string;
        Descripcion: string | null;
      }[];

      if (permisosUnicos.length) {
        permisos = await Promise.all(
          permisosUnicos.map((permisoLabel) => {
            const clave =
              normalizePermisoKey(permisoLabel) || permisoLabel.toLowerCase();
            return tx.permiso.upsert({
              where: {
                Clave_TenantId: { Clave: clave, TenantId: tenantIdBigInt },
              },
              update: { Descripcion: permisoLabel, EstaEliminado: false },
              create: {
                Clave: clave,
                Descripcion: permisoLabel,
                TenantId: tenantIdBigInt,
              },
            });
          })
        );

        await tx.perfilPermiso.createMany({
          data: permisos.map((permiso) => ({
            PerfilId: rol.Id,
            PermisoId: permiso.Id,
            TenantId: tenantIdBigInt,
          })),
          skipDuplicates: true,
        });
      }

      return { rol, permisos };
    });

    const rolResponse = {
      id: Number(created.rol.Id),
      nombre: created.rol.Descripcion,
      tipo: mapRolTipo((created.rol as any).Tipo as string | undefined),
      descripcion: data.descripcion ?? null,
      usuarios: 0,
      permisos: created.permisos.map((p) => p.Descripcion ?? p.Clave),
    };

    return NextResponse.json({ rol: rolResponse }, { status: 201 });
  } catch (error) {
    console.error("Error al crear rol", error);
    return NextResponse.json({ error: "Error al crear rol" }, { status: 500 });
  }
}
