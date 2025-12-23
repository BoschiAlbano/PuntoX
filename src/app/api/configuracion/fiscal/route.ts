import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

const fiscalSchema = z.object({
  moneda: z.string().optional(),
  zonaHoraria: z.string().optional(),
  idioma: z.string().optional(),
  tipoIva: z.string().optional(),
  puntoVenta: z.string().optional(),
  inicioActividades: z.string().optional(),
});

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
    // Por ahora retornamos valores por defecto
    // Algunos campos como puntoVenta podrían estar en Configuracion
    return NextResponse.json(
      {
        fiscal: {
          moneda: "ARS",
          zonaHoraria: "America/Argentina/Buenos_Aires",
          idioma: "es-AR",
          tipoIva: "Responsable Inscripto",
          puntoVenta: "0001",
          inicioActividades: "",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error en GET /api/configuracion/fiscal:", error);
    return NextResponse.json(
      { error: "Error al cargar la configuración fiscal" },
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
  const parsed = fiscalSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  try {
    // Por ahora solo retornamos éxito
    // En el futuro se puede guardar en Tenant o Configuracion
    return NextResponse.json(
      {
        fiscal: parsed.data,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error actualizando fiscal", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la configuración fiscal" },
      { status: 500 }
    );
  }
}




