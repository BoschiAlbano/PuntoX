import { NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

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
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      select: {
        Foto: true,
        ShowFoto: true,
      },
      orderBy: {
        Id: 'desc',
      },
    });

    let logoPreview = "";
    if (config?.Foto && config.ShowFoto) {
      // Convertir Bytes a base64
      logoPreview = `data:image/png;base64,${Buffer.from(config.Foto).toString('base64')}`;
    }

    return NextResponse.json(
      {
        branding: {
          slogan: "",
          color: "#90c472",
          logoPreview: logoPreview,
          tieneLogo: config?.ShowFoto || false,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error en GET /api/configuracion/branding:", error);
    return NextResponse.json(
      { error: "Error al cargar el branding" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const slogan = formData.get("slogan") as string;
    const color = formData.get("color") as string;
    const logoFile = formData.get("logo") as File | null;

    // Usar transacción para asegurar atomicidad
    const result = await prisma.$transaction(async (tx) => {
      // Buscar configuración existente
      const config = await tx.configuracion.findFirst({
        where: {
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
        },
        orderBy: {
          Id: 'desc',
        },
      });

      if (!config) {
        throw new Error("No se encontró una configuración existente");
      }

      let fotoBytes: Buffer | null = null;
      if (logoFile && logoFile.size > 0) {
        const arrayBuffer = await logoFile.arrayBuffer();
        fotoBytes = Buffer.from(arrayBuffer);
      }

      // Actualizar configuración existente dentro de la transacción
      await tx.configuracion.update({
        where: { Id: config.Id },
        data: {
          Foto: fotoBytes !== null ? fotoBytes : undefined,
          ShowFoto: fotoBytes !== null,
        },
      });

      return {
        slogan: slogan || "",
        color: color || "#90c472",
        tieneLogo: fotoBytes !== null,
      };
    });

    return NextResponse.json(
      {
        branding: result,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error actualizando branding", error);
    
    // Detectar errores de conexión
    const isConnectionError =
      error?.code === "P1001" ||
      error?.code === "P1002" ||
      error?.code === "P1003" ||
      error?.message?.toLowerCase().includes("can't reach database server") ||
      error?.message?.toLowerCase().includes("connection timeout") ||
      error?.message?.toLowerCase().includes("connection refused");

    if (isConnectionError) {
      return NextResponse.json(
        {
          error: "Error de conexión a la base de datos. Verifica tu conexión.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "No se pudo actualizar el branding" },
      { status: 500 }
    );
  }
}

