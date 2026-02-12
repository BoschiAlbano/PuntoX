/**
 * Tests en el límite — Productos (precios, stock).
 * Mínimo necesario para detectar valores inválidos.
 */
import { describe, it, expect } from "vitest";
import { createProductoSchema } from "@/lib/validations/producto.schema";

const productoValido = {
  MarcaId: 1,
  RubroId: 1,
  UnidadMedidaId: 1,
  IvaId: 1,
  Codigo: 1,
  CodigoBarra: "789000000001",
  Descripcion: "Producto test",
  Precio: {
    PrecioCosto: 10,
    PorcentajeGanancia: 21,
    PrecioPublico: 12.1,
    PorcentajeGanancia2: 0,
    PrecioPublico2: 0,
  },
};

describe("Producto - createProductoSchema", () => {
  it("acepta body válido", () => {
    const r = createProductoSchema.safeParse(productoValido);
    expect(r.success).toBe(true);
  });

  it("debe rechazar PrecioPublico negativo", () => {
    const r = createProductoSchema.safeParse({
      ...productoValido,
      Precio: {
        ...productoValido.Precio,
        PrecioPublico: -1,
      },
    });
    expect(r.success).toBe(false);
  });

  it("debe rechazar PrecioCosto negativo", () => {
    const r = createProductoSchema.safeParse({
      ...productoValido,
      Precio: {
        ...productoValido.Precio,
        PrecioCosto: -1,
      },
    });
    expect(r.success).toBe(false);
  });
});
