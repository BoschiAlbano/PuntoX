import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { requirePermiso } from "@/lib/requirePermiso";
import { handleError } from "@/lib/errors/handler";
import {
  TIPO_COMPROBANTE_VENTA,
  TIPO_PAGO,
} from "@/lib/constants/comprobantes";

/**
 * GET /api/analiticas/graficas
 *
 * Retorna datos para gráficas del dashboard
 * Query params:
 * - tipo: "ingresos" | "pagos" | "productos" | "stock" | "cuentaCorriente" | "gastos"
 * - fechaDesde: ISO string
 * - fechaHasta: ISO string
 * - agrupacion: "dia" | "semana" | "mes" (default: "dia")
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("analiticas");
    const searchParams = req.nextUrl.searchParams;

    const tipo = searchParams.get("tipo") || "ingresos";
    const fechaDesde = searchParams.get("fechaDesde")
      ? new Date(searchParams.get("fechaDesde")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fechaHasta = searchParams.get("fechaHasta")
      ? new Date(searchParams.get("fechaHasta")!)
      : new Date();
    const agrupacion = searchParams.get("agrupacion") || "dia";

    const tenantIdBigInt = BigInt(tenantId);

    switch (tipo) {
      case "ingresos": {
        // Serie temporal de ingresos por día/semana/mes
        const comprobantes = await prisma.comprobante.findMany({
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
          select: {
            Fecha: true,
            Total: true,
            Descuento: true,
            TipoComprobante: true,
          },
          orderBy: {
            Fecha: "asc",
          },
        });

        // Agrupar por período según agrupacion
        const datosAgrupados: Record<
          string,
          {
            fecha: string;
            ingresos: number;
            descuentos: number;
            facturas: number;
            todos: number;
          }
        > = {};

        comprobantes.forEach((comp) => {
          let key: string;
          const fecha = new Date(comp.Fecha);

          if (agrupacion === "semana") {
            const semana = getWeekNumber(fecha);
            key = `${fecha.getFullYear()}-W${semana}`;
          } else if (agrupacion === "mes") {
            key = `${fecha.getFullYear()}-${String(
              fecha.getMonth() + 1
            ).padStart(2, "0")}`;
          } else {
            key = fecha.toISOString().split("T")[0];
          }

          if (!datosAgrupados[key]) {
            datosAgrupados[key] = {
              fecha: key,
              ingresos: 0,
              descuentos: 0,
              facturas: 0,
              todos: 0,
            };
          }

          const total = Number(comp.Total) - Number(comp.Descuento);
          datosAgrupados[key].ingresos += total;
          datosAgrupados[key].descuentos += Number(comp.Descuento);
          datosAgrupados[key].todos += 1;
          if (
            comp.TipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_A ||
            comp.TipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_B ||
            comp.TipoComprobante === TIPO_COMPROBANTE_VENTA.FACTURA_C
          ) {
            datosAgrupados[key].facturas += 1;
          }
        });

        return NextResponse.json({
          tipo: "ingresos",
          datos: Object.values(datosAgrupados),
        });
      }

      case "pagos": {
        // Mix de medios de pago
        const formasPago = await prisma.formaPago.findMany({
          where: {
            TenantId: tenantIdBigInt,
            EstaEliminado: false,
            Comprobante: {
              EstaEliminado: false,
              Fecha: {
                gte: fechaDesde,
                lte: fechaHasta,
              },
            },
          },
          select: {
            TipoPago: true,
            Monto: true,
          },
        });

        const pagosAgrupados: Record<number, number> = {};
        formasPago.forEach((fp) => {
          const tipo = fp.TipoPago;
          pagosAgrupados[tipo] = (pagosAgrupados[tipo] || 0) + Number(fp.Monto);
        });

        const tiposPago = [
          { id: TIPO_PAGO.EFECTIVO, nombre: "Efectivo" },
          { id: TIPO_PAGO.TARJETA, nombre: "Tarjeta" },
          { id: TIPO_PAGO.CHEQUE, nombre: "Cheque" },
          { id: TIPO_PAGO.CUENTA_CORRIENTE, nombre: "Cuenta Corriente" },
          { id: TIPO_PAGO.TRANSFERENCIA, nombre: "Transferencia" },
        ];

        return NextResponse.json({
          tipo: "pagos",
          datos: tiposPago.map((tp) => ({
            nombre: tp.nombre,
            monto: pagosAgrupados[tp.id] || 0,
            porcentaje: 0, // Se calcula en el frontend
          })),
        });
      }

      case "productos": {
        // Top productos por cantidad y monto
        const detalles = await prisma.detalleComprobante.findMany({
          where: {
            TenantId: tenantIdBigInt,
            EstaEliminado: false,
            Comprobante: {
              EstaEliminado: false,
              Fecha: {
                gte: fechaDesde,
                lte: fechaHasta,
              },
            },
          },
          select: {
            ArticuloId: true,
            Cantidad: true,
            SubTotal: true,
            Costo: true,
            Descripcion: true,
            Articulo: {
              select: {
                Descripcion: true,
              },
            },
          },
        });

        const productosAgrupados: Record<
          string,
          {
            id: bigint;
            nombre: string;
            cantidad: number;
            monto: number;
            margen: number;
          }
        > = {};

        detalles.forEach((det) => {
          const articuloId = det.ArticuloId.toString();
          const nombre = det.Descripcion || det.Articulo.Descripcion;

          if (!productosAgrupados[articuloId]) {
            productosAgrupados[articuloId] = {
              id: det.ArticuloId,
              nombre,
              cantidad: 0,
              monto: 0,
              margen: 0,
            };
          }

          productosAgrupados[articuloId].cantidad += Number(det.Cantidad);
          productosAgrupados[articuloId].monto += Number(det.SubTotal);
          productosAgrupados[articuloId].margen +=
            Number(det.SubTotal) - Number(det.Costo);
        });

        const topProductos = Object.values(productosAgrupados)
          .sort((a, b) => b.monto - a.monto)
          .slice(0, 10)
          .map((p) => ({
            id: Number(p.id),
            nombre: p.nombre,
            cantidad: p.cantidad,
            monto: p.monto,
            margen: p.margen,
            margenPorcentaje: p.monto > 0 ? (p.margen / p.monto) * 100 : 0,
          }));

        return NextResponse.json({
          tipo: "productos",
          datos: topProductos,
        });
      }

      case "stock": {
        // Rotación de stock: cantidad vendida vs stock disponible
        const ventasPorProducto = await prisma.detalleComprobante.groupBy({
          by: ["ArticuloId"],
          where: {
            TenantId: tenantIdBigInt,
            EstaEliminado: false,
            Comprobante: {
              EstaEliminado: false,
              Fecha: {
                gte: fechaDesde,
                lte: fechaHasta,
              },
            },
          },
          _sum: {
            Cantidad: true,
          },
        });

        const articulosIds = ventasPorProducto.map((v) => v.ArticuloId);
        const articulos = await prisma.articulo.findMany({
          where: {
            TenantId: tenantIdBigInt,
            Id: { in: articulosIds },
            EstaEliminado: false,
          },
          select: {
            Id: true,
            Descripcion: true,
            Stock: true,
            StockMinimo: true,
          },
        });

        const datosStock = ventasPorProducto.map((venta) => {
          const articulo = articulos.find((a) => a.Id === venta.ArticuloId);
          return {
            id: Number(venta.ArticuloId),
            nombre: articulo?.Descripcion || "Desconocido",
            cantidadVendida: Number(venta._sum.Cantidad || 0),
            stockDisponible: Number(articulo?.Stock || 0),
            stockMinimo: Number(articulo?.StockMinimo || 0),
            rotacion:
              Number(articulo?.Stock || 0) > 0
                ? Number(venta._sum.Cantidad || 0) /
                  Number(articulo?.Stock || 1)
                : 0,
          };
        });

        return NextResponse.json({
          tipo: "stock",
          datos: datosStock
            .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
            .slice(0, 20),
        });
      }

      case "cuentaCorriente": {
        // Cuenta corriente: pagado vs pendiente por cliente
        const movimientos = await prisma.movimiento_CuentaCorriente.findMany({
          where: {
            Movimiento: {
              TenantId: tenantIdBigInt,
              EstaEliminado: false,
              Fecha: {
                gte: fechaDesde,
                lte: fechaHasta,
              },
            },
          },
          include: {
            Movimiento: {
              select: {
                Monto: true,
                TipoMovimiento: true,
                Fecha: true,
              },
            },
            Persona_Cliente: {
              select: {
                Persona: {
                  select: {
                    Nombre: true,
                    Apellido: true,
                  },
                },
              },
            },
          },
        });

        const clientesAgrupados: Record<
          string,
          { id: bigint; nombre: string; pagado: number; pendiente: number }
        > = {};

        movimientos.forEach((mov) => {
          const clienteId = mov.ClienteId.toString();
          const nombre = `${mov.Persona_Cliente.Persona.Nombre} ${mov.Persona_Cliente.Persona.Apellido}`;
          const monto = Number(mov.Movimiento.Monto);

          if (!clientesAgrupados[clienteId]) {
            clientesAgrupados[clienteId] = {
              id: mov.ClienteId,
              nombre,
              pagado: 0,
              pendiente: 0,
            };
          }

          // TipoMovimiento: 1 = Entrada (pago), 2 = Salida (deuda)
          if (mov.Movimiento.TipoMovimiento === 1) {
            clientesAgrupados[clienteId].pagado += monto;
          } else {
            clientesAgrupados[clienteId].pendiente += monto;
          }
        });

        return NextResponse.json({
          tipo: "cuentaCorriente",
          datos: Object.values(clientesAgrupados)
            .filter((c) => c.pendiente > 0 || c.pagado > 0)
            .sort((a, b) => b.pendiente - a.pendiente)
            .slice(0, 15)
            .map((c) => ({
              id: Number(c.id),
              nombre: c.nombre,
              pagado: c.pagado,
              pendiente: c.pendiente,
            })),
        });
      }

      case "gastos": {
        // Gastos por concepto
        const gastos = await prisma.gasto.findMany({
          where: {
            TenantId: tenantIdBigInt,
            EstaEliminado: false,
            Fecha: {
              gte: fechaDesde,
              lte: fechaHasta,
            },
          },
          include: {
            ConceptoGastos: {
              select: {
                Descripcion: true,
              },
            },
          },
        });

        const gastosAgrupados: Record<string, number> = {};
        gastos.forEach((gasto) => {
          const concepto = gasto.ConceptoGastos.Descripcion;
          gastosAgrupados[concepto] =
            (gastosAgrupados[concepto] || 0) + Number(gasto.Monto);
        });

        return NextResponse.json({
          tipo: "gastos",
          datos: Object.entries(gastosAgrupados)
            .map(([concepto, monto]) => ({
              concepto,
              monto,
            }))
            .sort((a, b) => b.monto - a.monto),
        });
      }

      default:
        return NextResponse.json(
          { error: "Tipo de gráfica no válido" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleError(error);
  }
}

// Helper para obtener número de semana
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
