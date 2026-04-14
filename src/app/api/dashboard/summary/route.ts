import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/constants/comprobantes";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, sucursalId } = await getAuthContext({
      req,
      // Usar permiso de lectura general/analíticas. Puedes ajustarlo según tu política
      permission: PERMISSIONS.ANALITICAS, 
    });

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Sucursal no especificada" },
        { status: 400 }
      );
    }

    const tenantIdBigInt = BigInt(tenantId);
    const sucursalIdBigInt = BigInt(sucursalId);

    // Definir rangos de fechas
    const now = new Date();
    
    // Rango de "Hoy"
    const hoyInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hoyFin = new Date(hoyInicio);
    hoyFin.setDate(hoyFin.getDate() + 1);

    // Rango de "Ayer" (para comparativa)
    const ayerInicio = new Date(hoyInicio);
    ayerInicio.setDate(ayerInicio.getDate() - 1);

    // Rango de "Este Mes"
    const esteMesInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Rango de "Mes Anterior" (para comparativa)
    const mesAnteriorInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
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
    // Como comparar columnas nativamente en Prisma db.table requiere un raw query para optimizarlo:
    const stockBajoRawPromise = prisma.$queryRaw`
      SELECT COUNT(*) as "count" 
      FROM "ArticuloStock"
      WHERE "TenantId" = ${tenantIdBigInt} 
        AND "SucursalId" = ${sucursalIdBigInt}
        AND "Stock" <= COALESCE("StockMinimo", 0)
    `;

    // ---- PROMESA 4: Ingresos Mes ----
    const ingresosMesPromise = prisma.comprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        SucursalId: sucursalIdBigInt,
        EstaEliminado: false,
        Fecha: { gte: esteMesInicio, lt: hoyFin },
        TipoComprobante: { in: tiposVenta },
      },
      _sum: { Total: true },
    });

    // ---- PROMESA 5: Ingresos Mes Anterior ----
    const ingresosMesAnteriorPromise = prisma.comprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        SucursalId: sucursalIdBigInt,
        EstaEliminado: false,
        Fecha: { gte: mesAnteriorInicio, lt: mesAnteriorFin },
        TipoComprobante: { in: tiposVenta },
      },
      _sum: { Total: true },
    });

    // ---- PROMESA 6 & 7: Clientes Activos (Distinct IDs) ----
    const clientesMesPromise = prisma.comprobante_Factura.groupBy({
      by: ["ClienteId"],
      where: {
        Comprobante: {
          TenantId: tenantIdBigInt,
          SucursalId: sucursalIdBigInt,
          EstaEliminado: false,
          Fecha: { gte: esteMesInicio, lt: hoyFin },
        },
      },
    });

    const clientesMesAnteriorPromise = prisma.comprobante_Factura.groupBy({
      by: ["ClienteId"],
      where: {
        Comprobante: {
          TenantId: tenantIdBigInt,
          SucursalId: sucursalIdBigInt,
          EstaEliminado: false,
          Fecha: { gte: mesAnteriorInicio, lt: mesAnteriorFin },
        },
      },
    });

    // Ejecutamos en paralelo
    const [
      ventasHoy,
      ventasAyer,
      stockBajoResult,
      ingresosMes,
      ingresosMesAnterior,
      clientesMes,
      clientesMesAnterior
    ] = await Promise.all([
      ventasHoyPromise,
      ventasAyerPromise,
      stockBajoRawPromise,
      ingresosMesPromise,
      ingresosMesAnteriorPromise,
      clientesMesPromise,
      clientesMesAnteriorPromise,
    ]);

    // Procesar resultados

    // 1. Ventas Hoy
    const ventasHoyMonto = Number(ventasHoy._sum.Total || 0);
    const ventasAyerMonto = Number(ventasAyer._sum.Total || 0);
    const ventasHoyCount = ventasHoy._count.Id;
    let percepcionVentas = 0;
    if (ventasAyerMonto > 0) {
      percepcionVentas = ((ventasHoyMonto - ventasAyerMonto) / ventasAyerMonto) * 100;
    }

    // 2. Stock Bajo
    const stockBajoArray = stockBajoResult as any[];
    const stockBajoCount = stockBajoArray.length > 0 ? Number(stockBajoArray[0].count) : 0;

    // 3. Ingresos del Mes
    const ingresosMesMonto = Number(ingresosMes._sum.Total || 0);
    const ingresosMesAnteriorMonto = Number(ingresosMesAnterior._sum.Total || 0);
    let percepcionIngresos = 0;
    if (ingresosMesAnteriorMonto > 0) {
      percepcionIngresos = ((ingresosMesMonto - ingresosMesAnteriorMonto) / ingresosMesAnteriorMonto) * 100;
    }

    // 4. Clientes Nuevos/Activos
    const clientesMesCount = clientesMes.length;
    const clientesMesAnteriorCount = clientesMesAnterior.length;
    let percepcionClientes = 0;
    if (clientesMesAnteriorCount > 0) {
      percepcionClientes = ((clientesMesCount - clientesMesAnteriorCount) / clientesMesAnteriorCount) * 100;
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
      monthRevenue: {
        amount: ingresosMesMonto,
        percentage: Number(percepcionIngresos.toFixed(2)),
      },
      activeClients: {
        count: clientesMesCount,
        percentage: Number(percepcionClientes.toFixed(2)),
      },
    });

  } catch (error) {
    return handleError(error);
  }
}
