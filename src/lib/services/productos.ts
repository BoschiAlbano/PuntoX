import prisma from "@/DB/prisma";
import { createError } from "@/lib/errors/types";

export type ArticuloFoto = {
  buffer: Buffer;
  contentType: "image/jpeg" | "image/png";
};

/**
 * Obtiene la foto de un producto como buffer listo para respuesta HTTP.
 * Sigue la estructura de la API de productos: validación de ID, auth por tenant, errores tipados.
 *
 * @returns { buffer, contentType } si hay foto válida (JPEG/PNG)
 * @throws createError.validation si el ID es inválido
 * @throws createError.notFound si no existe el producto, no hay foto, o el formato no es JPEG/PNG
 */
export async function getArticuloFoto(
  tenantId: string | number,
  id: string | number
): Promise<ArticuloFoto> {
  const idNum = Number(id);
  if (!id || isNaN(idNum)) {
    throw createError.validation("ID requerido");
  }

  const articulo = await prisma.articulo.findFirst({
    where: {
      Id: BigInt(idNum),
      TenantId: BigInt(tenantId),
    },
    select: { Foto: true },
  });

  if (!articulo) {
    throw createError.notFound("Producto no encontrado");
  }

  const foto = articulo.Foto;

  if (!foto || foto.length === 0) {
    throw createError.notFound("Foto no encontrada");
  }

  const buf = Buffer.isBuffer(foto) ? foto : Buffer.from(foto);

  // Detectar tipo por magic bytes: JPEG (FFD8), PNG (89504E47)
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng =
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47;

  if (!isJpeg && !isPng) {
    throw createError.notFound("Formato de imagen no soportado");
  }

  return {
    buffer: buf,
    contentType: isPng ? "image/png" : "image/jpeg",
  };
}
