import { getAuthContext } from "@/lib/auth/getAuthUser";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";

/**
 * GET /api/admin/imagenes-cache
 * Lista/busca entradas del caché compartido de imágenes de producto.
 * Requiere SuperAdmin.
 */
export async function GET(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const pagination = parsePaginationParams(req);
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";

    const where = q
      ? {
          OR: [
            { CodigoBarra: { contains: q, mode: "insensitive" as const } },
            { Descripcion: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, entradas] = await Promise.all([
      prisma.imagenProductoCache.count({ where }),
      prisma.imagenProductoCache.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { FechaCreacion: "desc" },
      }),
    ]);

    return NextResponse.json(
      createPaginationResponse(entradas, total, pagination),
    );
  } catch (error) {
    return handleError(error);
  }
}
