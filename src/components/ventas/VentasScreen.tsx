"use client";

import { addToast } from "@heroui/react";
import { useState } from "react";
import { ShoppingCart, CreditCard } from "lucide-react";

import ProductSearch from "./ProductSearch";
import VentaGrid from "./VentaGrid";
import VentaFooter from "./VentaFooter";
import ClienteSearch from "./ClienteSearch";
import ComprobanteSelector from "./ComprobanteSelector";
import PriceListSelector from "./PriceListSelector";
import { Producto } from "@/lib/validations/producto.schema";
import { useVentaStore, Item, OrigenPrecio } from "@/store/ventaStore";

type MobileTab = "productos" | "pago";

export default function VentasScreen() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("productos");

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
    updateItemsListaPrecios,
    removeItems,
    applyDiscountToItems,
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
  const handleAddItem = (producto: Producto, cantidad: number = 1, precioOverride?: number, origenPrecio?: OrigenPrecio) => {
    try {
      const existing = items.find((i) => i.Id === producto.Id);
      const currentQty = existing ? existing.cantidad : 0;
      const totalQty = currentQty + cantidad;

      checkProductRules(producto, totalQty);

      addItem(producto, cantidad, listaPrecios, precioOverride, origenPrecio);
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

  const total = calculateTotal();
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className="h-full w-full flex flex-col gap-0">
      {/* ── MOBILE TABS ── solo visible en pantallas < lg */}
      <div className="lg:hidden flex items-center bg-white border-b border-slate-100 shrink-0 px-3 pt-1">
        <button
          onClick={() => setMobileTab("productos")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
            mobileTab === "productos"
              ? "border-[#67afc3] text-[#67afc3]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <ShoppingCart size={15} />
          <span>Productos</span>
          {items.length > 0 && (
            <span className="ml-1 min-w-[20px] h-5 rounded-full bg-[#67afc3] text-white text-[10px] font-bold flex items-center justify-center px-1.5">
              {items.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setMobileTab("pago")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
            mobileTab === "pago"
              ? "border-[#67afc3] text-[#67afc3]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <CreditCard size={15} />
          <span>Pago</span>
          {total > 0 && (
            <span className="ml-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              ${total.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          )}
        </button>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-col lg:flex-row flex-1 gap-2 overflow-auto lg:overflow-hidden p-2">
        {/* ── LEFT PANEL: PRODUCTS ── */}
        <div
          className={`flex-1 flex flex-col gap-2 lg:overflow-hidden rounded-xl ${
            mobileTab === "productos" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Toolbar */}
          <div className="bg-white p-2 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-0 items-stretch sm:items-center shrink-0 relative shadow-sm">
            {/* Buscador */}
            <div className="flex-1">
              <ProductSearch onProductSelect={handleAddItem} />
            </div>

            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2" />

            {/* Lista de precios */}
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
            onChangeListaPrecios={updateItemsListaPrecios}
            onRemoveItems={removeItems}
            onApplyDiscount={applyDiscountToItems}
          />
        </div>

        {/* ── RIGHT PANEL: CLIENT + PAYMENT ── */}
        <div
          className={`w-full lg:w-[320px] xl:w-[350px] flex flex-col gap-2 shrink-0 lg:h-full lg:overflow-hidden ${
            mobileTab === "pago" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Cliente y Comprobante */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
            {/* Cliente */}
            <div className="bg-white rounded-xl border border-slate-100 flex flex-col shrink-0 overflow-hidden w-full shadow-sm">
              <ClienteSearch selected={cliente} onSelect={setCliente} />
            </div>

            {/* Comprobante */}
            <div className="bg-white rounded-xl border border-slate-100 flex flex-col shrink-0 overflow-hidden w-full shadow-sm">
              <div className="p-2">
                <ComprobanteSelector
                  tipoComprobante={tipoComprobante}
                  setTipoComprobante={setTipoComprobante}
                  numeroComprobanteAsociado={numeroComprobanteAsociado}
                  setNumeroComprobanteAsociado={setNumeroComprobanteAsociado}
                />
              </div>
            </div>
          </div>

          {/* Footer / Totales */}
          <div className="flex-1 min-h-0 flex flex-col">
            <VentaFooter
              subtotal={subtotal}
              descuento={descuentoPorcentaje}
              setDescuento={setDescuentoPorcentaje}
              total={total}
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
