/**
 * Tests para validaciones de productos
 */

import { describe, it, expect } from "vitest";
import {
  createProductoSchema,
  updateProductoSchema,
} from "@/lib/validations/producto.schema";
import { TiposVenta } from "../../prisma/generated/prisma";
import { createMockProducto } from "../utils/mocks";

describe("createProductoSchema", () => {
  it("debe validar un producto correcto", () => {
    const producto = createMockProducto();
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.Descripcion).toBe("Producto de prueba");
      expect(result.data.Codigo).toBe(12345);
    }
  });

  it("debe rechazar cuando falta Descripcion", () => {
    const producto = createMockProducto({ Descripcion: "" });
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Descripcion");
    }
  });

  it("debe rechazar cuando Descripcion excede 250 caracteres", () => {
    const producto = createMockProducto({
      Descripcion: "a".repeat(251),
    });
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(false);
    if (!result.success) {
      const descError = result.error.issues.find(
        (issue) => issue.path[0] === "Descripcion"
      );
      expect(descError).toBeDefined();
    }
  });

  it("debe rechazar cuando falta CodigoBarra", () => {
    const producto = createMockProducto({ CodigoBarra: "" });
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("CodigoBarra");
    }
  });

  it("debe rechazar cuando CodigoBarra excede 100 caracteres", () => {
    const producto = createMockProducto({
      CodigoBarra: "a".repeat(101),
    });
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando Codigo no es un entero", () => {
    const producto = createMockProducto({ Codigo: 123.45 });
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando MarcaId no es un entero", () => {
    const producto = createMockProducto({ MarcaId: 1.5 });
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(false);
  });

  it("debe aceptar valores opcionales como null", () => {
    const producto = createMockProducto({
      Abreviatura: null,
      Detalle: null,
      Ubicacion: null,
      HoraLimiteVentaDesde: null,
      HoraLimiteVentaHasta: null,
    });
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(true);
  });

  it("debe aplicar valores por defecto", () => {
    const producto = {
      MarcaId: 1,
      RubroId: 1,
      UnidadMedidaId: 1,
      IvaId: 1,
      Codigo: 123,
      CodigoBarra: "123456789",
      Descripcion: "Producto",
      Precio: {
        PrecioCosto: 100,
        PorcentajeGanancia: 30,
        PrecioPublico: 130,
        PorcentajeGanancia2: 25,
        PrecioPublico2: 125,
      },
    };

    const result = createProductoSchema.parse(producto);

    expect(result.ActivarLimiteVenta).toBe(false);
    expect(result.LimiteVenta).toBe(0);
    expect(result.PermiteStockNegativo).toBe(false);
    expect(result.DescuentaStock).toBe(true);
    expect(result.StockMinimo).toBe(0);
    expect(result.TipoVenta).toBe(TiposVenta.UNIDAD);
  });

  it("debe validar el objeto Precio correctamente", () => {
    const producto = createMockProducto({
      Precio: {
        PrecioCosto: 100,
        PorcentajeGanancia: 30,
        PrecioPublico: 130,
        PorcentajeGanancia2: 25,
        PrecioPublico2: 125,
      },
    });
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando PrecioCosto es negativo", () => {
    const producto = createMockProducto({
      Precio: {
        PrecioCosto: -10,
        PorcentajeGanancia: 30,
        PrecioPublico: 130,
        PorcentajeGanancia2: 25,
        PrecioPublico2: 125,
      },
    });
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando falta el objeto Precio", () => {
    const producto: any = createMockProducto();
    delete producto.Precio;
    const result = createProductoSchema.safeParse(producto);

    expect(result.success).toBe(false);
  });
});

describe("updateProductoSchema", () => {
  it("debe validar una actualización correcta con Id", () => {
    const producto = {
      Id: 1,
      Descripcion: "Producto actualizado",
    };
    const result = updateProductoSchema.safeParse(producto);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando falta Id", () => {
    const producto = {
      Descripcion: "Producto actualizado",
    };
    const result = updateProductoSchema.safeParse(producto);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Id");
    }
  });

  it("debe permitir actualizar solo algunos campos", () => {
    const producto = {
      Id: 1,
      Descripcion: "Nueva descripción",
      Stock: 50,
    };
    const result = updateProductoSchema.safeParse(producto);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando Descripcion está vacía en update", () => {
    const producto = {
      Id: 1,
      Descripcion: "",
    };
    const result = updateProductoSchema.safeParse(producto);

    expect(result.success).toBe(false);
  });

  it("debe validar campos opcionales en update", () => {
    const producto = {
      Id: 1,
      Codigo: 999,
      CodigoBarra: "999999999",
      Descripcion: "Producto",
    };
    const result = updateProductoSchema.safeParse(producto);

    expect(result.success).toBe(true);
  });
});
