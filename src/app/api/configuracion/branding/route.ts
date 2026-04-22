import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import {
  PERMISSIONS,
  SET_PERMISSIONS,
  GET_PERMISSIONS,
} from "@/lib/constants/comprobantes";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";

export async function GET(req: NextRequest) {
  const { tenantId } = await getAuthContext({
    req,
    permission: GET_PERMISSIONS.CONFIGURACION,
  });

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
    permission: SET_PERMISSIONS.CONFIGURACION,
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

    // 1. Obtener la configuración actual PRIMERO para saber si hay un logo viejo
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
      throw new Error("Configuración no encontrada");
    }

    let fotoUrl: string | null = null;

    if (file) {
      const supabase = getSupabaseServiceClient();

      // 2. Si existe un logo anterior, eliminarlo de Supabase Storage
      if (config.Foto) {
        try {
          // Extraemos la ruta del archivo viejo
          // Ejemplo de URL: https://xxx.supabase.co/storage/v1/object/public/logos/1/123-logo.png
          const urlParts = config.Foto.split("/logos/");
          if (urlParts.length > 1) {
            const oldFilePath = urlParts[1]; // ej: "1/123-logo.png"
            const { error: removeError } = await supabase.storage
              .from("logos")
              .remove([oldFilePath]);
              
            if (removeError) {
              console.warn("Supabase remove error (old logo):", removeError);
            } else {
              console.log("Logo antiguo eliminado exitosamente:", oldFilePath);
            }
          }
        } catch (e) {
          console.warn("Error al intentar eliminar logo viejo:", e);
        }
      }

      // 3. Subir el nuevo logo
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${tenantId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

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

    // 4. Actualizar la Base de Datos
    const updated = await prisma.configuracion.update({
      where: { Id: config.Id },
      data: {
        Foto: fotoUrl || undefined, // Solo actualiza si hay URL nueva
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
