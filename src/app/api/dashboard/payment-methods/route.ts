import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { TIPO_COMPROBANTE_VENTA, PERMISSIONS, GET_PERMISSIONS, TIPO_PAGO } from "@/lib/constants/comprobantes";
import { getAuthContext } from "@/lib/auth/getAuthUser";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.ANALITICAS,
    });

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Sucursal no especificada" },
        { status: 400 }
      );
    }

    const tenantIdBigInt = BigInt(tenantId);
    const sucursalIdBigInt = BigInt(sucursalId);

    const searchParams = req.nextUrl.searchParams;
    let fechaInicioGte: Date;
    let fechaFinLt: Date;

    const queryDate = searchParams.get("date");
    if (queryDate) {
      fechaInicioGte = new Date(queryDate);
      fechaInicioGte.setHours(0, 0, 0, 0);
      fechaFinLt = new Date(fechaInicioGte);
      fechaFinLt.setDate(fechaFinLt.getDate() + 1);
    } else {
      const now = new Date();
      fechaInicioGte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

    const totalPagos = await prisma.formaPago.count({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        ComprobanteId: { not: null },
        Comprobante: {
          SucursalId: sucursalIdBigInt,
          Fecha: { gte: fechaInicioGte, lt: fechaFinLt },
          EstaEliminado: false,
          TipoComprobante: { in: tiposVenta },
        },
      },
    });

    if (totalPagos === 0) {
      // Don't return early with empty array, proceed to generate 0% items
    }

    const pagosAgrupados = totalPagos > 0 ? await prisma.formaPago.groupBy({
      by: ["TipoPago"],
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        ComprobanteId: { not: null },
        Comprobante: {
          SucursalId: sucursalIdBigInt,
          Fecha: { gte: fechaInicioGte, lt: fechaFinLt },
          EstaEliminado: false,
          TipoComprobante: { in: tiposVenta },
        },
      },
      _count: { Id: true },
      _sum: { Monto: true },
      orderBy: {
        _count: { Id: "desc" },
      },
      take: 10,
    }) : [];

    const mapTipoPago = Object.entries(TIPO_PAGO).reduce((acc, [key, value]) => {
      acc[value] = key.replace("_", " ");
      return acc;
    }, {} as Record<number, string>);

    let paymentMethods = Object.keys(mapTipoPago).map(key => ({
      TipoPago: Number(key),
      name: mapTipoPago[Number(key)],
      pct: 0,
      money: 0,
      count: 0,
    }));

    if (totalPagos > 0) {
      pagosAgrupados.forEach((item) => {
        const transacciones = item._count.Id;
        const pct = (transacciones / totalPagos) * 100;
        
        const index = paymentMethods.findIndex(p => p.TipoPago === item.TipoPago);
        if (index !== -1) {
          paymentMethods[index].pct = Number(pct.toFixed(1));
          paymentMethods[index].money = Number(item._sum.Monto || 0);
          paymentMethods[index].count = transacciones;
        } else {
          paymentMethods.push({
            TipoPago: item.TipoPago,
            name: "OTROS",
            pct: Number(pct.toFixed(1)),
            money: Number(item._sum.Monto || 0),
            count: transacciones,
          });
        }
      });
    }

    paymentMethods.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalTransacciones: totalPagos,
      paymentMethods: paymentMethods.map(({ TipoPago, ...rest }) => rest),
    });
  } catch (error) {
    return handleError(error);
  }
}
