/**
 * Tests para parseScaleBarcode (códigos EAN-13 de balanza).
 */
import { describe, it, expect } from "vitest";
import { parseScaleBarcode } from "./barcode";

describe("parseScaleBarcode", () => {
  it("retorna null cuando config.active es false", () => {
    const result = parseScaleBarcode("2000001005001", {
      active: false,
      prefix: "20",
      isWeight: false,
    });
    expect(result).toBeNull();
  });

  it("retorna null cuando el barcode no tiene 13 caracteres", () => {
    const result = parseScaleBarcode("12345", {
      active: true,
      prefix: "20",
      isWeight: false,
    });
    expect(result).toBeNull();
  });

  it("retorna null cuando el barcode no empieza con el prefijo", () => {
    const result = parseScaleBarcode("3000001005001", {
      active: true,
      prefix: "20",
      isWeight: false,
    });
    expect(result).toBeNull();
  });

  it("retorna null cuando el dígito verificador es inválido", () => {
    const result = parseScaleBarcode("2000001005009", {
      active: true,
      prefix: "20",
      isWeight: false,
    });
    expect(result).toBeNull();
  });

  it("parsea correctamente un código de precio (venta por unidad)", () => {
    const result = parseScaleBarcode("2000001005002", {
      active: true,
      prefix: "20",
      isWeight: false,
    });
    expect(result).not.toBeNull();
    expect(result!.plu).toBe("00001");
    expect(result!.value).toBe(5); // 00500 / 100 = 5.00
    expect(result!.type).toBe("price");
    expect(result!.originalBarcode).toBe("2000001005002");
  });

  it("parsea correctamente un código de peso", () => {
    const result = parseScaleBarcode("2000002015000", {
      active: true,
      prefix: "20",
      isWeight: true,
    });
    expect(result).not.toBeNull();
    expect(result!.plu).toBe("00002");
    expect(result!.value).toBe(1.5); // 01500 / 1000 = 1.5 kg
    expect(result!.type).toBe("weight");
  });
});
