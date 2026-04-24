import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { handleError } from "@/lib/errors/handler";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";

/**
 * GET /api/productos/con-precios
 *
 * Retorna artículos del tenant con todos sus precios de lista.
 * Usado exclusivamente por la pantalla de Actualización Masiva de Precios.
 *
 * Query params:
 *   q        - búsqueda por Descripcion o CodigoBarra
 *   marcaId  - filtrar por Marca
 *   rubroId  - filtrar por Rubro
 *   estado   - "activo" | "inactivo" | "todos"  (default: "activo")
 *   page     - página (default: 1)
 *   limit    - items por página (default: 20)
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PRODUCTOS,
    });

    const params = req.nextUrl.searchParams;

    // ── Parámetros de búsqueda y filtros ──────────────────────────────────
    const search = params.get("q")?.trim() || "";
    const marcaId = params.get("marcaId") ? Number(params.get("marcaId")) : null;
    const rubroId = params.get("rubroId") ? Number(params.get("rubroId")) : null;
    const estado = params.get("estado") || "activo"; // "activo" | "inactivo" | "todos"

    // ── Construir where clause ────────────────────────────────────────────
    const where: Record<string, unknown> = {
      TenantId: BigInt(tenantId),
    };

    // Filtro de estado (EstaEliminado)
    if (estado === "activo") {
      where.EstaEliminado = false;
    } else if (estado === "inactivo") {
      where.EstaEliminado = true;
    }
    // "todos" → sin filtro de estado

    // Filtro por búsqueda de texto
    if (search) {
      where.OR = [
        { Descripcion: { contains: search, mode: "insensitive" } },
        { CodigoBarra: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtro por Marca
    if (marcaId && !isNaN(marcaId)) {
      where.MarcaId = BigInt(marcaId);
    }

    // Filtro por Rubro
    if (rubroId && !isNaN(rubroId)) {
      where.RubroId = BigInt(rubroId);
    }

    // ── Paginación ────────────────────────────────────────────────────────
    const pagination = parsePaginationParams(req);

    // ── Contar total (para paginación) ────────────────────────────────────
    const total = await prisma.articulo.count({ where });

    // ── Query principal ───────────────────────────────────────────────────
    const articulos = await prisma.articulo.findMany({
      where,
      select: {
        Id: true,
        Codigo: true,
        CodigoBarra: true,
        Descripcion: true,
        PrecioCosto: true,
        EstaEliminado: true,
        Marca: {
          select: { Id: true, Descripcion: true },
        },
        Rubro: {
          select: { Id: true, Descripcion: true },
        },
        // Todos los precios de lista del artículo
        Precios: {
          select: {
            Id: true,
            ListaPrecioId: true,
            PorcentajeGanancia: true,
            PrecioFinal: true,
            ListaPrecio: {
              select: {
                Id: true,
                Nombre: true,
                Activa: true,
              },
            },
          },
          // Solo listas activas
          where: {
            ListaPrecio: {
              Activa: true,
              EstaEliminado: false,
            },
          },
          orderBy: {
            ListaPrecio: { Nombre: "asc" },
          },
        },
      },
      orderBy: { Descripcion: "asc" },
      skip: pagination.skip,
      take: pagination.limit,
    });

    // ── Mapear BigInt → number ────────────────────────────────────────────
    const data = articulos.map((a) => ({
      Id: Number(a.Id),
      Codigo: a.Codigo,
      CodigoBarra: a.CodigoBarra,
      Descripcion: a.Descripcion,
      PrecioCosto: Number(a.PrecioCosto),
      EstaEliminado: a.EstaEliminado,
      Marca: a.Marca
        ? { Id: Number(a.Marca.Id), Descripcion: a.Marca.Descripcion }
        : null,
      Rubro: a.Rubro
        ? { Id: Number(a.Rubro.Id), Descripcion: a.Rubro.Descripcion }
        : null,
      PreciosLista: a.Precios.map((p) => ({
        Id: Number(p.Id),
        ListaPrecioId: Number(p.ListaPrecioId),
        PorcentajeGanancia: Number(p.PorcentajeGanancia),
        PrecioFinal: Number(p.PrecioFinal),
        ListaPrecio: p.ListaPrecio
          ? {
              Id: Number(p.ListaPrecio.Id),
              Nombre: p.ListaPrecio.Nombre,
            }
          : null,
      })),
    }));

    return NextResponse.json(createPaginationResponse(data, total, pagination), {
      status: 200,
    });
  } catch (error) {
    return handleError(error);
  }
}
