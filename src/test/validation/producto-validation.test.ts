/**
 * Tests en el límite — Productos (precios, stock).
 * Mínimo necesario para detectar valores inválidos.
 */
import { describe, it, expect } from "vitest";
import { createProductoSchema } from "@/lib/validations/producto.schema";

// Precios: PrecioCosto en el artículo + un precio final por lista (PreciosLista).
// Reemplaza al antiguo objeto único "Precio" { PrecioCosto, PrecioPublico, ... }.
const productoValido = {
  MarcaId: 1,
  RubroId: 1,
  UnidadMedidaId: 1,
  IvaId: 1,
  Codigo: 1,
  CodigoBarra: "789000000001",
  Descripcion: "Producto test",
  PrecioCosto: 10,
  PreciosLista: [{ ListaPrecioId: 1, PorcentajeGanancia: 21, PrecioFinal: 12.1 }],
};

describe("Producto - createProductoSchema", () => {
  it("acepta body válido", () => {
    const r = createProductoSchema.safeParse(productoValido);
    expect(r.success).toBe(true);
  });

  it("debe rechazar PrecioFinal negativo en una lista de precios", () => {
    const r = createProductoSchema.safeParse({
      ...productoValido,
      PreciosLista: [{ ...productoValido.PreciosLista[0], PrecioFinal: -1 }],
    });
    expect(r.success).toBe(false);
  });

  it("debe rechazar PorcentajeGanancia negativo", () => {
    const r = createProductoSchema.safeParse({
      ...productoValido,
      PreciosLista: [{ ...productoValido.PreciosLista[0], PorcentajeGanancia: -5 }],
    });
    expect(r.success).toBe(false);
  });

  it("debe rechazar PrecioCosto negativo", () => {
    const r = createProductoSchema.safeParse({
      ...productoValido,
      PrecioCosto: -1,
    });
    expect(r.success).toBe(false);
  });
});
