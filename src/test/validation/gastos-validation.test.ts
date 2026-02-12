/**
 * Tests de validación de fronteras para gastos.
 * Hallazgos en testing/INFORME-VALIDACIONES.md
 */
import { describe, it, expect } from "vitest";
import { createGastoSchema } from "@/app/api/gastos/route";

const bodyGastoValido = {
  conceptoGastoId: 1,
  descripcion: "Gasto test",
  pagos: [{ tipoPago: 1, monto: 50 }],
};

describe("Gastos - createGastoSchema", () => {
  it("acepta body válido", () => {
    const r = createGastoSchema.safeParse(bodyGastoValido);
    expect(r.success).toBe(true);
  });

  it("debe rechazar descripción vacía", () => {
    const r = createGastoSchema.safeParse({
      ...bodyGastoValido,
      descripcion: "",
    });
    expect(r.success).toBe(false);
  });

  it("debe rechazar monto de pago menor que 0.01", () => {
    const r = createGastoSchema.safeParse({
      ...bodyGastoValido,
      pagos: [{ tipoPago: 1, monto: 0 }],
    });
    expect(r.success).toBe(false);
  });

  it("debe rechazar array de pagos vacío", () => {
    const r = createGastoSchema.safeParse({
      ...bodyGastoValido,
      pagos: [],
    });
    expect(r.success).toBe(false);
  });

  /**
   * HALLAZGO: El schema no define máximo para monto. Ver INFORME-VALIDACIONES.
   */
  it("debe rechazar monto de pago excesivo", () => {
    const r = createGastoSchema.safeParse({
      ...bodyGastoValido,
      pagos: [{ tipoPago: 1, monto: 1e15 }],
    });
    expect(r.success).toBe(false);
  });
});
