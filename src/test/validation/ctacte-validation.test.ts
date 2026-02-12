/**
 * Tests en el límite — Cta. Cte. cliente (pago).
 * Solo lo necesario para detectar monto sin tope.
 */
import { describe, it, expect } from "vitest";
import { pagoCtaCteSchema } from "@/app/api/CtaCteCliente/route";

const bodyValido = {
  clienteId: 1,
  monto: 100,
  formasPago: [{ tipoPago: 1, monto: 100 }],
};

describe("CtaCte - pagoCtaCteSchema", () => {
  it("acepta body válido", () => {
    const r = pagoCtaCteSchema.safeParse(bodyValido);
    expect(r.success).toBe(true);
  });

  it("debe rechazar monto excesivo", () => {
    const r = pagoCtaCteSchema.safeParse({
      ...bodyValido,
      monto: 1e15,
    });
    expect(r.success).toBe(false);
  });
});
