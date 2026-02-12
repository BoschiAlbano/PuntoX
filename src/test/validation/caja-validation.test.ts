/**
 * Tests de validación de fronteras para caja (abrir/cerrar).
 * Hallazgos en testing/INFORME-VALIDACIONES.md
 */
import { describe, it, expect } from "vitest";
import {
  abrirCajaSchema,
  cerrarCajaSchema,
} from "@/app/api/caja/route";

describe("Caja - abrirCajaSchema", () => {
  it("acepta monto inicial 0", () => {
    const r = abrirCajaSchema.safeParse({ montoInicial: 0 });
    expect(r.success).toBe(true);
  });

  it("acepta monto inicial positivo", () => {
    const r = abrirCajaSchema.safeParse({ montoInicial: 1000 });
    expect(r.success).toBe(true);
  });

  it("debe rechazar monto inicial negativo", () => {
    const r = abrirCajaSchema.safeParse({ montoInicial: -1 });
    expect(r.success).toBe(false);
  });

  /**
   * HALLAZGO: El schema no define máximo. Montos astronómicos son aceptados.
   * Ver INFORME-VALIDACIONES. Cuando se añada .max(...), este test debe pasar.
   */
  it("debe rechazar monto inicial excesivo", () => {
    const r = abrirCajaSchema.safeParse({ montoInicial: 1e12 });
    expect(r.success).toBe(false);
  });
});

describe("Caja - cerrarCajaSchema", () => {
  it("debe rechazar monto de cierre negativo", () => {
    const r = cerrarCajaSchema.safeParse({ montoCierre: -1 });
    expect(r.success).toBe(false);
  });

  it("debe rechazar monto de cierre excesivo", () => {
    const r = cerrarCajaSchema.safeParse({ montoCierre: 1e12 });
    expect(r.success).toBe(false);
  });
});
