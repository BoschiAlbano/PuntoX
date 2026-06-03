import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.VENTAS,
    });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim() || "";
    const limit = Number(searchParams.get("limit")) || 20;
    const page = Number(searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;
    const editIdParam = searchParams.get("editId");
    const editId = editIdParam ? Number(editIdParam) : null;

    const where: any = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
    };

    // Determinar si el término de búsqueda es numérico (código exacto)
    // Además verificamos que no exceda el límite de un entero de 32 bits para Prisma (max 2147483647)
    const isNumericSearch = q && /^\d+$/.test(q);
    const codeNum = isNumericSearch ? parseInt(q, 10) : NaN;
    const isValidInt = isNumericSearch && !isNaN(codeNum) && codeNum <= 2147483647;

    if (q) {
      if (isNumericSearch) {
        // Para búsquedas numéricas: buscar por Código exacto, CodigoBarra, o Descripción
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

    // Para búsquedas numéricas, primero buscar coincidencia exacta por código
    // para garantizar que aparezca primero en los resultados, así como el editId si existe
    let exactCodeMatch: any[] = [];
    if (isValidInt || editId) {
      exactCodeMatch = await prisma.articulo.findMany({
        where: {
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
          OR: [
            ...(isValidInt ? [{ Codigo: codeNum }] : []),
            ...(editId ? [{ Id: editId }] : []),
          ],
        },
        select: {
          Id: true,
          Codigo: true,
          CodigoBarra: true,
          Descripcion: true,
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
          PrecioCosto: true,
          Precios: {
            select: {
              ListaPrecioId: true,
              PorcentajeGanancia: true,
              PrecioFinal: true,
            },
          },
          Iva: {
            select: {
              Id: true,
              Porcentaje: true,
              Descripcion: true,
            },
          },
          PromocionesCantidad: {
            select: { Id: true, Cantidad: true, DescuentoPorcentaje: true, EstaActiva: true },
          },
          ArticuloStock: {
            where: { SucursalId: BigInt(sucursalId) },
            select: { Stock: true, StockMinimo: true, Ubicacion: true },
            take: 1,
          },
        },
        take: 1,
      });
    }

    // IDs de coincidencias exactas para excluirlas de la búsqueda general
    const exactIds = exactCodeMatch.map((p) => p.Id);

    // Ajustar where para excluir coincidencias exactas ya encontradas
    const restWhere = { ...where };
    if (exactIds.length > 0) {
      restWhere.AND = [
        ...(restWhere.AND || []),
        { Id: { notIn: exactIds } },
      ];
    }

    const restLimit = Math.max(0, limit - exactIds.length);

    const [restProductos, total] = await Promise.all([
      prisma.articulo.findMany({
        where: restWhere,
        select: {
          Id: true,
          Codigo: true,
          CodigoBarra: true,
          Descripcion: true,
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
          PrecioCosto: true,
          Precios: {
            select: {
              ListaPrecioId: true,
              PorcentajeGanancia: true,
              PrecioFinal: true,
            },
          },
          Iva: {
            select: {
              Id: true,
              Porcentaje: true,
              Descripcion: true,
            },
          },
          PromocionesCantidad: {
            select: { Id: true, Cantidad: true, DescuentoPorcentaje: true, EstaActiva: true },
          },
          ArticuloStock: {
            where: { SucursalId: BigInt(sucursalId) },
            select: { Stock: true, StockMinimo: true, Ubicacion: true },
            take: 1,
          },
        },
        orderBy: { Descripcion: "asc" },
        take: restLimit,
        skip: exactIds.length > 0 && page === 1 ? 0 : skip,
      }),
      prisma.articulo.count({ where }),
    ]);

    // Combinar: exacto primero, luego el resto
    const productos = [...exactCodeMatch, ...restProductos];

    const data = productos.map((p) => {
      const stockSucursal = p.ArticuloStock[0];
      // Prioridad: Stock Sucursal -> Stock Global -> 0
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
        // Formatear fechas a HH:mm si existen
        HoraLimiteVentaDesde: formatTime(p.HoraLimiteVentaDesde),
        HoraLimiteVentaHasta: formatTime(p.HoraLimiteVentaHasta),

        PrecioCosto: Number(p.PrecioCosto || 0),
        PreciosLista: (p.Precios || []).map((pl: { ListaPrecioId: bigint; PorcentajeGanancia: unknown; PrecioFinal: unknown }) => ({
          ListaPrecioId: Number(pl.ListaPrecioId),
          PorcentajeGanancia: Number(pl.PorcentajeGanancia),
          PrecioFinal: Number(pl.PrecioFinal),
        })),
        Iva: p.Iva,
        PromocionesCantidad: p.PromocionesCantidad?.map((pc: any) => ({
          Id: Number(pc.Id),
          Cantidad: pc.Cantidad,
          DescuentoPorcentaje: Number(pc.DescuentoPorcentaje),
          EstaActiva: pc.EstaActiva,
        })) || [],
        TipoVenta: p.TipoVenta,
      };
    });

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return handleError(err);
  }
}

function formatTime(date: Date | null): string | null {
  if (!date) return null;
  // Extraer HH:mm de la fecha UTC o local almacenada
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
