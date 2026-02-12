/**
 * Tests de validación de fronteras para comprobantes (ventas).
 * Objetivo: detectar valores inválidos que el schema acepta.
 * Hallazgos se documentan en testing/INFORME-VALIDACIONES.md
 */
import { describe, it, expect } from "vitest";
import {
  createComprobanteBaseSchema,
  detalleComprobanteSchema,
  formaPagoSchema,
} from "@/lib/services/comprobantes";

const detalleValido = {
  articuloId: 1,
  codigo: "ART01",
  descripcion: "Producto test",
  cantidad: 1,
  precio: 100,
  iva: 21,
  subtotal: 100,
};

const formaPagoValida = { tipoPago: 1, monto: 100 };

function bodyComprobanteValido(overrides: Record<string, unknown> = {}) {
  return {
    tipoComprobante: 1,
    clienteId: 0,
    detalles: [detalleValido],
    formasPago: [formaPagoValida],
    ...overrides,
  };
}

describe("Comprobantes - createComprobanteBaseSchema", () => {
  it("acepta body válido mínimo", () => {
    const r = createComprobanteBaseSchema.safeParse(bodyComprobanteValido());
    expect(r.success).toBe(true);
  });

  it("debe rechazar descuento negativo", () => {
    const r = createComprobanteBaseSchema.safeParse(
      bodyComprobanteValido({ descuento: -1 })
    );
    expect(r.success).toBe(false);
  });

  /**
   * HALLAZGO (INFORME-VALIDACIONES): El schema solo exige descuento >= 0.
   * No valida que descuento <= subtotal ni tope de porcentaje.
   * Cuando se añada refinamiento (p. ej. descuento <= sum(detalles.subtotal)), este test debe pasar.
   */
  it("debe rechazar descuento mayor que el subtotal (o monto excesivo)", () => {
    const body = bodyComprobanteValido({ descuento: 999999 });
    const r = createComprobanteBaseSchema.safeParse(body);
    expect(r.success).toBe(false);
  });

  it("debe rechazar cantidad cero en detalle", () => {
    const r = createComprobanteBaseSchema.safeParse(
      bodyComprobanteValido({
        detalles: [{ ...detalleValido, cantidad: 0 }],
      })
    );
    expect(r.success).toBe(false);
  });

  it("debe rechazar precio negativo en detalle", () => {
    const r = createComprobanteBaseSchema.safeParse(
      bodyComprobanteValido({
        detalles: [{ ...detalleValido, precio: -10 }],
      })
    );
    expect(r.success).toBe(false);
  });

  it("debe rechazar monto de pago cero o negativo", () => {
    const r = createComprobanteBaseSchema.safeParse(
      bodyComprobanteValido({
        formasPago: [{ tipoPago: 1, monto: 0 }],
      })
    );
    expect(r.success).toBe(false);
  });
});

describe("Comprobantes - formaPagoSchema", () => {
  it("debe rechazar monto negativo", () => {
    const r = formaPagoSchema.safeParse({ tipoPago: 1, monto: -1 });
    expect(r.success).toBe(false);
  });
});

describe("Comprobantes - detalleComprobanteSchema", () => {
  it("debe rechazar subtotal negativo", () => {
    const r = detalleComprobanteSchema.safeParse({
      ...detalleValido,
      subtotal: -1,
    });
    expect(r.success).toBe(false);
  });
});
