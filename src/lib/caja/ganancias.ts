import prisma from "@/DB/prisma";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";

/**
 * Calcula la ganancia de ventas de una caja iterando por sus comprobantes asociados.
 */
export async function calcularGananciaVentasCaja(cajaId: bigint): Promise<number> {
  const comprobantes = await prisma.comprobante.findMany({
    where: {
      Movimiento: { some: { CajaId: cajaId } },
      TipoComprobante: {
        in: [
          TIPO_COMPROBANTE_VENTA.FACTURA_A,
          TIPO_COMPROBANTE_VENTA.FACTURA_B,
          TIPO_COMPROBANTE_VENTA.FACTURA_C,
          TIPO_COMPROBANTE_VENTA.REMITO,
          TIPO_COMPROBANTE_VENTA.NOTA_CREDITO,
        ],
      },
      EstaEliminado: false,
    },
    include: {
      DetalleComprobante: { select: { Costo: true } },
    },
  });

  let gananciaVentas = 0;
  for (const comp of comprobantes) {
    const costoComprobante = comp.DetalleComprobante.reduce(
      (sum, det) => sum + Number(det.Costo || 0),
      0,
    );
    const ingreso = Number(comp.Total) - costoComprobante;

    if (comp.TipoComprobante === TIPO_COMPROBANTE_VENTA.NOTA_CREDITO) {
      gananciaVentas -= ingreso;
    } else {
      gananciaVentas += ingreso;
    }
  }

  return gananciaVentas;
}
