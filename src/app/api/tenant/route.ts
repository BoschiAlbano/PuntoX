import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

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
  const tenantId = user?.user_metadata?.tenantId;
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
  } catch (error: any) {
    console.error("Error en GET /api/tenant:", error);
    // Detectar errores reales de conexión a la base de datos
    // Solo retornar 503 para errores de conexión específicos de Prisma
    const isConnectionError =
      error?.code === "P1001" || // Can't reach database server
      error?.code === "P1002" || // Database timeout
      error?.code === "P1003" || // Database does not exist
      error?.message?.toLowerCase().includes("can't reach database server") ||
      error?.message?.toLowerCase().includes("connection timeout") ||
      error?.message?.toLowerCase().includes("connection refused") ||
      error?.message?.toLowerCase().includes("econnrefused") ||
      error?.message?.toLowerCase().includes("etimedout");

    if (isConnectionError) {
      return NextResponse.json(
        {
          error: "Error de conexión a la base de datos. Verifica tu conexión.",
        },
        { status: 503 }
      );
    }
    
    // Para otros errores, retornar 500 (error interno del servidor)
    return NextResponse.json(
      { error: "Error al cargar el tenant" },
      { status: 500 }
    );
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
    ...(data.razonSocial !== undefined ? { RazonSocial: data.razonSocial } : {}),
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
  } catch (err: any) {
    if (
      err instanceof Error &&
      err.message.toLowerCase().includes("record to update")
    ) {
      return tenantNotFound();
    }
    
    console.error("Error actualizando tenant", err);
    
    // Detectar errores reales de conexión a la base de datos
    const isConnectionError =
      err?.code === "P1001" || // Can't reach database server
      err?.code === "P1002" || // Database timeout
      err?.code === "P1003" || // Database does not exist
      err?.message?.toLowerCase().includes("can't reach database server") ||
      err?.message?.toLowerCase().includes("connection timeout") ||
      err?.message?.toLowerCase().includes("connection refused") ||
      err?.message?.toLowerCase().includes("econnrefused") ||
      err?.message?.toLowerCase().includes("etimedout");

    if (isConnectionError) {
      return NextResponse.json(
        {
          error: "Error de conexión a la base de datos. Verifica tu conexión.",
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "No se pudo actualizar el tenant" },
      { status: 500 }
    );
  }
}
