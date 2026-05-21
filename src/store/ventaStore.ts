import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Producto } from "@/lib/validations/producto.schema";
import { Cliente } from "@/lib/validations/cliente.schema";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";
import { consumidorFinalSchema } from "@/lib/validations/consumidorFinal.schema";

export type OrigenPrecio = "normal" | "alternativo";

const CLIENTE_CONSUMIDOR_FINAL = {
  Id: 0,
  Nombre: consumidorFinalSchema.Nombre,
  Apellido: consumidorFinalSchema.Apellido,
  Dni: consumidorFinalSchema.Dni,
  Mail: consumidorFinalSchema.Mail,
  Direccion: consumidorFinalSchema.Direccion,
  ListaPrecioId: null,
  Persona_Cliente: {
    ActivarCtaCte: false,
    TieneLimiteCompra: false,
    MontoMaximoCtaCte: 0,
    SaldoActual: 0,
    MargenDisponible: 0,
  },
} as Partial<Cliente>;

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
  addItem: (producto: Producto, cantidad: number, listaPrecios: number | null, precioOverride?: number, origenPrecio?: OrigenPrecio, unificarRenglones?: boolean) => void;
  updateItemQuantity: (id: number, cantidad: number) => void;
  removeItem: (id: number) => void;
  setCliente: (cliente: Partial<Cliente>) => void;
  setTipoComprobante: (tipo: number) => void;
  setListaPrecios: (lista: number | null) => void;
  setDescuentoPorcentaje: (descuento: number) => void;
  setNumeroComprobanteAsociado: (numero: number | null) => void;
  updateItemsListaPrecios: (ids: number[], listaPrecioId: number) => void;
  removeItems: (ids: number[]) => void;
  applyDiscountToItems: (ids: number[], porcentaje: number) => void;
  addPago: (pago: Pago) => void;
  removePago: (index: number) => void;
  setPagos: (pagos: Pago[]) => void;
  clearVenta: () => void;
}

export const useVentaStore = create<VentaState>()(
  persist(
    (set, get) => ({
      items: [],
      cliente: CLIENTE_CONSUMIDOR_FINAL,
      tipoComprobante: TIPO_COMPROBANTE_VENTA.FACTURA_B,
      listaPrecios: null,
      descuentoPorcentaje: 0,

      numeroComprobanteAsociado: null,

      pagos: [],

      addItem: (producto, cantidad = 1, listaPrecios, precioOverride, origenPrecio = "normal", unificarRenglones = true) => {
        const { items } = get();
        const existing = items.find((i) => i.Id === producto.Id);

        const precioUnitario = precioOverride != null
          ? precioOverride
          : (() => {
              const pl = producto.PreciosLista?.find(p => Number(p.ListaPrecioId) === Number(listaPrecios));
              return pl ? Number(pl.PrecioFinal) : Number(producto.PrecioCosto || 0);
            })();

        if (existing && unificarRenglones) {
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
                // Si ya existe el producto y no se unifica, generar ID único
                Id: existing && !unificarRenglones ? producto.Id + Date.now() : producto.Id,
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

      updateItemsListaPrecios: (ids, listaPrecioId) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (!ids.includes(item.Id)) return item;
            const pl = item.PreciosLista?.find(
              (p) => Number(p.ListaPrecioId) === Number(listaPrecioId),
            );
            if (!pl) return item;
            const newPrecio = Number(pl.PrecioFinal);
            return {
              ...item,
              precio: newPrecio,
              subtotal: newPrecio * item.cantidad,
              origenPrecio: "normal" as OrigenPrecio,
            };
          }),
        }));
      },

      removeItems: (ids) => {
        set((state) => ({
          items: state.items.filter((item) => !ids.includes(item.Id)),
        }));
      },

      applyDiscountToItems: (ids, porcentaje) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (!ids.includes(item.Id)) return item;
            const newPrecio = parseFloat(
              (item.precio * (1 - porcentaje / 100)).toFixed(2),
            );
            return {
              ...item,
              precio: newPrecio,
              subtotal: newPrecio * item.cantidad,
              origenPrecio: "alternativo" as OrigenPrecio,
            };
          }),
        }));
      },

      addPago: (pago) => set((state) => ({ pagos: [...state.pagos, pago] })),
      removePago: (index) =>
        set((state) => ({
          pagos: state.pagos.filter((_, i) => i !== index),
        })),
      setPagos: (pagos) => set({ pagos }),

      clearVenta: () =>
        set({
          items: [],
          cliente: CLIENTE_CONSUMIDOR_FINAL,
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
