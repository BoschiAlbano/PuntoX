/**
 * Tests para productoAdapter y productoListAdapter.
 */
import { describe, it, expect } from "vitest";
import { productoAdapter, productoListAdapter } from "./producto.adapter";

describe("productoAdapter", () => {
  it("adapta un objeto de API al formato Producto", () => {
    const apiData = {
      Id: 1,
      MarcaId: 2,
      RubroId: 3,
      UnidadMedidaId: 1,
      IvaId: 1,
      PrecioId: 1,
      Codigo: 100,
      CodigoBarra: "789123",
      Descripcion: "Producto Test",
      Precio: { PrecioPublico: 100.5, PrecioCosto: 50, PorcentajeGanancia: 10 },
      Stock: 25,
    };
    const result = productoAdapter(apiData);
    expect(result.Id).toBe(1);
    expect(result.Descripcion).toBe("Producto Test");
    expect(result.Precio.PrecioPublico).toBe(100.5);
    expect(result.Stock).toBe(25);
    expect(result.CodigoBarra).toBe("789123");
  });

  it("maneja valores nulos o undefined", () => {
    const result = productoAdapter({ Id: 1 });
    expect(result.CodigoBarra).toBe("");
    expect(result.Descripcion).toBe("");
    expect(result.Stock).toBe(0);
  });
});

describe("productoListAdapter", () => {
  it("adapta un array de productos", () => {
    const apiData = [{ Id: 1, Descripcion: "A" }, { Id: 2, Descripcion: "B" }];
    const result = productoListAdapter(apiData);
    expect(result).toHaveLength(2);
    expect(result[0].Id).toBe(1);
    expect(result[1].Id).toBe(2);
  });

  it("retorna array vacío cuando no es array", () => {
    expect(productoListAdapter(null as any)).toEqual([]);
    expect(productoListAdapter(undefined as any)).toEqual([]);
    expect(productoListAdapter({} as any)).toEqual([]);
  });
});
