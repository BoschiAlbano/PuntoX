export interface OptimizedImage {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Redimensiona (sin recortar ni agrandar) y convierte a WebP. Lanza si el
 * buffer no es una imagen válida — el caller debe responder 400 en ese caso.
 *
 * `sharp` se importa de forma lazy dentro de la función (no a nivel de módulo)
 * para que las rutas que solo importan este helper no fallen en producción si
 * el binario nativo no está disponible para la plataforma (ej: Vercel/Linux).
 */
export async function optimizeImageToWebp(
  input: Buffer,
  { maxWidth = 1024, maxHeight = 1024, quality = 80 }: OptimizeImageOptions = {},
): Promise<OptimizedImage> {
  const sharp = (await import("sharp")).default;
  const buffer = await sharp(input)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();

  return { buffer, contentType: "image/webp", extension: "webp" };
}
