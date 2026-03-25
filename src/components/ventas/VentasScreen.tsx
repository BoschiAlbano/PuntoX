"use client";

import { addToast } from "@heroui/react";

import ProductSearch from "./ProductSearch";
import VentaGrid from "./VentaGrid";
import VentaFooter from "./VentaFooter";
import ClienteSearch from "./ClienteSearch";
import ComprobanteSelector from "./ComprobanteSelector";
import PriceListSelector from "./PriceListSelector";
import { Producto } from "@/lib/validations/producto.schema";
import { useVentaStore, Item } from "@/store/ventaStore";

export default function VentasScreen() {
  // Store
  const {
    items,
    cliente,
    tipoComprobante,
    listaPrecios,
    descuentoPorcentaje,
    addItem,
    updateItemQuantity,
    removeItem,
    setCliente,
    setTipoComprobante,
    setListaPrecios,
    setDescuentoPorcentaje,
    numeroComprobanteAsociado,
    setNumeroComprobanteAsociado,
    clearVenta,
  } = useVentaStore();

  // Business Logic Helpers
  const checkProductRules = (product: Producto | Item, newQuantity: number) => {
    // 1. Stock Check
    if (product.DescuentaStock && !product.PermiteStockNegativo) {
      if (product.Stock < newQuantity) {
        throw new Error(
          `No hay suficiente stock disponible. Stock actual: ${product.Stock}`,
        );
      }
    }

    // 2. Sales Limit Check
    if (product.ActivarLimiteVenta && product.LimiteVenta > 0) {
      if (newQuantity > product.LimiteVenta) {
        throw new Error(
          `Supera el límite de venta permitido (${product.LimiteVenta} unidades).`,
        );
      }
    }

    // 3. Time Check
    if (
      product.ActivarHoraVenta &&
      product.HoraLimiteVentaDesde &&
      product.HoraLimiteVentaHasta
    ) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] =
        product.HoraLimiteVentaDesde.split(":").map(Number);
      const [endH, endM] = product.HoraLimiteVentaHasta.split(":").map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      let isRestricted = false;

      if (startMinutes <= endMinutes) {
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          isRestricted = true;
        }
      } else {
        if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) {
          isRestricted = true;
        }
      }

      if (isRestricted) {
        throw new Error(
          `Producto restringido en el horario (${product.HoraLimiteVentaDesde} - ${product.HoraLimiteVentaHasta})`,
        );
      }
    }
  };

  // Handlers
  const handleAddItem = (producto: Producto, cantidad: number = 1) => {
    try {
      const existing = items.find((i) => i.Id === producto.Id);
      const currentQty = existing ? existing.cantidad : 0;
      const totalQty = currentQty + cantidad;

      checkProductRules(producto, totalQty);

      addItem(producto, cantidad, listaPrecios);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      addToast({
        title: "Error",
        description: message,
        color: "danger",
      });
    }
  };

  const handleUpdateQuantity = (id: number, cantidad: number) => {
    try {
      const item = items.find((i) => i.Id === id);
      if (!item) return;

      checkProductRules(item, cantidad);

      updateItemQuantity(id, cantidad);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      addToast({
        title: "Error al actualizar cantidad",
        description: message,
        color: "danger",
      });
    }
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const discountAmount = subtotal * (descuentoPorcentaje / 100);
    return subtotal - discountAmount;
  };

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row flex-1 gap-4 overflow-auto lg:overflow-hidden">
        {/* LEFT PANEL: PRODUCT SEARCH & GRID */}
        <div className="flex-1 flex flex-col gap-4 lg:overflow-hidden rounded-2xl p-2">
          {/* Toolbar Card */}
          <div className=" p-3 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center shrink-0 relative shadow-sm">
            {/* Buscador de productos */}
            <div className="flex-1">
              <ProductSearch onProductSelect={handleAddItem} />
            </div>

            <div className="hidden sm:block h-8 w-px bg-slate-200 mx-2"></div>

            {/* Selector de lista de precios */}
            <PriceListSelector
              listaPrecios={listaPrecios}
              setListaPrecios={setListaPrecios}
            />
          </div>

          {/* Grilla de items */}
          <VentaGrid
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={removeItem}
          />
        </div>

        {/* RIGHT PANEL: CLIENT & FOOTER */}
        <div className="w-full lg:w-[400px] flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-hidden p-2">
          {/* Cliente y Comprobante en fila en mobile */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
            {/* Cliente Card */}
            <div className="rounded-2xl border border-slate-100 flex flex-col shrink-0 overflow-hidden w-full shadow-sm">
              <div className="p-0">
                <ClienteSearch selected={cliente} onSelect={setCliente} />
              </div>
            </div>

            {/* Comprobante Card */}
            <div className="rounded-2xl border border-slate-100 flex flex-col shrink-0 overflow-hidden w-full shadow-sm">
              <div className="p-3">
                <ComprobanteSelector
                  tipoComprobante={tipoComprobante}
                  setTipoComprobante={setTipoComprobante}
                  numeroComprobanteAsociado={numeroComprobanteAsociado}
                  setNumeroComprobanteAsociado={setNumeroComprobanteAsociado}
                />
              </div>
            </div>
          </div>

          {/* Footer / Totals Section */}
          <div className="flex-1 min-h-0 flex flex-col">
            <VentaFooter
              subtotal={items.reduce((acc, item) => acc + item.subtotal, 0)}
              descuento={descuentoPorcentaje}
              setDescuento={setDescuentoPorcentaje}
              total={calculateTotal()}
              items={items}
              cliente={cliente}
              tipoComprobante={tipoComprobante}
              handleLimpiar={clearVenta}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
