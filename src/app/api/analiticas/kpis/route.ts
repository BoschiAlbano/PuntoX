import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { requirePermiso } from "@/lib/requirePermiso";
import { handleError } from "@/lib/errors/handler";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";

/**
 * GET /api/analiticas/kpis
 *
 * Retorna KPIs del dashboard de analíticas
 * Query params:
 * - fechaDesde: ISO string (opcional, default: 30 días atrás)
 * - fechaHasta: ISO string (opcional, default: hoy)
 * - periodo: "semanal" | "mensual" (opcional, default: "mensual")
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("analiticas");
    const searchParams = req.nextUrl.searchParams;

    // Parsear fechas
    const fechaHasta = searchParams.get("fechaHasta")
      ? new Date(searchParams.get("fechaHasta")!)
      : new Date();

    const periodo = searchParams.get("periodo") || "mensual";
    const diasAtras = periodo === "semanal" ? 7 : 30;
    const fechaDesde = searchParams.get("fechaDesde")
      ? new Date(searchParams.get("fechaDesde")!)
      : new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);

    // Período anterior para comparación
    const diasPeriodo = Math.ceil(
      (fechaHasta.getTime() - fechaDesde.getTime()) / (24 * 60 * 60 * 1000)
    );
    const fechaDesdeAnterior = new Date(
      fechaDesde.getTime() - diasPeriodo * 24 * 60 * 60 * 1000
    );
    const fechaHastaAnterior = new Date(fechaDesde.getTime() - 1);

    const tenantIdBigInt = BigInt(tenantId);

    // 1. Ingresos netos del período (Total - Descuento)
    // Nota: Para mejor performance, considerar índices en: TenantId, EstaEliminado, Fecha, TipoComprobante
    const ingresosActual = await prisma.comprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
        TipoComprobante: {
          in: [
            TIPO_COMPROBANTE_VENTA.FACTURA_A,
            TIPO_COMPROBANTE_VENTA.FACTURA_B,
            TIPO_COMPROBANTE_VENTA.FACTURA_C,
            TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
            TIPO_COMPROBANTE_VENTA.REMITO,
          ],
        },
      },
      _sum: {
        Total: true,
        Descuento: true,
      },
    });

    const ingresosAnterior = await prisma.comprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Fecha: {
          gte: fechaDesdeAnterior,
          lte: fechaHastaAnterior,
        },
        TipoComprobante: {
          in: [
            TIPO_COMPROBANTE_VENTA.FACTURA_A,
            TIPO_COMPROBANTE_VENTA.FACTURA_B,
            TIPO_COMPROBANTE_VENTA.FACTURA_C,
            TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
            TIPO_COMPROBANTE_VENTA.REMITO,
          ],
        },
      },
      _sum: {
        Total: true,
        Descuento: true,
      },
    });

    const ingresosNetosActual =
      Number(ingresosActual._sum.Total || 0) -
      Number(ingresosActual._sum.Descuento || 0);
    const ingresosNetosAnterior =
      Number(ingresosAnterior._sum.Total || 0) -
      Number(ingresosAnterior._sum.Descuento || 0);
    const variacionIngresos =
      ingresosNetosAnterior > 0
        ? ((ingresosNetosActual - ingresosNetosAnterior) /
            ingresosNetosAnterior) *
          100
        : 0;

    // 2. Descuentos aplicados
    const descuentosActual = Number(ingresosActual._sum.Descuento || 0);
    const descuentosAnterior = Number(ingresosAnterior._sum.Descuento || 0);
    const variacionDescuentos =
      descuentosAnterior > 0
        ? ((descuentosActual - descuentosAnterior) / descuentosAnterior) * 100
        : 0;

    // 3. IVA facturado (Iva21 + Iva105)
    const ivaActual = await prisma.comprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      },
      _sum: {
        Iva21: true,
        Iva105: true,
      },
    });

    const ivaAnterior = await prisma.comprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Fecha: {
          gte: fechaDesdeAnterior,
          lte: fechaHastaAnterior,
        },
      },
      _sum: {
        Iva21: true,
        Iva105: true,
      },
    });

    const ivaTotalActual =
      Number(ivaActual._sum.Iva21 || 0) + Number(ivaActual._sum.Iva105 || 0);
    const ivaTotalAnterior =
      Number(ivaAnterior._sum.Iva21 || 0) +
      Number(ivaAnterior._sum.Iva105 || 0);
    const variacionIva =
      ivaTotalAnterior > 0
        ? ((ivaTotalActual - ivaTotalAnterior) / ivaTotalAnterior) * 100
        : 0;

    // 4. Tickets vs Notas de crédito
    const ticketsActual = await prisma.comprobante.count({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
        TipoComprobante: {
          in: [
            TIPO_COMPROBANTE_VENTA.FACTURA_A,
            TIPO_COMPROBANTE_VENTA.FACTURA_B,
            TIPO_COMPROBANTE_VENTA.FACTURA_C,
            TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
            TIPO_COMPROBANTE_VENTA.REMITO,
          ],
        },
      },
    });

    const notasCreditoActual = await prisma.comprobante.count({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
        TipoComprobante: TIPO_COMPROBANTE_VENTA.NOTA_CREDITO,
      },
    });

    const ticketsAnterior = await prisma.comprobante.count({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Fecha: {
          gte: fechaDesdeAnterior,
          lte: fechaHastaAnterior,
        },
        TipoComprobante: {
          in: [
            TIPO_COMPROBANTE_VENTA.FACTURA_A,
            TIPO_COMPROBANTE_VENTA.FACTURA_B,
            TIPO_COMPROBANTE_VENTA.FACTURA_C,
            TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
            TIPO_COMPROBANTE_VENTA.REMITO,
          ],
        },
      },
    });

    const notasCreditoAnterior = await prisma.comprobante.count({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Fecha: {
          gte: fechaDesdeAnterior,
          lte: fechaHastaAnterior,
        },
        TipoComprobante: TIPO_COMPROBANTE_VENTA.NOTA_CREDITO,
      },
    });

    const variacionTickets =
      ticketsAnterior > 0
        ? ((ticketsActual - ticketsAnterior) / ticketsAnterior) * 100
        : 0;

    // 5. Estado de caja (última caja abierta/cerrada)
    const ultimaCaja = await prisma.caja.findFirst({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      orderBy: {
        FechaApertura: "desc",
      },
      select: {
        Id: true,
        FechaApertura: true,
        FechaCierre: true,
        TotalEntradaEfectivo: true,
        TotalSalidaEfectivo: true,
        MontoInicial: true,
        MontoCierre: true,
      },
    });

    const estadoCaja = ultimaCaja
      ? {
          estaAbierta: !ultimaCaja.FechaCierre,
          fechaApertura: ultimaCaja.FechaApertura,
          fechaCierre: ultimaCaja.FechaCierre,
          totalEntrada: Number(ultimaCaja.TotalEntradaEfectivo),
          totalSalida: Number(ultimaCaja.TotalSalidaEfectivo),
          montoInicial: Number(ultimaCaja.MontoInicial),
          montoCierre: ultimaCaja.MontoCierre
            ? Number(ultimaCaja.MontoCierre)
            : null,
        }
      : null;

    // 6. Margen de ganancia (SubTotal - Costo)
    const margenActual = await prisma.detalleComprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Comprobante: {
          Fecha: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
          EstaEliminado: false,
        },
      },
      _sum: {
        SubTotal: true,
        Costo: true,
      },
    });

    const margenAnterior = await prisma.detalleComprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Comprobante: {
          Fecha: {
            gte: fechaDesdeAnterior,
            lte: fechaHastaAnterior,
          },
          EstaEliminado: false,
        },
      },
      _sum: {
        SubTotal: true,
        Costo: true,
      },
    });

    const margenGananciaActual =
      Number(margenActual._sum.SubTotal || 0) -
      Number(margenActual._sum.Costo || 0);
    const margenGananciaAnterior =
      Number(margenAnterior._sum.SubTotal || 0) -
      Number(margenAnterior._sum.Costo || 0);
    const variacionMargen =
      margenGananciaAnterior > 0
        ? ((margenGananciaActual - margenGananciaAnterior) /
            margenGananciaAnterior) *
          100
        : 0;

    // 7. Ticket promedio
    const ticketPromedioActual =
      ticketsActual > 0 ? ingresosNetosActual / ticketsActual : 0;
    const ticketPromedioAnterior =
      ticketsAnterior > 0 ? ingresosNetosAnterior / ticketsAnterior : 0;
    const variacionTicketPromedio =
      ticketPromedioAnterior > 0
        ? ((ticketPromedioActual - ticketPromedioAnterior) /
            ticketPromedioAnterior) *
          100
        : 0;

    // 8. Productos vendidos (cantidad total)
    const productosVendidosActual = await prisma.detalleComprobante.aggregate({
      where: {
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Comprobante: {
          Fecha: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
          EstaEliminado: false,
        },
      },
      _sum: {
        Cantidad: true,
      },
    });

    const productosVendidosAnterior = await prisma.detalleComprobante.aggregate(
      {
        where: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          Comprobante: {
            Fecha: {
              gte: fechaDesdeAnterior,
              lte: fechaHastaAnterior,
            },
            EstaEliminado: false,
          },
        },
        _sum: {
          Cantidad: true,
        },
      }
    );

    const cantidadVendidaActual = Number(
      productosVendidosActual._sum.Cantidad || 0
    );
    const cantidadVendidaAnterior = Number(
      productosVendidosAnterior._sum.Cantidad || 0
    );
    const variacionCantidad =
      cantidadVendidaAnterior > 0
        ? ((cantidadVendidaActual - cantidadVendidaAnterior) /
            cantidadVendidaAnterior) *
          100
        : 0;

    // 9. Clientes activos (distinct ClienteId en Comprobante_Factura)
    const clientesActivosActual = await prisma.comprobante_Factura.groupBy({
      by: ["ClienteId"],
      where: {
        Comprobante: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          Fecha: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
        },
      },
    });

    const clientesActivosAnterior = await prisma.comprobante_Factura.groupBy({
      by: ["ClienteId"],
      where: {
        Comprobante: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          Fecha: {
            gte: fechaDesdeAnterior,
            lte: fechaHastaAnterior,
          },
        },
      },
    });

    const variacionClientes =
      clientesActivosAnterior.length > 0
        ? ((clientesActivosActual.length - clientesActivosAnterior.length) /
            clientesActivosAnterior.length) *
          100
        : 0;

    return NextResponse.json({
      periodo: {
        desde: fechaDesde.toISOString(),
        hasta: fechaHasta.toISOString(),
        tipo: periodo,
      },
      kpis: {
        ingresosNetos: {
          valor: ingresosNetosActual,
          variacion: variacionIngresos,
          periodoAnterior: ingresosNetosAnterior,
        },
        descuentos: {
          valor: descuentosActual,
          variacion: variacionDescuentos,
          periodoAnterior: descuentosAnterior,
        },
        ivaFacturado: {
          valor: ivaTotalActual,
          variacion: variacionIva,
          periodoAnterior: ivaTotalAnterior,
        },
        tickets: {
          valor: ticketsActual,
          variacion: variacionTickets,
          periodoAnterior: ticketsAnterior,
        },
        notasCredito: {
          valor: notasCreditoActual,
          periodoAnterior: notasCreditoAnterior,
        },
        margenGanancia: {
          valor: margenGananciaActual,
          variacion: variacionMargen,
          periodoAnterior: margenGananciaAnterior,
        },
        ticketPromedio: {
          valor: ticketPromedioActual,
          variacion: variacionTicketPromedio,
          periodoAnterior: ticketPromedioAnterior,
        },
        productosVendidos: {
          valor: cantidadVendidaActual,
          variacion: variacionCantidad,
          periodoAnterior: cantidadVendidaAnterior,
        },
        clientesActivos: {
          valor: clientesActivosActual.length,
          variacion: variacionClientes,
          periodoAnterior: clientesActivosAnterior.length,
        },
        estadoCaja,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
