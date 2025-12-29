import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

const preferenciasSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  resumenDiario: z.boolean().optional(),
  stockBajo: z.boolean().optional(),
});

async function resolveTenantId() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenantId = user?.app_metadata?.tenantId;
  return tenantId ? Number(tenantId) : null;
}

// Por ahora guardamos en una tabla JSON o en Tenant
// Como no hay tabla específica, usaremos Tenant para almacenar preferencias
// En el futuro se puede crear una tabla TenantPreferencias

export async function GET() {
  const tenantId = await resolveTenantId();
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
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error en GET /api/configuracion/preferencias:", error);
    return NextResponse.json(
      { error: "Error al cargar las preferencias" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const tenantId = await resolveTenantId();
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
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error actualizando preferencias", error);
    return NextResponse.json(
      { error: "No se pudieron actualizar las preferencias" },
      { status: 500 }
    );
  }
}




