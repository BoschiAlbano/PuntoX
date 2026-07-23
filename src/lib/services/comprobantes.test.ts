/**
 * Tests para schemas y utilidades de comprobantes.
 */
import { describe, it, expect, vi } from "vitest";
import {
  formaPagoSchema,
  detalleComprobanteSchema,
  createComprobanteBaseSchema,
  createPresupuesto,
  createRemito,
  createFacturaC,
  type CreateComprobanteData,
  type TransactionClient,
} from "./comprobantes";
import { TIPO_COMPROBANTE_VENTA, TIPO_PAGO } from "@/lib/constants/comprobantes";

describe("formaPagoSchema", () => {
  it("acepta forma de pago efectivo válida", () => {
    const r = formaPagoSchema.safeParse({
      tipoPago: 1,
      monto: 100,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza monto cero o negativo", () => {
    const r = formaPagoSchema.safeParse({
      tipoPago: 1,
      monto: 0,
    });
    expect(r.success).toBe(false);
  });

  it("rechaza tipoPago fuera de rango", () => {
    const r = formaPagoSchema.safeParse({
      tipoPago: 10,
      monto: 100,
    });
    expect(r.success).toBe(false);
  });
});

describe("detalleComprobanteSchema", () => {
  it("acepta detalle válido", () => {
    const r = detalleComprobanteSchema.safeParse({
      articuloId: 1,
      codigo: "001",
      descripcion: "Producto",
      cantidad: 2,
      precio: 100,
      iva: 21,
      subtotal: 200,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza cantidad negativa", () => {
    const r = detalleComprobanteSchema.safeParse({
      articuloId: 1,
      codigo: "001",
      descripcion: "Producto",
      cantidad: -1,
      precio: 100,
      iva: 21,
      subtotal: -100,
    });
    expect(r.success).toBe(false);
  });
});

describe("createComprobanteBaseSchema", () => {
  const baseDetalle = {
    articuloId: 1,
    codigo: "001",
    descripcion: "Producto",
    cantidad: 1,
    precio: 100,
    iva: 21,
    subtotal: 100,
  };
  const baseFormaPago = { tipoPago: 1, monto: 100 };

  it("acepta comprobante válido", () => {
    const r = createComprobanteBaseSchema.safeParse({
      tipoComprobante: 1,
      detalles: [baseDetalle],
      formasPago: [baseFormaPago],
    });
    expect(r.success).toBe(true);
  });

  it("rechaza cuando descuento mayor que subtotal", () => {
    const r = createComprobanteBaseSchema.safeParse({
      tipoComprobante: 1,
      descuento: 200,
      detalles: [baseDetalle],
      formasPago: [baseFormaPago],
    });
    expect(r.success).toBe(false);
  });

  it("rechaza detalles vacíos", () => {
    const r = createComprobanteBaseSchema.safeParse({
      tipoComprobante: 1,
      detalles: [],
      formasPago: [baseFormaPago],
    });
    expect(r.success).toBe(false);
  });

  it("rechaza formasPago vacías", () => {
    const r = createComprobanteBaseSchema.safeParse({
      tipoComprobante: 1,
      detalles: [baseDetalle],
      formasPago: [],
    });
    expect(r.success).toBe(false);
  });
});

/**
 * Presupuesto y Remito no representan un cobro real: deben generar un
 * Movimiento (para verse en la grilla de Caja Actual) pero NO deben sumar a
 * los totales de caja ni a DetalleCaja, a diferencia de una Factura.
 */
function createMockTx() {
  return {
    comprobante: {
      create: vi.fn().mockResolvedValue({ Id: 1n, Total: 100 }),
      update: vi.fn().mockResolvedValue({}),
    },
    articulo: { findMany: vi.fn().mockResolvedValue([]) },
    detalleComprobante: { create: vi.fn().mockResolvedValue({}) },
    formaPago: { create: vi.fn().mockResolvedValue({ Id: 1n }) },
    movimiento: { create: vi.fn().mockResolvedValue({ Id: 1n }) },
    caja: { update: vi.fn().mockResolvedValue({}) },
    detalleCaja: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
    comprobante_Presupuesto: { create: vi.fn().mockResolvedValue({}) },
    comprobante_Remito: { create: vi.fn().mockResolvedValue({}) },
    comprobante_Factura: { create: vi.fn().mockResolvedValue({}) },
  } as unknown as TransactionClient;
}

function baseData(
  tipoComprobante: number,
): CreateComprobanteData {
  return {
    tipoComprobante,
    descuento: 0,
    detalles: [
      {
        articuloId: 1,
        codigo: "001",
        descripcion: "Producto",
        cantidad: 1,
        precio: 100,
        iva: 21,
        subtotal: 100,
        costo: 0,
      },
    ],
    formasPago: [{ tipoPago: TIPO_PAGO.EFECTIVO, monto: 100 }],
  };
}

describe("Movimiento de caja por tipo de comprobante", () => {
  it("Presupuesto crea Movimiento pero NO afecta totales de caja", async () => {
    const tx = createMockTx();
    await createPresupuesto(
      tx,
      baseData(TIPO_COMPROBANTE_VENTA.PRESUPUESTO),
      1n,
      1n,
      1n,
      1,
      1,
      false,
      1n,
      10n, // cajaId
    );
    expect((tx as any).movimiento.create).toHaveBeenCalledTimes(1);
    expect((tx as any).caja.update).not.toHaveBeenCalled();
    expect((tx as any).detalleCaja.create).not.toHaveBeenCalled();
  });

  it("Remito crea Movimiento pero NO afecta totales de caja", async () => {
    const tx = createMockTx();
    await createRemito(
      tx,
      baseData(TIPO_COMPROBANTE_VENTA.REMITO),
      1n,
      1n,
      1n,
      1,
      1,
      false,
      1n,
      10n, // cajaId
    );
    expect((tx as any).movimiento.create).toHaveBeenCalledTimes(1);
    expect((tx as any).caja.update).not.toHaveBeenCalled();
    expect((tx as any).detalleCaja.create).not.toHaveBeenCalled();
  });

  it("Factura C sí afecta los totales de caja (comportamiento sin cambios)", async () => {
    const tx = createMockTx();
    await createFacturaC(
      tx,
      baseData(TIPO_COMPROBANTE_VENTA.FACTURA_C),
      1n,
      1n,
      1n,
      1,
      1,
      false,
      1n,
      10n, // cajaId
      false, // esDiferido
    );
    expect((tx as any).movimiento.create).toHaveBeenCalledTimes(1);
    expect((tx as any).caja.update).toHaveBeenCalledTimes(1);
    expect((tx as any).detalleCaja.create).toHaveBeenCalledTimes(1);
  });
});
