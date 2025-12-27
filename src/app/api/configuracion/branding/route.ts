import { NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { handleError } from "@/lib/errors/handler";
import { fileToBuffer } from "@/utilities/fotoDefault";

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
        Id: "desc",
      },
    });

    let logoPreview = "";
    if (config?.Foto && config.ShowFoto) {
      // Convertir Bytes a base64
      logoPreview = `data:image/png;base64,${Buffer.from(config.Foto).toString(
        "base64"
      )}`;
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
          Id: "desc",
        },
      });

      if (!config) {
        throw new Error("No se encontró una configuración existente");
      }

      const fotoBytes = await fileToBuffer(logoFile);

      // Actualizar configuración existente dentro de la transacción
      await tx.configuracion.update({
        where: { Id: config.Id },
        data: {
          Foto: fotoBytes as Uint8Array<ArrayBuffer> | null,
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
    return handleError(error);
  }
}
