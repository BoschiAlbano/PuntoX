import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: PERMISSIONS.VENTAS,
    });

    // const tenantId = "2";
    // const sucursalId = "2";

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim() || "";
    const limit = Number(searchParams.get("limit")) || 20;
    const page = Number(searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;

    const where: any = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
    };

    if (q) {
      where.OR = [
        { Descripcion: { contains: q, mode: "insensitive" } },
        { CodigoBarra: { contains: q, mode: "insensitive" } },
      ];

      // Si es un número, intentar buscar por código también
      const codeNum = parseInt(q);
      if (
        !isNaN(codeNum) &&
        codeNum < Number(process.env.MAX_ARTICLE_CODE || 999)
      ) {
        where.OR.push({ Codigo: codeNum });
      }
    }

    const [productos, total] = await Promise.all([
      prisma.articulo.findMany({
        where,
        select: {
          Id: true,
          Codigo: true,
          CodigoBarra: true,
          Descripcion: true,
          // Reglas de negocio
          DescuentaStock: true,
          PermiteStockNegativo: true,
          StockMinimo: true,

          ActivarLimiteVenta: true,
          LimiteVenta: true,

          ActivarHoraVenta: true,
          HoraLimiteVentaDesde: true,
          HoraLimiteVentaHasta: true,

          TipoVenta: true,
          // Stock global (fallback)
          Stock: true,

          // Precios
          Precio: {
            select: {
              PrecioPublico: true,
              PrecioPublico2: true,
            },
          },

          Iva: {
            select: {
              Id: true,
              Porcentaje: true,
              Descripcion: true,
            },
          },
          // Stock especifico de sucursal
          ArticuloStock: {
            where: { SucursalId: BigInt(sucursalId) },
            select: { Stock: true, StockMinimo: true, Ubicacion: true },
            take: 1,
          },
        },
        orderBy: { Descripcion: "asc" },
        take: limit,
        skip: skip,
      }),
      prisma.articulo.count({ where }),
    ]);

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

        Precio: {
          PrecioPublico: Number(p.Precio?.PrecioPublico || 0),
          PrecioPublico2: Number(p.Precio?.PrecioPublico2 || 0),
        },
        Iva: p.Iva,
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
