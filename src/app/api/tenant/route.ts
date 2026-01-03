import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { handleError } from "@/lib/errors/handler";

const updateTenantSchema = z.object({
  nombre: z.string().min(1).optional(),
  dominio: z.string().optional().nullable(),
});

function tenantNotFound() {
  return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
}

async function resolveTenantId() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Buscar tenantId en diferentes lugares del metadata
  const metadata = user.app_metadata || {};
  const tenantId = 
    metadata.tenantId || 
    metadata.tenant_id || 
    (user as any).tenantId;

  if (tenantId) {
    return Number(tenantId);
  }

  // Si no está en metadata, buscar en la base de datos
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { AuthUserId: user.id, EstaEliminado: false },
      select: { TenantId: true },
    });

    if (usuario?.TenantId) {
      return Number(usuario.TenantId);
    }
  } catch (error) {
    console.error("Error buscando tenantId en DB:", error);
  }

  return null;
}

export async function GET() {
  const tenantId = await resolveTenantId();
  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { Id: tenantId },
      select: {
        Id: true,
        Nombre: true,
        Dominio: true,
      },
    });

    if (!tenant) {
      return tenantNotFound();
    }

    return NextResponse.json(
      {
        tenant: {
          id: Number(tenant.Id),
          nombre: tenant.Nombre,
          dominio: tenant.Dominio ?? "",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  const tenantId = await resolveTenantId();
  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = updateTenantSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const data = parsed.data;

  const updateData = {
    ...(data.nombre !== undefined ? { Nombre: data.nombre } : {}),
    ...(data.dominio !== undefined ? { Dominio: data.dominio || null } : {}),
  };

  try {
    const tenant = await prisma.tenant.update({
      where: { Id: tenantId },
      data: updateData,
      select: {
        Id: true,
        Nombre: true,
        Dominio: true,
      },
    });

    return NextResponse.json(
      {
        tenant: {
          id: Number(tenant.Id),
          nombre: tenant.Nombre,
          dominio: tenant.Dominio ?? "",
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.toLowerCase().includes("record to update")
    ) {
      return tenantNotFound();
    }
    
    return handleError(err);
  }
}
