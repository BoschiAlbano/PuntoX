import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

const payloadSchema = z.object({
  razonSocial: z.string().min(1, "Razon social requerida"),
  nombreFantasia: z.string().optional(),
  cuit: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional(),
  observacionPieFactura: z.string().optional().nullable(),
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
    const config = await prisma.configuracion.findFirst({
      where: { TenantId: tenantId },
      select: {
        Id: true,
        RazonSocial: true,
        NombreFantasia: true,
        Cuit: true,
        Email: true,
        Telefono: true,
        Direccion: true,
        ObservacionEnPieFactura: true,
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuracion no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        configuracion: {
          id: Number(config.Id),
          razonSocial: config.RazonSocial ?? "",
          nombreFantasia: config.NombreFantasia ?? "",
          cuit: config.Cuit ?? "",
          email: config.Email ?? "",
          telefono: config.Telefono ?? "",
          direccion: config.Direccion ?? "",
          observacionPieFactura: config.ObservacionEnPieFactura ?? "",
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en GET /api/configuracion:", error);
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
      { error: "Error al cargar la configuración" },
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
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const config = await prisma.configuracion.findFirst({
      where: { TenantId: tenantId },
      select: { Id: true },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuracion no encontrada" },
        { status: 404 }
      );
    }
    const updated = await prisma.configuracion.update({
      where: { Id: config.Id, TenantId: tenantId },
      data: {
        RazonSocial: data.razonSocial,
        NombreFantasia: data.nombreFantasia ?? undefined,
        Cuit: data.cuit ?? undefined,
        Email: data.email ?? undefined,
        Telefono: data.telefono ?? undefined,
        Direccion: data.direccion ?? undefined,
        ObservacionEnPieFactura: data.observacionPieFactura ?? undefined,
      },
      select: {
        Id: true,
        RazonSocial: true,
        NombreFantasia: true,
        Cuit: true,
        Email: true,
        Telefono: true,
        Direccion: true,
        ObservacionEnPieFactura: true,
      },
    });

    return NextResponse.json(
      {
        configuracion: {
          id: Number(updated.Id),
          razonSocial: updated.RazonSocial ?? "",
          nombreFantasia: updated.NombreFantasia ?? "",
          cuit: updated.Cuit ?? "",
          email: updated.Email ?? "",
          telefono: updated.Telefono ?? "",
          direccion: updated.Direccion ?? "",
          observacionPieFactura: updated.ObservacionEnPieFactura ?? "",
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error actualizando configuracion", error);
    
    // Detectar errores reales de conexión a la base de datos
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
    
    return NextResponse.json(
      { error: "No se pudo actualizar la configuracion" },
      { status: 500 }
    );
  }
}
