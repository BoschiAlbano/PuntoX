/**
 * Tests para cálculos de ventas
 */
import { describe, it, expect } from "vitest";

/**
 * Calcula el subtotal de un producto
 */
export function calcularSubtotal(
  precio: number,
  cantidad: number,
  descuento: number = 0
): number {
  return precio * cantidad * (1 - descuento / 100);
}

/**
 * Calcula el IVA de un subtotal
 */
export function calcularIva(subtotal: number, porcentajeIva: number): number {
  return subtotal * (porcentajeIva / 100);
}

/**
 * Calcula el total de una venta
 */
export function calcularTotal(
  subtotal: number,
  iva21: number,
  iva105: number,
  descuento: number = 0
): number {
  return subtotal + iva21 + iva105 - descuento;
}

describe("Cálculos de ventas", () => {
  describe("calcularSubtotal", () => {
    it("debe calcular el subtotal correctamente sin descuento", () => {
      const resultado = calcularSubtotal(100, 2);
      expect(resultado).toBe(200);
    });

    it("debe calcular el subtotal correctamente con descuento", () => {
      const resultado = calcularSubtotal(100, 2, 10);
      expect(resultado).toBe(180); // 200 * 0.9
    });

    it("debe manejar cantidades decimales", () => {
      const resultado = calcularSubtotal(100.5, 1.5);
      expect(resultado).toBe(150.75);
    });
  });

  describe("calcularIva", () => {
    it("debe calcular IVA 21% correctamente", () => {
      const resultado = calcularIva(100, 21);
      expect(resultado).toBe(21);
    });

    it("debe calcular IVA 10.5% correctamente", () => {
      const resultado = calcularIva(100, 10.5);
      expect(resultado).toBe(10.5);
    });

    it("debe manejar IVA 0%", () => {
      const resultado = calcularIva(100, 0);
      expect(resultado).toBe(0);
    });
  });

  describe("calcularTotal", () => {
    it("debe calcular el total correctamente sin descuento", () => {
      const resultado = calcularTotal(100, 21, 0);
      expect(resultado).toBe(121);
    });

    it("debe calcular el total correctamente con descuento", () => {
      const resultado = calcularTotal(100, 21, 0, 10);
      expect(resultado).toBe(111);
    });

    it("debe manejar múltiples IVAs", () => {
      const resultado = calcularTotal(200, 21, 10.5);
      expect(resultado).toBe(231.5);
    });

    it("debe manejar casos con todos los parámetros", () => {
      const subtotal = 1000;
      const iva21 = calcularIva(800, 21); // 168
      const iva105 = calcularIva(200, 10.5); // 21
      const descuento = 50;
      
      const resultado = calcularTotal(subtotal, iva21, iva105, descuento);
      expect(resultado).toBe(1139); // 1000 + 168 + 21 - 50
    });
  });

  describe("Escenarios completos de venta", () => {
    it("debe calcular correctamente una venta completa", () => {
      // Producto 1: $100 x 2 unidades, IVA 21%, sin descuento
      const producto1Subtotal = calcularSubtotal(100, 2);
      const producto1Iva = calcularIva(producto1Subtotal, 21);

      // Producto 2: $50 x 3 unidades, IVA 10.5%, 5% descuento
      const producto2Subtotal = calcularSubtotal(50, 3, 5);
      const producto2Iva = calcularIva(producto2Subtotal, 10.5);

      const subtotalTotal = producto1Subtotal + producto2Subtotal;
      const ivaTotal = producto1Iva + producto2Iva;
      const total = subtotalTotal + ivaTotal;

      expect(producto1Subtotal).toBe(200);
      expect(producto1Iva).toBe(42);
      expect(producto2Subtotal).toBe(142.5);
      expect(producto2Iva).toBeCloseTo(14.9625, 2);
      expect(total).toBeCloseTo(399.4625, 2);
    });
  });
});

