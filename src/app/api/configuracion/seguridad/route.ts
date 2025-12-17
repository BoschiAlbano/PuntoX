import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

const seguridadSchema = z.object({
  dobleFactor: z.boolean().optional(),
  alertarNuevoDispositivo: z.boolean().optional(),
  bloquearPorInactividad: z.boolean().optional(),
  bloquearTrasIntentos: z.enum(["nunca", "5", "10"]).optional(),
  recordarSesion30Dias: z.boolean().optional(),
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
    // En el futuro se puede crear una tabla TenantSeguridad
    return NextResponse.json(
      {
        seguridad: {
          dobleFactor: false,
          alertarNuevoDispositivo: true,
          bloquearPorInactividad: true,
          bloquearTrasIntentos: "5",
          recordarSesion30Dias: true,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en GET /api/configuracion/seguridad:", error);
    return NextResponse.json(
      { error: "Error al cargar la configuración de seguridad" },
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
  const parsed = seguridadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  try {
    // Por ahora solo retornamos éxito
    // En el futuro se puede guardar en una tabla TenantSeguridad
    return NextResponse.json(
      {
        seguridad: parsed.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error actualizando seguridad", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la configuración de seguridad" },
      { status: 500 }
    );
  }
}


