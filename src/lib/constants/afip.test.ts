/**
 * Tests para los helpers de mapeo AFIP en lib/constants/afip.
 */
import { describe, it, expect } from "vitest";
import {
  requiereAutorizacionAfip,
  getCbteTipoNotaCredito,
  CBTE_TIPO_AFIP,
} from "./afip";

describe("requiereAutorizacionAfip", () => {
  it("retorna true para Factura A/B/C", () => {
    expect(requiereAutorizacionAfip(1)).toBe(true);
    expect(requiereAutorizacionAfip(2)).toBe(true);
    expect(requiereAutorizacionAfip(3)).toBe(true);
  });

  it("retorna true para Nota de Crédito", () => {
    expect(requiereAutorizacionAfip(6)).toBe(true);
  });

  it("retorna false para Presupuesto y Remito", () => {
    expect(requiereAutorizacionAfip(4)).toBe(false);
    expect(requiereAutorizacionAfip(5)).toBe(false);
  });
});

describe("getCbteTipoNotaCredito", () => {
  it("mapea Factura A (1) a Nota de Crédito A (3)", () => {
    expect(getCbteTipoNotaCredito(1)).toBe(CBTE_TIPO_AFIP.NOTA_CREDITO_A);
  });

  it("mapea Factura B (2) a Nota de Crédito B (8)", () => {
    expect(getCbteTipoNotaCredito(2)).toBe(CBTE_TIPO_AFIP.NOTA_CREDITO_B);
  });

  it("mapea Factura C (3) a Nota de Crédito C (13)", () => {
    expect(getCbteTipoNotaCredito(3)).toBe(CBTE_TIPO_AFIP.NOTA_CREDITO_C);
  });

  it("retorna null para tipos que no son Factura A/B/C", () => {
    expect(getCbteTipoNotaCredito(4)).toBeNull(); // Presupuesto
    expect(getCbteTipoNotaCredito(5)).toBeNull(); // Remito
    expect(getCbteTipoNotaCredito(6)).toBeNull(); // Nota de Crédito (no puede acreditar otra NC)
  });
});
