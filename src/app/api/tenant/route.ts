import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { handleError } from "@/lib/errors/handler";

const updateTenantSchema = z.object({
  nombre: z.string().min(1).optional(),
  razonSocial: z.string().optional(),
  dominio: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  cuit: z.string().optional().nullable(),
});

function tenantNotFound() {
  return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
}

async function resolveTenantId() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenantId = user?.app_metadata?.tenantId;
  return tenantId ? Number(tenantId) : null;
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
        RazonSocial: true,
        Dominio: true,
        Email: true,
        Telefono: true,
        Cuit: true,
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
          razonSocial: tenant.RazonSocial ?? "",
          dominio: tenant.Dominio ?? "",
          email: tenant.Email ?? "",
          telefono: tenant.Telefono ?? "",
          cuit: tenant.Cuit ?? "",
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
    ...(data.razonSocial !== undefined
      ? { RazonSocial: data.razonSocial }
      : {}),
    ...(data.dominio !== undefined ? { Dominio: data.dominio || null } : {}),
    ...(data.email !== undefined ? { Email: data.email || null } : {}),
    ...(data.telefono !== undefined ? { Telefono: data.telefono || null } : {}),
    ...(data.cuit !== undefined ? { Cuit: data.cuit || null } : {}),
  };

  try {
    const tenant = await prisma.tenant.update({
      where: { Id: tenantId },
      data: updateData,
      select: {
        Id: true,
        Nombre: true,
        RazonSocial: true,
        Dominio: true,
        Email: true,
        Telefono: true,
        Cuit: true,
      },
    });

    return NextResponse.json(
      {
        tenant: {
          id: Number(tenant.Id),
          nombre: tenant.Nombre,
          razonSocial: tenant.RazonSocial ?? "",
          dominio: tenant.Dominio ?? "",
          email: tenant.Email ?? "",
          telefono: tenant.Telefono ?? "",
          cuit: tenant.Cuit ?? "",
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
