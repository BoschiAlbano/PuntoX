import { Producto } from "@/lib/validations/producto.schema";

/**
 * Adapta la respuesta de la API (donde los decimales vienen como strings)
 * a la interfaz Producto del frontend (donde usamos numbers).
 */
export const productoAdapter = (data: any): Producto => {
  return {
    Id: Number(data.Id),
    MarcaId: Number(data.MarcaId),
    RubroId: Number(data.RubroId),
    UnidadMedidaId: Number(data.UnidadMedidaId),
    IvaId: Number(data.IvaId),
    PrecioId: Number(data.PrecioId),
    Codigo: Number(data.Codigo),
    CodigoBarra: data.CodigoBarra || "",
    Abreviatura: data.Abreviatura || "",
    Descripcion: data.Descripcion || "",
    Detalle: data.Detalle || "",
    Ubicacion: data.Ubicacion || "",
    Foto: data.Foto || undefined,
    ActivarLimiteVenta: Boolean(data.ActivarLimiteVenta),
    LimiteVenta: Number(data.LimiteVenta),
    ActivarHoraVenta: Boolean(data.ActivarHoraVenta),
    HoraLimiteVentaDesde: data.HoraLimiteVentaDesde || "00:00",
    HoraLimiteVentaHasta: data.HoraLimiteVentaHasta || "23:59",
    PermiteStockNegativo: Boolean(data.PermiteStockNegativo),
    DescuentaStock: Boolean(data.DescuentaStock),
    StockMinimo: Number(data.StockMinimo),
    VencimientoDias: Number(data.VencimientoDias),
    TipoVenta: data.TipoVenta,
    EstaEliminado: Boolean(data.EstaEliminado),
    Precio: {
      PorcentajeGanancia: Number(data.Precio?.PorcentajeGanancia || 0),
      PorcentajeGanancia2: Number(data.Precio?.PorcentajeGanancia2 || 0),
      PrecioPublico: Number(data.Precio?.PrecioPublico || 0),
      PrecioPublico2: Number(data.Precio?.PrecioPublico2 || 0),
      PrecioCosto: Number(data.Precio?.PrecioCosto || 0),
    },
    Stock: Number(data.Stock || 0),
    SucursalNombre: data.SucursalNombre || null,
    Iva: {
      Id: Number(data.Iva?.Id || 0),
      Porcentaje: Number(data.Iva?.Porcentaje || 0),
      Descripcion: data.Iva?.Descripcion || "",
    },
  };
};

export const productoListAdapter = (data: any[]): Producto[] => {
  if (!Array.isArray(data)) return [];
  return data.map(productoAdapter);
};
