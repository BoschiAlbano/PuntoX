/**
 * Tests para schemas y utilidades de comprobantes.
 */
import { describe, it, expect } from "vitest";
import {
  formaPagoSchema,
  detalleComprobanteSchema,
  createComprobanteBaseSchema,
} from "./comprobantes";

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
