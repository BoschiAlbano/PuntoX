import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { ImagenCacheFuente } from "../../../prisma/generated/prisma";

export const CACHE_BUCKET = "articulos-cache";

function sanitizeCodigoBarra(codigoBarra: string): string {
  return codigoBarra.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Extrae el path dentro del bucket a partir de una URL pública de Supabase Storage */
function extractStoragePath(url: string): string | null {
  const marker = `/${CACHE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function buscarCacheExacto(codigoBarra: string) {
  if (!codigoBarra) return null;
  return prisma.imagenProductoCache.findUnique({
    where: { CodigoBarra: codigoBarra },
  });
}

export async function buscarCacheTexto(texto: string, limit = 4) {
  if (!texto) return [];
  return prisma.imagenProductoCache.findMany({
    where: { Descripcion: { contains: texto, mode: "insensitive" } },
    take: limit,
    orderBy: { FechaCreacion: "desc" },
  });
}

export async function descargarImagenComoBuffer(
  url: string,
  timeoutMs = 8000,
): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

interface GuardarEnCacheParams {
  codigoBarra: string;
  codigoBarraGenerado: boolean;
  descripcion?: string | null;
  imageBuffer: Buffer;
  fuente: ImagenCacheFuente;
  isSuperAdmin: boolean;
  tenantId?: bigint | null;
  userId?: bigint | null;
}

/**
 * Puebla el caché compartido de imágenes, respetando las reglas de negocio:
 * - Nunca escribe si el código de barra es autogenerado (no es único entre tenants).
 * - Si no es SUPERADMIN, es write-once: no pisa una entrada que ya existe
 *   (best-effort, no atómico entre requests concurrentes de dos tenants distintos).
 * - Nunca lanza: un fallo acá no debe romper el guardado del producto en sí.
 */
export async function guardarEnCacheSiCorresponde(
  params: GuardarEnCacheParams,
): Promise<void> {
  const {
    codigoBarra,
    codigoBarraGenerado,
    descripcion,
    imageBuffer,
    fuente,
    isSuperAdmin,
    tenantId,
    userId,
  } = params;

  if (codigoBarraGenerado) return;
  if (!codigoBarra || !imageBuffer || imageBuffer.length === 0) return;

  try {
    const existente = await prisma.imagenProductoCache.findUnique({
      where: { CodigoBarra: codigoBarra },
    });

    if (existente && !isSuperAdmin) return; // write-once para no-superadmin

    const supabase = getSupabaseServiceClient();
    // Nombre único por subida: si reusáramos siempre el mismo nombre, un reemplazo
    // no cambiaría la URL pública y el navegador/CDN seguiría sirviendo la imagen vieja.
    const fileName = `${sanitizeCodigoBarra(codigoBarra)}-${Date.now()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from(CACHE_BUCKET)
      .upload(fileName, imageBuffer, { contentType: "image/webp" });

    if (uploadError) {
      console.error("Error subiendo imagen al caché de productos:", uploadError);
      return;
    }

    const { data } = supabase.storage.from(CACHE_BUCKET).getPublicUrl(fileName);

    await prisma.imagenProductoCache.upsert({
      where: { CodigoBarra: codigoBarra },
      create: {
        CodigoBarra: codigoBarra,
        Descripcion: descripcion || null,
        ImageUrl: data.publicUrl,
        Fuente: fuente,
        CreadoPorTenantId: tenantId ?? null,
        CreadoPorUserId: userId ?? null,
      },
      update: {
        Descripcion: descripcion || undefined,
        ImageUrl: data.publicUrl,
        Fuente: fuente,
      },
    });

    // Borrar el archivo anterior (si había uno con otro nombre)
    if (existente) {
      const oldPath = extractStoragePath(existente.ImageUrl);
      if (oldPath && oldPath !== fileName) {
        await supabase.storage.from(CACHE_BUCKET).remove([oldPath]);
      }
    }
  } catch (e) {
    console.error("Error guardando en caché de imágenes:", e);
  }
}

export async function eliminarDeCache(id: bigint): Promise<void> {
  const entry = await prisma.imagenProductoCache.findUnique({ where: { Id: id } });
  if (!entry) return;

  const supabase = getSupabaseServiceClient();
  const path = extractStoragePath(entry.ImageUrl);
  if (path) {
    await supabase.storage.from(CACHE_BUCKET).remove([path]);
  }
  await prisma.imagenProductoCache.delete({ where: { Id: id } });
}
