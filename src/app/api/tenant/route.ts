import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";

const updateTenantSchema = z.object({
  nombre: z.string().min(1).optional(),
  dominio: z.string().optional().nullable(),
});

function tenantNotFound() {
  return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
}

/**
 * El tenant sale de la sesión (getAuthContext: app_metadata + usuario no
 * bloqueado). Leer el nombre lo puede cualquier usuario; cambiarlo requiere
 * "Modificar configuración" (antes lo podía cambiar cualquier empleado).
 */
async function resolveTenantId(req: NextRequest | null, escribir: boolean) {
  const { tenantId } = await getAuthContext({
    ...(req ? { req } : {}),
    ...(escribir ? { permission: SET_PERMISSIONS.CONFIGURACION } : {}),
  });
  return tenantId;
}

export async function GET() {
  try {
    const tenantId = await resolveTenantId(null, false);
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
  let tenantId: number;
  try {
    tenantId = await resolveTenantId(req, true);
  } catch (error) {
    return handleError(error);
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
