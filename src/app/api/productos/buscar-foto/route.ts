import { getAuthContext } from "@/lib/auth/getAuthUser";
import { GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";
import {
  buscarCacheExacto,
  descargarImagenComoBuffer,
} from "@/lib/services/imagenProductoCache";

const OFF_USER_AGENT = "PuntoX-SaaS/1.0 (+https://puntox.app)";
const FETCH_TIMEOUT_MS = 8000;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // Debe entrar dentro del límite de ImageUploadField

async function fetchWithTimeout(url: string, headers: Record<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: NextRequest) {
  try {
    await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PRODUCTOS,
    });

    const codigoBarra = req.nextUrl.searchParams.get("codigoBarra")?.trim();
    if (!codigoBarra) {
      throw createError.validation("Falta el código de barra");
    }

    // 1. Caché propio (compartido entre tenants), antes de ir a un tercero
    const cacheHit = await buscarCacheExacto(codigoBarra);
    if (cacheHit) {
      const buffer = await descargarImagenComoBuffer(cacheHit.ImageUrl);
      if (buffer) {
        return NextResponse.json({
          found: true,
          imageBase64: buffer.toString("base64"),
          productName: cacheHit.Descripcion,
          fuente: "PUNTO_X",
        });
      }
      // Si por algún motivo no se pudo descargar la imagen cacheada, seguimos a OFF
    }

    const productRes = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigoBarra)}.json?fields=product_name,image_url,image_front_url`,
      { "User-Agent": OFF_USER_AGENT },
    );

    if (!productRes.ok) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    const productData = await productRes.json();
    const imageUrl: string | undefined =
      productData?.product?.image_front_url || productData?.product?.image_url;

    if (productData?.status !== 1 || !imageUrl) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    const imageRes = await fetchWithTimeout(imageUrl, {
      "User-Agent": OFF_USER_AGENT,
    });
    if (!imageRes.ok) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    const contentLength = Number(imageRes.headers.get("content-length") || 0);
    if (contentLength && contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    const imageBase64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      found: true,
      imageBase64,
      productName: productData?.product?.product_name || null,
      fuente: "OPEN_FOOD_FACTS",
    });
  } catch (error) {
    return handleError(error);
  }
}
