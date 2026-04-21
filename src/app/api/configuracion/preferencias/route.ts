import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";

const preferenciasSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  resumenDiario: z.boolean().optional(),
  stockBajo: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    permission: GET_PERMISSIONS.CONFIGURACION,
  });
  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    // Por ahora retornamos valores por defecto
    // En el futuro se puede crear una tabla TenantPreferencias
    return NextResponse.json(
      {
        preferencias: {
          email: true,
          push: true,
          resumenDiario: false,
          stockBajo: true,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    permission: SET_PERMISSIONS.CONFIGURACION,
  });
  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = preferenciasSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  try {
    // Por ahora solo retornamos éxito
    // En el futuro se puede guardar en una tabla TenantPreferencias
    return NextResponse.json(
      {
        preferencias: parsed.data,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
