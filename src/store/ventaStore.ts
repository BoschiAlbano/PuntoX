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
  esPromo?: boolean;
  porcentajeDescuentoAplicado?: number;
  precioOverride?: number; // Precio fijado manualmente o congelado al deshabilitar promo
  ingresadoPorBalanza?: boolean;
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
  addItem: (producto: Producto, cantidad: number, listaPrecios: number | null, precioOverride?: number, origenPrecio?: OrigenPrecio, unificarRenglones?: boolean, ingresadoPorBalanza?: boolean) => void;
  updateItemQuantity: (id: number, cantidad: number) => void;
  updateItemDiscount: (id: number, discountPercent: number) => void;
  toggleItemPromo: (id: number, enablePromo: boolean) => void;
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


const calcularPrecio = (producto: Producto, cantidad: number, listaPrecios: number | null) => {
  let precioBase = (() => {
    const pl = producto.PreciosLista?.find(p => Number(p.ListaPrecioId) === Number(listaPrecios));
    return pl ? Number(pl.PrecioFinal) : Number(producto.PrecioCosto || 0);
  })();

  let promoActiva = null;
  if (producto.PromocionesCantidad && producto.PromocionesCantidad.length > 0) {
    const validPromos = producto.PromocionesCantidad.filter(p => p.EstaActiva && p.Cantidad <= cantidad);
    if (validPromos.length > 0) {
      validPromos.sort((a, b) => b.Cantidad - a.Cantidad);
      promoActiva = validPromos[0];
    }
  }

  return {
    precioFinal: promoActiva ? parseFloat((precioBase * (1 - Number(promoActiva.DescuentoPorcentaje) / 100)).toFixed(2)) : precioBase,
    esPromo: !!promoActiva,
    porcentajeDescuentoAplicado: promoActiva ? Number(promoActiva.DescuentoPorcentaje) : 0
  };
};

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

      addItem: (
        producto,
        cantidad,
        listaPrecios,
        precioOverride,
        origenPrecio = "normal",
        unificarRenglones = true,
        ingresadoPorBalanza = false
      ) => {
        const { items } = get();
        const existing = items.find((i) => i.Id === producto.Id);

        if (existing && unificarRenglones) {
          // Si el precio override es diferente al existente, se agrega como nueva línea
          if (precioOverride != null && existing.precio !== precioOverride) {
            set({
              items: [
                ...items,
                {
                  ...producto,
                  Id: producto.Id + Date.now(),
                  cantidad,
                  precio: precioOverride,
                  subtotal: precioOverride * cantidad,
                  origenPrecio,
                  precioOverride,
                  esPromo: false,
                  porcentajeDescuentoAplicado: 0,
                  ingresadoPorBalanza
                },
              ],
            });
          } else {
            const newCantidad = existing.cantidad + cantidad;
            // Recalcular precio con promociones si no hay override manual
            if (precioOverride == null && existing.precioOverride == null) {
              const { precioFinal, esPromo, porcentajeDescuentoAplicado } = calcularPrecio(existing, newCantidad, listaPrecios);
              set({
                items: items.map((i) =>
                  i.Id === existing.Id
                    ? {
                        ...i,
                        cantidad: newCantidad,
                        precio: precioFinal,
                        subtotal: newCantidad * precioFinal,
                        esPromo,
                        porcentajeDescuentoAplicado,
                        ingresadoPorBalanza: i.ingresadoPorBalanza || ingresadoPorBalanza
                      }
                    : i,
                ),
              });
            } else {
              set({
                items: items.map((i) =>
                  i.Id === existing.Id
                    ? {
                        ...i,
                        cantidad: newCantidad,
                        subtotal: newCantidad * i.precio,
                        ingresadoPorBalanza: i.ingresadoPorBalanza || ingresadoPorBalanza
                      }
                    : i,
                ),
              });
            }
          }
        } else {
          // Nuevo renglón: calcular precio con promociones
          const usePromo = precioOverride == null;
          const { precioFinal, esPromo, porcentajeDescuentoAplicado } = usePromo
            ? calcularPrecio(producto, cantidad, listaPrecios)
            : { precioFinal: precioOverride!, esPromo: false, porcentajeDescuentoAplicado: 0 };

          set({
            items: [
              ...items,
              {
                ...producto,
                // Si ya existe el producto y no se unifica, generar ID único
                Id: existing && !unificarRenglones ? producto.Id + Date.now() : producto.Id,
                cantidad,
                precio: precioFinal,
                subtotal: precioFinal * cantidad,
                origenPrecio: usePromo ? origenPrecio : (origenPrecio || "normal"),
                precioOverride,
                esPromo,
                porcentajeDescuentoAplicado,
                ingresadoPorBalanza
              },
            ],
          });
        }
      },

      updateItemDiscount: (id, discountPercent) => {
        const { items, listaPrecios } = get();
        set({
          items: items.map((item) => {
            if (item.Id === id) {
              // Recalcular precio base y aplicar descuento manual
              const pl = item.PreciosLista?.find(p => Number(p.ListaPrecioId) === Number(listaPrecios));
              const precioBase = pl ? Number(pl.PrecioFinal) : Number(item.PrecioCosto || 0);
              const precioConDescuento = parseFloat((precioBase * (1 - discountPercent / 100)).toFixed(2));

              return {
                ...item,
                precioOverride: precioConDescuento,
                precio: precioConDescuento,
                subtotal: precioConDescuento * item.cantidad,
                porcentajeDescuentoAplicado: discountPercent,
                esPromo: false
              };
            }
            return item;
          }),
        });
      },

      updateItemQuantity: (id, cantidad) => {
        const { items, listaPrecios } = get();
        set({
          items: items.map((item) => {
            if (item.Id === id) {
              // Si el item tiene un precioOverride manual, no recalcular la promo
              if (item.precioOverride != null) {
                return { ...item, cantidad, subtotal: item.precio * cantidad };
              }
              // Recalcular precio con promociones de cantidad
              const { precioFinal, esPromo, porcentajeDescuentoAplicado } = calcularPrecio(item, cantidad, listaPrecios);
              return {
                ...item,
                cantidad,
                precio: precioFinal,
                subtotal: precioFinal * cantidad,
                esPromo,
                porcentajeDescuentoAplicado,
              };
            }
            return item;
          }),
        });
      },

      toggleItemPromo: (id, enablePromo) => {
        const { items, listaPrecios } = get();
        set({
          items: items.map((item) => {
            if (item.Id === id) {
              if (enablePromo) {
                // Remove override and let calcularPrecio decide
                const { precioFinal, esPromo, porcentajeDescuentoAplicado } = calcularPrecio(item, item.cantidad, listaPrecios);
                return {
                  ...item,
                  precioOverride: undefined,
                  precio: precioFinal,
                  subtotal: precioFinal * item.cantidad,
                  esPromo,
                  porcentajeDescuentoAplicado
                };
              } else {
                // Disable promo, revert to base price as manual override
                const pl = item.PreciosLista?.find(p => Number(p.ListaPrecioId) === Number(listaPrecios));
                const precioBase = pl ? Number(pl.PrecioFinal) : Number(item.PrecioCosto || 0);
                
                return {
                  ...item,
                  precioOverride: precioBase,
                  precio: precioBase,
                  subtotal: precioBase * item.cantidad,
                  esPromo: false,
                  porcentajeDescuentoAplicado: 0
                };
              }
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
        const { items, listaPrecios } = get();
        set({
          items: items.map((item) => {
            if (!ids.includes(item.Id)) return item;
            
            const pl = item.PreciosLista?.find(p => Number(p.ListaPrecioId) === Number(listaPrecios));
            const precioBase = pl ? Number(pl.PrecioFinal) : Number(item.PrecioCosto || 0);
            const precioConDescuento = parseFloat((precioBase * (1 - porcentaje / 100)).toFixed(2));

            return {
              ...item,
              precioOverride: precioConDescuento,
              precio: precioConDescuento,
              subtotal: precioConDescuento * item.cantidad,
              porcentajeDescuentoAplicado: porcentaje,
              esPromo: false
            };
          }),
        });
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
