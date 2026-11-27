/**
 * Reset de tienda: borra TODOS los movimientos de un comercio y deja intactos
 * sus datos maestros. Solo lo ejecuta el superadmin (ver
 * /api/admin/tenants/[id]/reset). Es irreversible.
 *
 * Se borra: comprobantes (ventas, compras, notas de crédito, presupuestos,
 * remitos, cuentas corrientes) con sus detalles y formas de pago, facturas
 * electrónicas (incluidas las autorizadas por ARCA), cajas y sus movimientos,
 * gastos, cheques y depósitos, bajas de artículos y la numeración local.
 * El stock de todos los artículos queda en cero.
 *
 * Se conserva: artículos y precios, clientes, proveedores, empleados y roles,
 * sucursales, configuración, auditoría, notificaciones y sesiones.
 *
 * La numeración de ARCA no se toca: la lleva AFIP (getLastVoucher).
 */
import prisma from "@/DB/prisma";
import type { Prisma } from "../../../prisma/generated/prisma";

export interface ConteoReset {
  comprobantes: number;
  facturasElectronicas: number;
  facturasAutorizadas: number;
  /** Si ARCA está configurado en producción (facturas reales). */
  arcaProduccion: boolean;
  cajas: number;
  gastos: number;
  cheques: number;
  articulosConStock: number;
}

/** Lo que se va a borrar, para mostrar en la confirmación. */
export async function conteoReset(tenantId: bigint): Promise<ConteoReset> {
  const TenantId = tenantId;
  const [
    comprobantes,
    facturasElectronicas,
    facturasAutorizadas,
    config,
    cajas,
    gastos,
    cheques,
    articulosConStock,
  ] = await Promise.all([
    prisma.comprobante.count({ where: { TenantId } }),
    prisma.facturaElectronica.count({ where: { TenantId } }),
    prisma.facturaElectronica.count({ where: { TenantId, Estado: "AUTORIZADO" } }),
    prisma.configuracion.findFirst({
      where: { TenantId, EstaEliminado: false },
      select: { AfipEntornoProduccion: true },
    }),
    prisma.caja.count({ where: { TenantId } }),
    prisma.gasto.count({ where: { TenantId } }),
    prisma.cheque.count({ where: { TenantId } }),
    prisma.articuloStock.count({ where: { TenantId, NOT: { Stock: 0 } } }),
  ]);

  return {
    comprobantes,
    facturasElectronicas,
    facturasAutorizadas,
    arcaProduccion: config?.AfipEntornoProduccion ?? false,
    cajas,
    gastos,
    cheques,
    articulosConStock,
  };
}

export type ResultadoReset = Record<string, number>;

/** Se lanza al final de una simulación para revertir la transacción. */
class SimulacionReset extends Error {
  constructor(public resultado: ResultadoReset) {
    super("SIMULACION_RESET");
  }
}

/**
 * Borra los movimientos del comercio en una sola transacción, de las tablas
 * hijas a las padres (las claves foráneas no tienen borrado en cascada,
 * salvo FacturaElectronicaIva). Si algo falla, no se borra nada.
 *
 * Con `simular: true` ejecuta todo y revierte la transacción al final:
 * devuelve lo que se habría borrado sin tocar nada.
 */
