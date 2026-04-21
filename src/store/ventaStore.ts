import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Producto } from "@/lib/validations/producto.schema";
import { Cliente } from "@/lib/validations/cliente.schema";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";

export type OrigenPrecio = "normal" | "alternativo";

export interface Item extends Producto {
  cantidad: number;
  precio: number;
  subtotal: number;
  origenPrecio: OrigenPrecio;
}

export interface Pago {
  tipoPago: number;
  monto: number;
}

interface VentaState {
  items: Item[];
  cliente: Partial<Cliente>;
  tipoComprobante: number;
  listaPrecios: number | null;
  descuentoPorcentaje: number;
  pagos: Pago[];
  numeroComprobanteAsociado: number | null;

  // Actions
  addItem: (producto: Producto, cantidad: number, listaPrecios: number | null, precioOverride?: number, origenPrecio?: OrigenPrecio) => void;
  updateItemQuantity: (id: number, cantidad: number) => void;
  removeItem: (id: number) => void;
  setCliente: (cliente: Partial<Cliente>) => void;
  setTipoComprobante: (tipo: number) => void;
  setListaPrecios: (lista: number | null) => void;
  setDescuentoPorcentaje: (descuento: number) => void;
  setNumeroComprobanteAsociado: (numero: number | null) => void;
  addPago: (pago: Pago) => void;
  removePago: (index: number) => void;
  setPagos: (pagos: Pago[]) => void;
  clearVenta: () => void;
}

export const useVentaStore = create<VentaState>()(
  persist(
    (set, get) => ({
      items: [],
      cliente: {
        Id: 0,
        Nombre: "Consumidor Final",
      },
      tipoComprobante: TIPO_COMPROBANTE_VENTA.FACTURA_B,
      listaPrecios: null,
      descuentoPorcentaje: 0,

      numeroComprobanteAsociado: null,

      pagos: [],

      addItem: (producto, cantidad = 1, listaPrecios, precioOverride, origenPrecio = "normal") => {
        const { items } = get();
        const existing = items.find((i) => i.Id === producto.Id);

        const precioUnitario = precioOverride != null
          ? precioOverride
          : (() => {
              const pl = producto.PreciosLista?.find(p => Number(p.ListaPrecioId) === Number(listaPrecios));
              return pl ? Number(pl.PrecioFinal) : Number(producto.PrecioCosto || 0);
            })();

        if (existing) {
          // Si el precio override es diferente al existente, se agrega como nueva línea
          if (precioOverride != null && existing.precio !== precioOverride) {
            set({
              items: [
                ...items,
                {
                  ...producto,
                  // Usar un ID único para no colisionar con el existente
                  Id: producto.Id + Date.now(),
                  cantidad,
                  precio: precioUnitario,
                  subtotal: precioUnitario * cantidad,
                  origenPrecio,
                },
              ],
            });
          } else {
            set({
              items: items.map((i) =>
                i.Id === existing.Id
                  ? {
                      ...i,
                      cantidad: i.cantidad + cantidad,
                      subtotal: (i.cantidad + cantidad) * i.precio,
                    }
                  : i,
              ),
            });
          }
        } else {
          set({
            items: [
              ...items,
              {
                ...producto,
                cantidad,
                precio: precioUnitario,
                subtotal: precioUnitario * cantidad,
                origenPrecio,
              },
            ],
          });
        }
      },

      updateItemQuantity: (id, cantidad) => {
        const { items } = get();
        set({
          items: items.map((item) => {
            if (item.Id === id) {
              return { ...item, cantidad, subtotal: item.precio * cantidad };
            }
            return item;
          }),
        });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.Id !== id) });
      },

      setCliente: (cliente) => set((state) => ({ 
        cliente,
        listaPrecios: cliente.ListaPrecioId || null
      })),
      setTipoComprobante: (tipoComprobante) =>
        set((state) => {
          if (tipoComprobante !== TIPO_COMPROBANTE_VENTA.NOTA_CREDITO) {
            return { tipoComprobante, numeroComprobanteAsociado: null };
          }
          return { tipoComprobante };
        }),
      setListaPrecios: (listaPrecios) => set({ listaPrecios }),
      setDescuentoPorcentaje: (descuentoPorcentaje) =>
        set({ descuentoPorcentaje }),
      setNumeroComprobanteAsociado: (numero) =>
        set({ numeroComprobanteAsociado: numero }),

      addPago: (pago) => set((state) => ({ pagos: [...state.pagos, pago] })),
      removePago: (index) =>
        set((state) => ({
          pagos: state.pagos.filter((_, i) => i !== index),
        })),
      setPagos: (pagos) => set({ pagos }),

      clearVenta: () =>
        set({
          items: [],
          cliente: { Id: 0, Nombre: "Consumidor Final" },
          tipoComprobante: TIPO_COMPROBANTE_VENTA.FACTURA_B,
          listaPrecios: null,
          descuentoPorcentaje: 0,
          numeroComprobanteAsociado: null,
          pagos: [],
        }),
    }),
    {
      name: "venta-storage",
      partialize: (state) => ({
        items: state.items,
        cliente: state.cliente,
        tipoComprobante: state.tipoComprobante,
        listaPrecios: state.listaPrecios,
        descuentoPorcentaje: state.descuentoPorcentaje,
        numeroComprobanteAsociado: state.numeroComprobanteAsociado,
        pagos: state.pagos,
      }),
    },
  ),
);
