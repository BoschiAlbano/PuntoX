import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";
import { getAuthContext } from "@/lib/auth/getAuthUser";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, sucursalId } = await getAuthContext({
      req,
    });

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Sucursal no especificada" },
        { status: 400 },
      );
    }

    const tenantIdBigInt = BigInt(tenantId);
    const sucursalIdBigInt = BigInt(sucursalId);

    // Obtener parámetros de fecha si vienen, si no usar el día de hoy por defecto como dice "Top 10 del día"
    const searchParams = req.nextUrl.searchParams;
    let fechaInicioGte: Date;
    let fechaFinLt: Date;

    const queryDate = searchParams.get("date"); // yyyy-mm-dd
    if (queryDate) {
      fechaInicioGte = new Date(queryDate);
      fechaInicioGte.setHours(0, 0, 0, 0);
      fechaFinLt = new Date(fechaInicioGte);
      fechaFinLt.setDate(fechaFinLt.getDate() + 1);
    } else {
      const now = new Date();
      fechaInicioGte = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      fechaFinLt = new Date(fechaInicioGte);
      fechaFinLt.setDate(fechaFinLt.getDate() + 1);
    }

    const tiposVenta = [
      TIPO_COMPROBANTE_VENTA.FACTURA_A,
      TIPO_COMPROBANTE_VENTA.FACTURA_B,
      TIPO_COMPROBANTE_VENTA.FACTURA_C,
      TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
      TIPO_COMPROBANTE_VENTA.REMITO,
    ];

    // Primero contamos el total de unidades venidas en ese periodo para calcular los porcentajes
    const totalVendidosAgregado = await prisma.detalleComprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Comprobante: {
          SucursalId: sucursalIdBigInt,
          Fecha: { gte: fechaInicioGte, lt: fechaFinLt },
          EstaEliminado: false,
          TipoComprobante: { in: tiposVenta },
        },
      },
      _sum: { Cantidad: true },
    });

    const totalUnidades = Number(totalVendidosAgregado._sum.Cantidad || 0);

    // Si no hubo ventas, devolvemos vacío inmediatamente
    if (totalUnidades === 0) {
      return NextResponse.json({
        totalUnidades: 0,
        topProducts: [],
      });
    }

    // Buscamos las ventas por Articulo (Agrupados)
    const topVendidosAgrupado = await prisma.detalleComprobante.groupBy({
      by: ["ArticuloId"],
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Comprobante: {
          SucursalId: sucursalIdBigInt,
          Fecha: { gte: fechaInicioGte, lt: fechaFinLt },
          EstaEliminado: false,
          TipoComprobante: { in: tiposVenta },
        },
      },
      _sum: { Cantidad: true },
      orderBy: {
        _sum: { Cantidad: "desc" },
      },
      take: 10,
    });

    // Como prisma.groupBy no trae relaciones por diseño, buscamos los nombres de esos artículos
    const articuloIds = topVendidosAgrupado.map((a) => a.ArticuloId);

    const articulos = await prisma.articulo.findMany({
      where: {
        Id: { in: articuloIds },
        TenantId: tenantIdBigInt,
      },
      select: {
        Id: true,
        Descripcion: true,
      },
    });

    // Mapearlo a un objeto útil (mapIdToArticle)
    const articuloMap = articulos.reduce(
      (acc, articulo) => {
        acc[articulo.Id.toString()] = articulo.Descripcion;
        return acc;
      },
      {} as Record<string, string>,
    );

    const topProducts = topVendidosAgrupado.map((item, index) => {
      const uds = Number(item._sum.Cantidad || 0);
      const pct = (uds / totalUnidades) * 100;
      const articuloId = item.ArticuloId.toString();

      return {
        id: articuloId,
        name: articuloMap[articuloId] || "Artículo desconocido",
        uds,
        pct: Number(pct.toFixed(1)),
        imageUrl: `/api/productos/${articuloId}?foto=1`,
      };
    });

    return NextResponse.json({
      totalUnidades,
      topProducts,
    });
  } catch (error) {
    return handleError(error);
  }
}
