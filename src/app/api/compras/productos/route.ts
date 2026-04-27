import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.COMPRAS,
    });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim() || "";
    const limit = Number(searchParams.get("limit")) || 20;
    const page = Number(searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;

    const where: any = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
    };

    const isNumericSearch = q && /^\d+$/.test(q);
    const codeNum = isNumericSearch ? parseInt(q, 10) : NaN;
    const isValidInt = isNumericSearch && !isNaN(codeNum) && codeNum <= 2147483647;

    if (q) {
      if (isNumericSearch) {
        const orConditions: any[] = [
          { CodigoBarra: { contains: q, mode: "insensitive" } },
          { Descripcion: { contains: q, mode: "insensitive" } },
        ];
        if (isValidInt) {
          orConditions.unshift({ Codigo: codeNum });
        }
        where.OR = orConditions;
      } else {
        where.OR = [
          { Descripcion: { contains: q, mode: "insensitive" } },
          { CodigoBarra: { contains: q, mode: "insensitive" } },
        ];
      }
    }

    // Selección común — incluye PrecioCosto para compras
    const selectFields = {
      Id: true,
      Codigo: true,
      CodigoBarra: true,
      Descripcion: true,
      PrecioCosto: true,            // ← Directo en Articulo
      DescuentaStock: true,
      PermiteStockNegativo: true,
      StockMinimo: true,
      ActivarLimiteVenta: true,
      LimiteVenta: true,
      ActivarHoraVenta: true,
      HoraLimiteVentaDesde: true,
      HoraLimiteVentaHasta: true,
      TipoVenta: true,
      Stock: true,
      Precios: {
        select: {
          Id: true,
          ListaPrecioId: true,
          PorcentajeGanancia: true,
          PrecioFinal: true,
          ListaPrecio: { select: { Nombre: true } },
        },
        where: {
          ListaPrecio: { Activa: true, EstaEliminado: false },
        },
      },
      Iva: {
        select: { Id: true, Porcentaje: true, Descripcion: true },
      },
      ArticuloStock: {
        where: { SucursalId: BigInt(sucursalId) },
        select: { Stock: true, StockMinimo: true },
        take: 1,
      },
    };

    // Coincidencia exacta por código primero
    let exactCodeMatch: any[] = [];
    if (isValidInt) {
      exactCodeMatch = await prisma.articulo.findMany({
        where: { TenantId: BigInt(tenantId), EstaEliminado: false, Codigo: codeNum },
        select: selectFields,
        take: 1,
      });
    }

    const exactIds = exactCodeMatch.map((p) => p.Id);
    const restWhere = { ...where };
    if (exactIds.length > 0) {
      restWhere.AND = [...(restWhere.AND || []), { Id: { notIn: exactIds } }];
    }
    const restLimit = Math.max(0, limit - exactIds.length);

    const [restProductos, total] = await Promise.all([
      prisma.articulo.findMany({
        where: restWhere,
        select: selectFields,
        orderBy: { Descripcion: "asc" },
        take: restLimit,
        skip: exactIds.length > 0 && page === 1 ? 0 : skip,
      }),
      prisma.articulo.count({ where }),
    ]);

    const productos = [...exactCodeMatch, ...restProductos];

    const data = productos.map((p) => {
      const stockSucursal = p.ArticuloStock[0];
      const stockReal = stockSucursal ? stockSucursal.Stock : 0;

      return {
        Id: Number(p.Id),
        Codigo: p.Codigo,
        CodigoBarra: p.CodigoBarra,
        Descripcion: p.Descripcion,
        Stock: Number(stockReal),

        DescuentaStock: p.DescuentaStock,
        PermiteStockNegativo: p.PermiteStockNegativo,
        StockMinimo: Number(stockSucursal?.StockMinimo ?? p.StockMinimo),
        ActivarLimiteVenta: p.ActivarLimiteVenta,
        LimiteVenta: Number(p.LimiteVenta),
        ActivarHoraVenta: p.ActivarHoraVenta,
        HoraLimiteVentaDesde: p.HoraLimiteVentaDesde,
        HoraLimiteVentaHasta: p.HoraLimiteVentaHasta,
        TipoVenta: p.TipoVenta,

        PrecioCosto: Number(p.PrecioCosto ?? 0),
        PreciosLista: (p.Precios ?? []).map((pl) => ({
          ListaPrecioId: Number(pl.ListaPrecioId),
          PorcentajeGanancia: Number(pl.PorcentajeGanancia),
          PrecioFinal: Number(pl.PrecioFinal),
          ListaPrecio: pl.ListaPrecio ? { Nombre: pl.ListaPrecio.Nombre } : undefined,
        })),
        Iva: p.Iva,
      };
    });

    return NextResponse.json({
      data,
      meta: { total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return handleError(err);
  }
}