export async function resetearTienda(
  tenantId: bigint,
  { simular = false }: { simular?: boolean } = {},
): Promise<ResultadoReset> {
  const t = tenantId;

  try {
    return await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const r: ResultadoReset = {};

      // Facturas electrónicas (sus alícuotas de IVA se borran en cascada)
      r.facturasElectronicas = await tx.$executeRaw`
        DELETE FROM "FacturaElectronica" WHERE "TenantId" = ${t}`;

      // Formas de pago y sus subtipos (antes que cheques, gastos y comprobantes)
      await tx.$executeRaw`
        DELETE FROM "FormaPago_Cheque" WHERE "Id" IN (SELECT "Id" FROM "FormaPago" WHERE "TenantId" = ${t})`;
      await tx.$executeRaw`
        DELETE FROM "FormaPago_CtaCte" WHERE "Id" IN (SELECT "Id" FROM "FormaPago" WHERE "TenantId" = ${t})`;
      await tx.$executeRaw`
        DELETE FROM "FormaPago_Tarjeta" WHERE "Id" IN (SELECT "Id" FROM "FormaPago" WHERE "TenantId" = ${t})`;
      r.formasPago = await tx.$executeRaw`
        DELETE FROM "FormaPago" WHERE "TenantId" = ${t}`;

      // Cheques y depósitos
      await tx.$executeRaw`DELETE FROM "DepositoCheques" WHERE "TenantId" = ${t}`;
      r.cheques = await tx.$executeRaw`DELETE FROM "Cheque" WHERE "TenantId" = ${t}`;

      // Subtipos de comprobante. Comprobante_CuentaCorriente primero: apunta
      // a Movimiento_CuentaCorriente.
      await tx.$executeRaw`
        DELETE FROM "Comprobante_CuentaCorriente" WHERE "Id" IN (SELECT "Id" FROM "Comprobante" WHERE "TenantId" = ${t})`;
      await tx.$executeRaw`
        DELETE FROM "Comprobante_Compra" WHERE "Id" IN (SELECT "Id" FROM "Comprobante" WHERE "TenantId" = ${t})`;
      await tx.$executeRaw`
        DELETE FROM "Comprobante_CtaCteProveedor" WHERE "Id" IN (SELECT "Id" FROM "Comprobante" WHERE "TenantId" = ${t})`;
      await tx.$executeRaw`
        DELETE FROM "Comprobante_Factura" WHERE "Id" IN (SELECT "Id" FROM "Comprobante" WHERE "TenantId" = ${t})`;
      await tx.$executeRaw`
        DELETE FROM "Comprobante_NotaCredito" WHERE "Id" IN (SELECT "Id" FROM "Comprobante" WHERE "TenantId" = ${t})`;
      await tx.$executeRaw`
        DELETE FROM "Comprobante_Presupuesto" WHERE "Id" IN (SELECT "Id" FROM "Comprobante" WHERE "TenantId" = ${t})`;
      await tx.$executeRaw`
        DELETE FROM "Comprobante_Remito" WHERE "Id" IN (SELECT "Id" FROM "Comprobante" WHERE "TenantId" = ${t})`;

      // Movimientos de cuenta corriente (clientes y proveedores) y de caja
      await tx.$executeRaw`
        DELETE FROM "Movimiento_CuentaCorriente" WHERE "Id" IN (SELECT "Id" FROM "Movimiento" WHERE "TenantId" = ${t})`;
      await tx.$executeRaw`
        DELETE FROM "Movimiento_CuentaCorrienteProveedor" WHERE "Id" IN (SELECT "Id" FROM "Movimiento" WHERE "TenantId" = ${t})`;
      r.movimientos = await tx.$executeRaw`DELETE FROM "Movimiento" WHERE "TenantId" = ${t}`;

      // Comprobantes y sus líneas
      await tx.$executeRaw`DELETE FROM "DetalleComprobante" WHERE "TenantId" = ${t}`;
      r.gastos = await tx.$executeRaw`DELETE FROM "Gasto" WHERE "TenantId" = ${t}`;
      r.comprobantes = await tx.$executeRaw`DELETE FROM "Comprobante" WHERE "TenantId" = ${t}`;

      // Cajas
      await tx.$executeRaw`DELETE FROM "DetalleCaja" WHERE "TenantId" = ${t}`;
      r.cajas = await tx.$executeRaw`DELETE FROM "Caja" WHERE "TenantId" = ${t}`;

      // Bajas de artículos, stock y numeración local
      r.bajasArticulo = await tx.$executeRaw`DELETE FROM "BajaArticulo" WHERE "TenantId" = ${t}`;
      r.articulosStockEnCero = await tx.$executeRaw`
        UPDATE "ArticuloStock" SET "Stock" = 0, "FechaActualizacion" = now() WHERE "TenantId" = ${t}`;
      // Stock global (deprecado, ver ArticuloStock): también a cero
      await tx.$executeRaw`UPDATE "Articulo" SET "Stock" = 0 WHERE "TenantId" = ${t}`;
      r.contadores = await tx.$executeRaw`DELETE FROM "Contador" WHERE "TenantId" = ${t}`;

      // Simulación: se revierte todo y se devuelve lo que se habría borrado
      if (simular) throw new SimulacionReset(r);
      return r;
    },
    { timeout: 60_000, maxWait: 10_000 },
    );
  } catch (error) {
    if (error instanceof SimulacionReset) return error.resultado;
    throw error;
  }
}
