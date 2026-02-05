/**
 * Tests para funciones de cálculo de ventas
 */

import { describe, it, expect } from "vitest";
import {
  calcularSubtotal,
  calcularIva,
  calcularTotal,
} from "@/lib/ventas/calculos";

describe("calcularSubtotal", () => {
  it("debe calcular el subtotal correctamente sin descuento", () => {
    const resultado = calcularSubtotal(100, 2);
    expect(resultado).toBe(200); // 100 * 2
  });

  it("debe calcular el subtotal con descuento", () => {
    const resultado = calcularSubtotal(100, 2, 10); // 10% de descuento
    expect(resultado).toBe(180); // 100 * 2 * (1 - 0.10) = 200 * 0.9
  });

  it("debe manejar descuento del 0%", () => {
    const resultado = calcularSubtotal(100, 2, 0);
    expect(resultado).toBe(200);
  });

  it("debe manejar descuento del 100%", () => {
    const resultado = calcularSubtotal(100, 2, 100);
    expect(resultado).toBe(0); // Todo gratis
  });

  it("debe manejar cantidad 0", () => {
    const resultado = calcularSubtotal(100, 0);
    expect(resultado).toBe(0);
  });

  it("debe manejar precio 0", () => {
    const resultado = calcularSubtotal(0, 5);
    expect(resultado).toBe(0);
  });

  it("debe manejar descuentos parciales", () => {
    const resultado = calcularSubtotal(100, 3, 15); // 15% de descuento
    expect(resultado).toBe(255); // 100 * 3 * 0.85 = 255
  });

  it("debe manejar valores decimales", () => {
    const resultado = calcularSubtotal(99.99, 2.5, 5);
    const expected = 99.99 * 2.5 * 0.95;
    expect(resultado).toBeCloseTo(expected, 2);
  });
});

describe("calcularIva", () => {
  it("debe calcular IVA del 21% correctamente", () => {
    const resultado = calcularIva(100, 21);
    expect(resultado).toBe(21); // 100 * 0.21
  });

  it("debe calcular IVA del 10.5% correctamente", () => {
    const resultado = calcularIva(100, 10.5);
    expect(resultado).toBe(10.5); // 100 * 0.105
  });

  it("debe calcular IVA del 0%", () => {
    const resultado = calcularIva(100, 0);
    expect(resultado).toBe(0);
  });

  it("debe manejar subtotal 0", () => {
    const resultado = calcularIva(0, 21);
    expect(resultado).toBe(0);
  });

  it("debe manejar valores decimales", () => {
    const resultado = calcularIva(123.45, 21);
    const expected = 123.45 * 0.21;
    expect(resultado).toBeCloseTo(expected, 2);
  });

  it("debe manejar porcentaje IVA decimal", () => {
    const resultado = calcularIva(100, 10.5);
    expect(resultado).toBe(10.5);
  });
});

describe("calcularTotal", () => {
  it("debe calcular el total correctamente sin descuento", () => {
    const resultado = calcularTotal(100, 21, 10.5, 0);
    expect(resultado).toBe(131.5); // 100 + 21 + 10.5
  });

  it("debe calcular el total con descuento", () => {
    const resultado = calcularTotal(100, 21, 10.5, 10);
    expect(resultado).toBe(121.5); // 100 + 21 + 10.5 - 10
  });

  it("debe manejar solo IVA 21%", () => {
    const resultado = calcularTotal(100, 21, 0, 0);
    expect(resultado).toBe(121);
  });

  it("debe manejar solo IVA 10.5%", () => {
    const resultado = calcularTotal(100, 0, 10.5, 0);
    expect(resultado).toBe(110.5);
  });

  it("debe manejar sin IVA", () => {
    const resultado = calcularTotal(100, 0, 0, 0);
    expect(resultado).toBe(100);
  });

  it("debe aplicar descuento correctamente", () => {
    const resultado = calcularTotal(100, 21, 10.5, 20);
    expect(resultado).toBe(111.5); // 100 + 21 + 10.5 - 20
  });

  it("debe manejar descuento mayor al subtotal (no debería pasar en producción)", () => {
    const resultado = calcularTotal(100, 21, 10.5, 200);
    expect(resultado).toBe(-68.5); // Puede ser negativo, pero la función lo permite
  });

  it("debe manejar valores decimales", () => {
    const resultado = calcularTotal(123.45, 25.92, 12.96, 5.5);
    const expected = 123.45 + 25.92 + 12.96 - 5.5;
    expect(resultado).toBeCloseTo(expected, 2);
  });

  it("debe calcular un caso real completo", () => {
    // Subtotal: 1000
    // IVA 21%: 210
    // IVA 10.5%: 105
    // Descuento: 50
    // Total esperado: 1000 + 210 + 105 - 50 = 1265
    const resultado = calcularTotal(1000, 210, 105, 50);
    expect(resultado).toBe(1265);
  });
});
