import { getAuthContext } from "@/lib/auth/getAuthUser";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";
import {
  guardarEnCacheSiCorresponde,
  eliminarDeCache,
} from "@/lib/services/imagenProductoCache";
import { ImagenCacheFuente } from "../../../../../../prisma/generated/prisma";

/**
 * PATCH /api/admin/imagenes-cache/[id]
 * Reemplaza la imagen de una entrada del caché (solo SUPERADMIN).
 * Body: { imageBase64: string, descripcion?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isSuperAdmin, usuarioId } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const entrada = await prisma.imagenProductoCache.findUnique({
      where: { Id: BigInt(id) },
    });
    if (!entrada) {
      throw createError.notFound("Entrada de caché no encontrada");
    }

    const body = await req.json();
    const imageBase64: unknown = body?.imageBase64;
    if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
      throw createError.validation("Falta la imagen (imageBase64)");
    }

    const b64Data = imageBase64.includes("base64,")
      ? imageBase64.split("base64,")[1]
      : imageBase64;
    const buffer = Buffer.from(b64Data, "base64");

    await guardarEnCacheSiCorresponde({
      codigoBarra: entrada.CodigoBarra,
      codigoBarraGenerado: false,
      descripcion:
        typeof body?.descripcion === "string" ? body.descripcion : entrada.Descripcion,
      imageBuffer: buffer,
      fuente: ImagenCacheFuente.USUARIO,
      isSuperAdmin: true,
      userId: BigInt(usuarioId),
    });

    const actualizado = await prisma.imagenProductoCache.findUnique({
      where: { Id: BigInt(id) },
    });

    return NextResponse.json({ success: true, entrada: actualizado });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/admin/imagenes-cache/[id]
 * Elimina una entrada del caché (solo SUPERADMIN).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    await eliminarDeCache(BigInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
