import { getAuthContext } from "@/lib/auth/getAuthUser";
import { GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";
import { buscarCacheTexto } from "@/lib/services/imagenProductoCache";

const OFF_USER_AGENT = "PuntoX-SaaS/1.0 (+https://puntox.app)";
const FETCH_TIMEOUT_MS = 8000;
const MAX_RESULTS = 8;
const MAX_RESULTS_CACHE = 4;

async function fetchWithTimeout(url: string, headers: Record<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

interface OffSearchHit {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  image_url?: string;
}

interface FotoCandidato {
  code: string;
  productName: string | null;
  brands: string | null;
  imageUrl: string;
  fuente: "PUNTO_X" | "OPEN_FOOD_FACTS";
}

export async function GET(req: NextRequest) {
  try {
    await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PRODUCTOS,
    });

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q) {
      throw createError.validation("Falta el texto de búsqueda");
    }

    // 1. Caché propio primero (más rápido, sin depender de un tercero)
    const cacheHits = await buscarCacheTexto(q, MAX_RESULTS_CACHE);
    const cacheResults: FotoCandidato[] = cacheHits.map((hit) => ({
      code: hit.CodigoBarra,
      productName: hit.Descripcion,
      brands: null,
      imageUrl: hit.ImageUrl,
      fuente: "PUNTO_X",
    }));

    const restantes = Math.max(0, MAX_RESULTS - cacheResults.length);
    let offResults: FotoCandidato[] = [];

    if (restantes > 0) {
      const searchRes = await fetchWithTimeout(
        `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=${restantes}&fields=product_name,brands,code,image_url`,
        { "User-Agent": OFF_USER_AGENT },
      );

      if (searchRes.ok) {
        const data = await searchRes.json();
        const hits: OffSearchHit[] = Array.isArray(data?.hits) ? data.hits : [];
        const codigosEnCache = new Set(cacheResults.map((r) => r.code));

        offResults = hits
          .filter((hit) => hit.code && hit.image_url && !codigosEnCache.has(hit.code))
          .map((hit) => ({
            code: hit.code as string,
            productName: hit.product_name || null,
            brands: Array.isArray(hit.brands) ? hit.brands.join(", ") : hit.brands || null,
            imageUrl: hit.image_url as string,
            fuente: "OPEN_FOOD_FACTS",
          }));
      }
    }

    return NextResponse.json({ results: [...cacheResults, ...offResults] });
  } catch (error) {
    return handleError(error);
  }
}
