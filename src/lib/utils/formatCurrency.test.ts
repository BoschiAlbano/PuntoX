import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyCompact,
  getCurrencyFormatOptions,
  getCurrencySymbol,
} from "./formatCurrency";

describe("formatCurrency", () => {
  it("formatea con ARS por defecto", () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain("1.234");
    expect(result).toContain("50");
    expect(result).toMatch(/\$|ARS|peso/i);
  });

  it("formatea con USD cuando se especifica", () => {
    const result = formatCurrency(100, "USD");
    expect(result).toContain("100");
    expect(result).toMatch(/\$|USD|dólar/i);
  });

  it("formatea con EUR cuando se especifica", () => {
    const result = formatCurrency(50.99, "EUR");
    expect(result).toContain("50");
    expect(result).toContain("99");
  });

  it("maneja cero", () => {
    const result = formatCurrency(0);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatCurrencyCompact", () => {
  it("formatea números grandes en notación compacta", () => {
    const result = formatCurrencyCompact(1500, "ARS");
    expect(result).toBeDefined();
    expect(result.length).toBeLessThan(20);
  });
});

describe("getCurrencyFormatOptions", () => {
  it("retorna opciones para HeroUI NumberInput", () => {
    const opts = getCurrencyFormatOptions("ARS");
    expect(opts).toEqual({
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  });

  it("usa ARS por defecto", () => {
    const opts = getCurrencyFormatOptions();
    expect(opts.currency).toBe("ARS");
  });
});

describe("getCurrencySymbol", () => {
  it("retorna $ para ARS", () => {
    expect(getCurrencySymbol("ARS")).toBe("$");
  });

  it("retorna símbolo definido para USD", () => {
    const sym = getCurrencySymbol("USD");
    expect(sym).toBeDefined();
    expect(sym.length).toBeGreaterThan(0);
  });
});
