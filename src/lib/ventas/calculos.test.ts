/**
 * Tests para las funciones de cálculo de ventas
 */
import { describe, it, expect } from "vitest";
import {
  calcularSubtotal,
  calcularIva,
  calcularTotal,
} from "./calculos";

describe("calculos - calcularSubtotal", () => {
  it("calcula subtotal sin descuento", () => {
    expect(calcularSubtotal(100, 2)).toBe(200);
    expect(calcularSubtotal(50, 3)).toBe(150);
  });

  it("calcula subtotal con descuento", () => {
    expect(calcularSubtotal(100, 2, 10)).toBe(180); // 200 * 0.9
    expect(calcularSubtotal(100, 1, 50)).toBe(50);
  });

  it("descuento 0% es igual a sin descuento", () => {
    expect(calcularSubtotal(100, 2, 0)).toBe(200);
  });
});

describe("calculos - calcularIva", () => {
  it("calcula IVA al 21%", () => {
    expect(calcularIva(100, 21)).toBe(21);
    expect(calcularIva(1000, 21)).toBe(210);
  });

  it("calcula IVA al 10.5%", () => {
    expect(calcularIva(100, 10.5)).toBe(10.5);
  });

  it("calcula IVA al 0%", () => {
    expect(calcularIva(100, 0)).toBe(0);
  });
});

describe("calculos - calcularTotal", () => {
  it("suma subtotal e IVAs y resta descuento", () => {
    const subtotal = 100;
    const iva21 = 21;
    const iva105 = 10.5;
    expect(calcularTotal(subtotal, iva21, iva105)).toBe(131.5);
  });

  it("aplica descuento cuando se pasa", () => {
    expect(calcularTotal(100, 21, 0, 10)).toBe(111); // 100+21-10
  });

  it("descuento 0 no modifica el total", () => {
    expect(calcularTotal(100, 21, 10.5, 0)).toBe(131.5);
  });
});
