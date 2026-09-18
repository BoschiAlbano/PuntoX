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

    // Definir rangos de fechas
    const now = new Date();

    // Rango de "Hoy"
    const hoyInicio = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const hoyFin = new Date(hoyInicio);
    hoyFin.setDate(hoyFin.getDate() + 1);

    // Rango de "Ayer" (para comparativa)
    const ayerInicio = new Date(hoyInicio);
    ayerInicio.setDate(ayerInicio.getDate() - 1);

    // Rango de "Este Mes"
    const esteMesInicio = new Date(now.getFullYear(), now.getMonth(), 1);

    // Rango de "Mes Anterior" (para comparativa)
    const mesAnteriorInicio = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const mesAnteriorFin = new Date(now.getFullYear(), now.getMonth(), 1);

    // Tipos de comprobante de venta válidos
    const tiposVenta = [
      TIPO_COMPROBANTE_VENTA.FACTURA_A,
      TIPO_COMPROBANTE_VENTA.FACTURA_B,
      TIPO_COMPROBANTE_VENTA.FACTURA_C,
      TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
      TIPO_COMPROBANTE_VENTA.REMITO,
    ];

    // ---- PROMESA 1: Ventas Hoy ----
    const ventasHoyPromise = prisma.comprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        SucursalId: sucursalIdBigInt,
        EstaEliminado: false,
        Fecha: { gte: hoyInicio, lt: hoyFin },
        TipoComprobante: { in: tiposVenta },
      },
      _sum: { Total: true },
      _count: { Id: true },
    });

    // ---- PROMESA 2: Ventas Ayer (Comparativa) ----
    const ventasAyerPromise = prisma.comprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        SucursalId: sucursalIdBigInt,
        EstaEliminado: false,
        Fecha: { gte: ayerInicio, lt: hoyInicio },
        TipoComprobante: { in: tiposVenta },
      },
      _sum: { Total: true },
    });

    // ---- PROMESA 3: Stock Bajo ----
    // Un artículo solo se considera en alerta cuando el mínimo es positivo y el stock actual
    // está por debajo o igual al mínimo. Esto debe coincidir con la lista de productos.
    const stockBajoRawPromise = prisma.$queryRaw`
      SELECT COUNT(*) as "count"
      FROM "ArticuloStock" ast
      JOIN "Articulo" a ON a."Id" = ast."ArticuloId"
      WHERE ast."TenantId" = ${tenantIdBigInt}
        AND ast."SucursalId" = ${sucursalIdBigInt}
        AND a."EstaEliminado" = false
        AND COALESCE(ast."StockMinimo", a."StockMinimo", 0) > 0
        AND ast."Stock" <= COALESCE(ast."StockMinimo", a."StockMinimo", 0)
    `;

    // ---- PROMESA 4: Ingresos del Día ----
    const ingresosHoyPromise = prisma.comprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        SucursalId: sucursalIdBigInt,
        EstaEliminado: false,
        Fecha: { gte: hoyInicio, lt: hoyFin },
        TipoComprobante: { in: tiposVenta },
      },
      _sum: { Total: true },
    });

    // ---- PROMESA 5: Ingresos de Ayer ----
    const ingresosAyerPromise = prisma.comprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        SucursalId: sucursalIdBigInt,
        EstaEliminado: false,
        Fecha: { gte: ayerInicio, lt: hoyInicio },
        TipoComprobante: { in: tiposVenta },
      },
      _sum: { Total: true },
    });

    // ---- PROMESA 6 & 7: Clientes del Día (Distinct IDs) ----
    const clientesHoyPromise = prisma.comprobante_Factura.groupBy({
      by: ["ClienteId"],
      where: {
        Comprobante: {
          TenantId: tenantIdBigInt,
          SucursalId: sucursalIdBigInt,
          EstaEliminado: false,
          Fecha: { gte: hoyInicio, lt: hoyFin },
        },
      },
    });

    const clientesAyerPromise = prisma.comprobante_Factura.groupBy({
      by: ["ClienteId"],
      where: {
        Comprobante: {
          TenantId: tenantIdBigInt,
          SucursalId: sucursalIdBigInt,
          EstaEliminado: false,
          Fecha: { gte: ayerInicio, lt: hoyInicio },
        },
      },
    });

    // Ejecutamos en paralelo
    const [
      ventasHoy,
      ventasAyer,
      stockBajoResult,
      ingresosHoy,
      ingresosAyer,
      clientesHoy,
      clientesAyer,
    ] = await Promise.all([
      ventasHoyPromise,
      ventasAyerPromise,
      stockBajoRawPromise,
      ingresosHoyPromise,
      ingresosAyerPromise,
      clientesHoyPromise,
      clientesAyerPromise,
    ]);

    // Procesar resultados

    // 1. Ventas Hoy
    const ventasHoyMonto = Number(ventasHoy._sum.Total || 0);
    const ventasAyerMonto = Number(ventasAyer._sum.Total || 0);
    const ventasHoyCount = ventasHoy._count.Id;
    let percepcionVentas = 0;
    if (ventasAyerMonto > 0) {
      percepcionVentas =
        ((ventasHoyMonto - ventasAyerMonto) / ventasAyerMonto) * 100;
    }

    // 2. Stock Bajo
    const stockBajoArray = stockBajoResult as any[];
    const stockBajoCount =
      stockBajoArray.length > 0 ? Number(stockBajoArray[0].count) : 0;

    // 3. Ingresos del Día
    const ingresosHoyMonto = Number(ingresosHoy._sum.Total || 0);
    const ingresosAyerMonto = Number(ingresosAyer._sum.Total || 0);
    let percepcionIngresos = 0;
    if (ingresosAyerMonto > 0) {
      percepcionIngresos =
        ((ingresosHoyMonto - ingresosAyerMonto) / ingresosAyerMonto) * 100;
    }

    // 4. Clientes del Día
    const clientesHoyCount = clientesHoy.length;
    const clientesAyerCount = clientesAyer.length;
    let percepcionClientes = 0;
    if (clientesAyerCount > 0) {
      percepcionClientes =
        ((clientesHoyCount - clientesAyerCount) / clientesAyerCount) * 100;
    }

    return NextResponse.json({
      todaySales: {
        amount: ventasHoyMonto,
        transactions: ventasHoyCount,
        percentage: Number(percepcionVentas.toFixed(2)),
      },
      lowStock: {
        count: stockBajoCount,
      },
      todayRevenue: {
        amount: ingresosHoyMonto,
        percentage: Number(percepcionIngresos.toFixed(2)),
      },
      monthRevenue: {
        amount: ingresosHoyMonto,
        percentage: Number(percepcionIngresos.toFixed(2)),
      },
      todayClients: {
        count: clientesHoyCount,
        percentage: Number(percepcionClientes.toFixed(2)),
      },
      activeClients: {
        count: clientesHoyCount,
        percentage: Number(percepcionClientes.toFixed(2)),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
