import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";

export async function GET(req: NextRequest) {
  const { tenantId } = await getAuthContext({ req });

  if (!tenantId) {
    return NextResponse.json(
      { error: "No se pudo determinar el tenant." },
      { status: 401 },
    );
  }

  try {
    const config = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      select: {
        Foto: true,
      },
      orderBy: {
        Id: "desc",
      },
    });

    return NextResponse.json({
      branding: {
        slogan: "Mejor precio, mejor servicio.", // Placeholder as per current hook behavior
        color: "#90c472", // Placeholder
        logoPreview: config?.Foto || "",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    permission: PERMISSIONS.CONFIGURACION,
  });

  if (!tenantId) {
    return NextResponse.json(
      { error: "No se pudo determinar el tenant." },
      { status: 401 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    const slogan = formData.get("slogan") as string | null;
    const color = formData.get("color") as string | null;

    let fotoUrl: string | null = null;

    if (file) {
      const supabase = getSupabaseServiceClient();
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${tenantId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

      // Upload to 'logos' bucket
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error("Error al subir la imagen a Supabase");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("logos").getPublicUrl(fileName);

      fotoUrl = publicUrl;
    }

    // Update Configuration in DB
    const config = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      orderBy: {
        Id: "desc",
      },
    });

    if (!config) {
      // If no config exists, we might need to create it, but usually it exists.
      // For now assume it exists or fail.
      throw new Error("Configuración no encontrada");
    }

    const updated = await prisma.configuracion.update({
      where: { Id: config.Id },
      data: {
        Foto: fotoUrl || undefined, // Only update if we have a new URL
        ShowFoto: fotoUrl ? true : undefined,
      },
      select: {
        Foto: true,
      },
    });

    return NextResponse.json({
      branding: {
        slogan: slogan || "Mejor precio, mejor servicio.",
        color: color || "#90c472",
        logoPreview: updated.Foto || "",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
