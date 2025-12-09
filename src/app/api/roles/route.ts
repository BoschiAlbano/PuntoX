import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

// Helper para obtener tenant y permisos (SuperAdmin/Admin del tenant).
async function getAuthContext(req?: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { status: 401, message: "No autenticado" } } as const;
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const roleMeta = (meta?.role as string | undefined) ?? user.role ?? "";
  const roleLower = roleMeta.toString().toLowerCase();
  const isSuperAdmin = roleLower === "superadmin";
  const isAdmin = isSuperAdmin || roleLower === "administrador" || roleLower === "admin";

  const tenantFromQuery = req?.nextUrl.searchParams.get("tenantId");
  const tenantRaw = meta?.tenantId ?? meta?.tenant_id ?? (user as any)?.tenantId;
  const resolved = tenantFromQuery ?? tenantRaw ?? process.env.DEFAULT_TENANT_ID;
  if (!resolved) return { error: { status: 401, message: "Falta tenant" } } as const;

  const parsed = Number(resolved);
  if (Number.isNaN(parsed)) {
    return { error: { status: 400, message: "Tenant invalido" } } as const;
  }

  return { tenantId: parsed, isSuperAdmin, isAdmin } as const;
}

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
  }
  const { tenantId } = auth;

  try {
    let roles;
    try {
      roles = await prisma.perfiles.findMany({
        where: { TenantId: BigInt(tenantId), EstaEliminado: false },
        select: {
          Id: true,
          Descripcion: true,
          Tipo: true,
          _count: { select: { PerfilUsuario: true } },
        },
        orderBy: { Descripcion: "asc" },
      });
    } catch (err) {
      // Fallback si la columna Tipo no existe (migración pendiente).
      roles = await prisma.perfiles.findMany({
        where: { TenantId: BigInt(tenantId), EstaEliminado: false },
        select: {
          Id: true,
          Descripcion: true,
          _count: { select: { PerfilUsuario: true } },
        },
        orderBy: { Descripcion: "asc" },
      });
      console.warn("[roles] usando fallback sin campo Tipo (¿falta migración?)", err);
    }

    return NextResponse.json({
      roles: roles.map((rol: any) => ({
        id: Number(rol.Id),
        nombre: rol.Descripcion,
        tipo: rol.Tipo ?? "EMPLEADO",
        usuarios: rol._count?.PerfilUsuario ?? 0,
      })),
    });
  } catch (error) {
    console.error("Error al obtener roles", error);
    return NextResponse.json({ error: "Error al obtener roles" }, { status: 500 });
  }
}

const rolSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  tipo: z.enum(["ADMINISTRADOR", "EMPLEADO"]).default("EMPLEADO"),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
  }
  const { tenantId, isAdmin, isSuperAdmin } = auth;
  // SuperAdmin siempre puede crear roles; admins solo en su tenant.
  if (!isSuperAdmin && !isAdmin) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = rolSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  try {
    let created;
    try {
      created = await prisma.perfiles.create({
        data: {
          Descripcion: parsed.data.nombre.trim(),
          Tipo: parsed.data.tipo,
          EstaEliminado: false,
          TenantId: BigInt(tenantId),
        },
        select: { Id: true, Descripcion: true, Tipo: true },
      });
    } catch (err) {
      // Fallback si la columna Tipo no existe (migración pendiente).
      created = await prisma.perfiles.create({
        data: {
          Descripcion: parsed.data.nombre.trim(),
          EstaEliminado: false,
          TenantId: BigInt(tenantId),
        },
        select: { Id: true, Descripcion: true },
      });
      console.warn("[roles] creación sin campo Tipo (¿falta migración?)", err);
    }

    return NextResponse.json(
      {
        rol: {
          id: Number(created.Id),
          nombre: created.Descripcion,
          tipo: (created as any).Tipo ?? parsed.data.tipo ?? "EMPLEADO",
          usuarios: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando rol", error);
    return NextResponse.json(
      { error: "No se pudo crear el rol" },
      { status: 500 }
    );
  }
}
