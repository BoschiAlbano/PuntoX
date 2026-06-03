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
    PrecioCosto: Number(data.PrecioCosto || 0),
    PreciosLista: Array.isArray(data.PreciosLista) ? data.PreciosLista.map((pl: any) => ({
      ListaPrecioId: Number(pl.ListaPrecioId),
      PorcentajeGanancia: Number(pl.PorcentajeGanancia),
      PrecioFinal: Number(pl.PrecioFinal),
      ListaPrecio: pl.ListaPrecio
    })) : [],
    Stock: Number(data.Stock || 0),
    SucursalNombre: data.SucursalNombre || null,
    FechaActualizacion: data.FechaActualizacion || undefined,
    Marca: data.Marca ?? null,
    Rubro: data.Rubro ?? null,
    Iva: {
      Id: Number(data.Iva?.Id || 0),
      Porcentaje: Number(data.Iva?.Porcentaje || 0),
      Descripcion: data.Iva?.Descripcion || "",
    },
    PromocionesCantidad: Array.isArray(data.PromocionesCantidad) ? data.PromocionesCantidad.map((pc: any) => ({
      Id: Number(pc.Id),
      Cantidad: Number(pc.Cantidad),
      DescuentoPorcentaje: Number(pc.DescuentoPorcentaje),
      EstaActiva: Boolean(pc.EstaActiva),
    })) : [],
  };
};

export const productoListAdapter = (data: any[]): Producto[] => {
  if (!Array.isArray(data)) return [];
  return data.map(productoAdapter);
};
