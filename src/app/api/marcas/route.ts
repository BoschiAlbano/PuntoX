import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { TenantUser } from "@/types/auth";

function extractTenantId(user: TenantUser | null) {
  if (!user) return null;

  const fromDirect = user.tenantId;
  const meta = user.user_metadata ?? {};
  const appMeta = user.app_metadata ?? {};

  const fromMeta =
    (meta["tenant_id"] as string | number | null | undefined) ??
    (meta["tenantId"] as string | number | null | undefined);
  const fromApp = appMeta["tenant_id"] as
    | string
    | number
    | null
    | undefined;

  return (
    fromDirect ??
    fromMeta ??
    fromApp ??
    process.env.DEFAULT_TENANT_ID ??
    null
  );
}

async function getTenantFromAuth() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return extractTenantId(
    user
      ? {
          id: user.id,
          email: user.email ?? undefined,
          tenantId: undefined,
          role: null,
          user_metadata: (user.user_metadata ?? {}) as Record<string, unknown>,
          app_metadata: (user.app_metadata ?? {}) as Record<string, unknown>,
        }
      : null
  );
}

export async function GET(_req: NextRequest) {
  const tenantId = await getTenantFromAuth();

  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const marcas = await prisma.marca.findMany({
      where: {
        EstaEliminado: false,
        TenantId: Number(tenantId),
      },
      select: {
        Id: true,
        Descripcion: true,
      },
      orderBy: {
        Descripcion: "asc",
      },
    });

    return NextResponse.json(
      { marcas: marcas.map((marca) => ({ ...marca, Id: Number(marca.Id) })) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    return NextResponse.json(
      { error: "Error al obtener marcas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const tenantId = await getTenantFromAuth();

  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const tenantIdNumber = Number(tenantId);
    const marca = await prisma.marca.create({
      data: {
        ...body,
        TenantId: tenantIdNumber,
      },
    });

    return NextResponse.json(
      {
        ...marca,
        Id: Number(marca.Id),
        TenantId: tenantIdNumber,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al crear marca:", error);
    return NextResponse.json(null, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const tenantId = await getTenantFromAuth();

  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const idParam =
    req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
  const marcaId = idParam ? Number(idParam) : NaN;

  if (!Number.isInteger(marcaId)) {
    return NextResponse.json(
      { error: "Id de marca invalido" },
      { status: 400 }
    );
  }

  try {
    const marcaActualizada = await prisma.marca.update({
      where: {
        Id: marcaId,
        TenantId: Number(tenantId),
      },
      data: {
        EstaEliminado: true,
      },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(marcaActualizada.Id) },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 }
      );
    }

    console.error("Error al eliminar marca:", error);
    return NextResponse.json(
      { error: "Error al eliminar marca" },
      { status: 500 }
    );
  }
}
