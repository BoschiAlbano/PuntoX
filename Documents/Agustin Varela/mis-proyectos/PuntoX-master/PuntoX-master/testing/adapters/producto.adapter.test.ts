/**
 * Tests para el adapter de productos
 */
import { describe, it, expect } from "vitest";
import { productoAdapter, productoListAdapter } from "@/lib/adapters/producto.adapter";

describe("productoAdapter", () => {
  it("debe adaptar correctamente un producto completo", () => {
    const data = {
      Id: "1",
      MarcaId: "2",
      RubroId: "3",
      UnidadMedidaId: "4",
      IvaId: "5",
      PrecioId: "6",
      Codigo: "12345",
      CodigoBarra: "1234567890123",
      Abreviatura: "PROD",
      Descripcion: "Producto de prueba",
      Detalle: "Detalle del producto",
      Ubicacion: "A1-B2",
      Foto: "base64image",
      ActivarLimiteVenta: true,
      LimiteVenta: "10",
      ActivarHoraVenta: false,
      HoraLimiteVentaDesde: "08:00",
      HoraLimiteVentaHasta: "18:00",
      PermiteStockNegativo: false,
      DescuentaStock: true,
      StockMinimo: "5",
      VencimientoDias: "30",
      TipoVenta: "UNIDAD",
      EstaEliminado: false,
      Precio: {
        PorcentajeGanancia: "25.5",
        PorcentajeGanancia2: "20",
        PrecioPublico: "100.50",
        PrecioPublico2: "95.00",
        PrecioCosto: "80",
      },
      Stock: "50",
      SucursalNombre: "Sucursal Central",
      Iva: {
        Id: "5",
        Porcentaje: "21",
        Descripcion: "IVA 21%",
      },
    };

    const result = productoAdapter(data);

    expect(result.Id).toBe(1);
    expect(result.MarcaId).toBe(2);
    expect(result.RubroId).toBe(3);
    expect(result.CodigoBarra).toBe("1234567890123");
    expect(result.Descripcion).toBe("Producto de prueba");
    expect(result.ActivarLimiteVenta).toBe(true);
    expect(result.LimiteVenta).toBe(10);
    expect(result.Precio.PrecioPublico).toBe(100.5);
    expect(result.Stock).toBe(50);
    expect(result.Iva.Porcentaje).toBe(21);
  });

  it("debe usar valores por defecto cuando faltan campos opcionales", () => {
    const data = {
      Id: "1",
      MarcaId: "2",
      RubroId: "3",
      UnidadMedidaId: "4",
      IvaId: "5",
      Codigo: "12345",
      CodigoBarra: "1234567890123",
      Descripcion: "Producto básico",
      TipoVenta: "UNIDAD",
    };

    const result = productoAdapter(data);

    expect(result.Abreviatura).toBe("");
    expect(result.Detalle).toBe("");
    expect(result.Ubicacion).toBe("");
    expect(result.Foto).toBeUndefined();
    expect(result.ActivarLimiteVenta).toBe(false);
    expect(result.LimiteVenta).toBeNaN(); // Number(undefined) = NaN
    expect(result.HoraLimiteVentaDesde).toBe("00:00");
    expect(result.HoraLimiteVentaHasta).toBe("23:59");
    expect(result.Precio.PrecioPublico).toBe(0);
    expect(result.Stock).toBe(0);
  });

  it("debe manejar valores null y undefined correctamente", () => {
    const data = {
      Id: "1",
      MarcaId: "2",
      RubroId: "3",
      UnidadMedidaId: "4",
      IvaId: "5",
      Codigo: "12345",
      CodigoBarra: "1234567890123",
      Descripcion: "Producto",
      TipoVenta: "UNIDAD",
      Abreviatura: null,
      Detalle: undefined,
      Foto: null,
      Precio: null,
      Iva: undefined,
    };

    const result = productoAdapter(data);

    expect(result.Abreviatura).toBe("");
    expect(result.Detalle).toBe("");
    expect(result.Foto).toBeUndefined();
    expect(result.Precio.PrecioPublico).toBe(0);
    expect(result.Iva.Porcentaje).toBe(0);
  });

  it("debe convertir strings a números correctamente", () => {
    const data = {
      Id: "999",
      MarcaId: "888",
      Codigo: "777",
      CodigoBarra: "123",
      Descripcion: "Test",
      TipoVenta: "UNIDAD",
      LimiteVenta: "123.45",
      Stock: "456.78",
    };

    const result = productoAdapter(data);

    expect(result.Id).toBe(999);
    expect(result.MarcaId).toBe(888);
    expect(result.Codigo).toBe(777);
    expect(result.LimiteVenta).toBe(123.45);
    expect(result.Stock).toBe(456.78);
  });

  it("debe manejar valores booleanos correctamente", () => {
    const data = {
      Id: "1",
      MarcaId: "2",
      RubroId: "3",
      UnidadMedidaId: "4",
      IvaId: "5",
      Codigo: "12345",
      CodigoBarra: "123",
      Descripcion: "Test",
      TipoVenta: "UNIDAD",
      ActivarLimiteVenta: "true",
      PermiteStockNegativo: 1,
      DescuentaStock: "false",
      EstaEliminado: 0,
    };

    const result = productoAdapter(data);

    expect(result.ActivarLimiteVenta).toBe(true); // Boolean("true") = true
    expect(result.PermiteStockNegativo).toBe(true); // Boolean(1) = true
    expect(result.DescuentaStock).toBe(true); // Boolean("false") = true (string no vacío)
    expect(result.EstaEliminado).toBe(false); // Boolean(0) = false
  });
});

describe("productoListAdapter", () => {
  it("debe adaptar un array de productos", () => {
    const data = [
      {
        Id: "1",
        MarcaId: "2",
        RubroId: "3",
        UnidadMedidaId: "4",
        IvaId: "5",
        Codigo: "123",
        CodigoBarra: "123",
        Descripcion: "Producto 1",
        TipoVenta: "UNIDAD",
      },
      {
        Id: "2",
        MarcaId: "2",
        RubroId: "3",
        UnidadMedidaId: "4",
        IvaId: "5",
        Codigo: "456",
        CodigoBarra: "456",
        Descripcion: "Producto 2",
        TipoVenta: "UNIDAD",
      },
    ];

    const result = productoListAdapter(data);

    expect(result).toHaveLength(2);
    expect(result[0].Id).toBe(1);
    expect(result[1].Id).toBe(2);
  });

  it("debe retornar array vacío si no es un array", () => {
    expect(productoListAdapter(null as any)).toEqual([]);
    expect(productoListAdapter(undefined as any)).toEqual([]);
    expect(productoListAdapter("string" as any)).toEqual([]);
    expect(productoListAdapter({} as any)).toEqual([]);
  });

  it("debe retornar array vacío si el array está vacío", () => {
    expect(productoListAdapter([])).toEqual([]);
  });
});
