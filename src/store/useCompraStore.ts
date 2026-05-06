import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Producto } from "@/lib/validations/producto.schema";
import { TIPO_COMPROBANTE_COMPRA } from "@/lib/constants/comprobantes";

export interface ItemCompra extends Producto {
  cantidad: number;
  costoUnitario: number; // Nuevo costo ingresado en la compra
  subtotal: number;
  // PreciosLista recalculados en base al nuevo costo (se persisten al guardar)
  preciosListaActualizados: { ListaPrecioId: number; PorcentajeGanancia: number; PrecioFinal: number }[];
}

export interface PagoCompra {
  tipoPago: number;
  monto: number;
}

export interface ProveedorCompra {
  Id: number;
  RazonSocial: string;
}

interface CompraState {
  items: ItemCompra[];
  proveedor: ProveedorCompra | null;
  tipoComprobante: number;
  pagos: PagoCompra[];

  // Actions
  addItem: (producto: Producto, cantidad: number, costoOverride?: number, unificarRenglones?: boolean) => void;
  updateItemQuantity: (id: number, cantidad: number) => void;
  updateItemCosto: (id: number, costo: number) => void;
  removeItem: (id: number) => void;
  setProveedor: (proveedor: ProveedorCompra | null) => void;
  setTipoComprobante: (tipo: number) => void;
  addPago: (pago: PagoCompra) => void;
  removePago: (index: number) => void;
  setPagos: (pagos: PagoCompra[]) => void;
  clearCompra: () => void;
}

export const useCompraStore = create<CompraState>()(
  persist(
    (set, get) => ({
      items: [],
      proveedor: null,
      tipoComprobante: TIPO_COMPROBANTE_COMPRA.COMPRA,
      pagos: [],

      addItem: (producto, cantidad = 1, costoOverride, unificarRenglones = true) => {
        const { items } = get();
        const costoUnitario =
          costoOverride ?? Number(producto.PrecioCosto ?? 0);
        const existing = items.find((i) => i.Id === producto.Id);

        const calcPreciosLista = (costo: number, listas: Producto["PreciosLista"]) =>
          listas.map((pl) => ({
            ListaPrecioId: pl.ListaPrecioId,
            PorcentajeGanancia: pl.PorcentajeGanancia,
            PrecioFinal: Math.round(costo * (1 + pl.PorcentajeGanancia / 100) * 100) / 100,
          }));

        if (existing && unificarRenglones) {
          set({
            items: items.map((i) =>
              i.Id === existing.Id
                ? {
                    ...i,
                    cantidad: i.cantidad + cantidad,
                    subtotal: (i.cantidad + cantidad) * i.costoUnitario,
                  }
                : i,
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                ...producto,
                // Si ya existe el producto y no se unifica, generar ID único
                Id: existing && !unificarRenglones ? producto.Id + Date.now() : producto.Id,
                cantidad,
                costoUnitario,
                subtotal: costoUnitario * cantidad,
                preciosListaActualizados: calcPreciosLista(costoUnitario, producto.PreciosLista),
              },
            ],
          });
        }
      },

      updateItemQuantity: (id, cantidad) => {
        const { items } = get();
        set({
          items: items.map((item) =>
            item.Id === id
              ? { ...item, cantidad, subtotal: item.costoUnitario * cantidad }
              : item,
          ),
        });
      },

      updateItemCosto: (id, costo) => {
        const { items } = get();
        set({
          items: items.map((item) =>
            item.Id === id
              ? {
                  ...item,
                  costoUnitario: costo,
                  subtotal: costo * item.cantidad,
                  preciosListaActualizados: item.PreciosLista.map((pl) => ({
                    ListaPrecioId: pl.ListaPrecioId,
                    PorcentajeGanancia: pl.PorcentajeGanancia,
                    PrecioFinal: Math.round(costo * (1 + pl.PorcentajeGanancia / 100) * 100) / 100,
                  })),
                }
              : item,
          ),
        });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.Id !== id) });
      },

      setProveedor: (proveedor) => set({ proveedor }),
      setTipoComprobante: (tipoComprobante) => set({ tipoComprobante }),

      addPago: (pago) => set((state) => ({ pagos: [...state.pagos, pago] })),
      removePago: (index) =>
        set((state) => ({
          pagos: state.pagos.filter((_, i) => i !== index),
        })),
      setPagos: (pagos) => set({ pagos }),

      clearCompra: () =>
        set({
          items: [],
          proveedor: null,
          tipoComprobante: TIPO_COMPROBANTE_COMPRA.COMPRA,
          pagos: [],
        }),
    }),
    {
      name: "compra-storage",
      partialize: (state) => ({
        items: state.items,
        proveedor: state.proveedor,
        tipoComprobante: state.tipoComprobante,
        pagos: state.pagos,
      }),
    },
  ),
);
