"use client";

import { addToast } from "@heroui/react";
import { useState, useEffect } from "react";
import { ShoppingCart, CreditCard } from "lucide-react";

import ProductSearch from "./ProductSearch";
import VentaProductosPanel from "./VentaProductosPanel";
import VentaFooter from "./VentaFooter";
import ClienteSearch from "./ClienteSearch";
import ComprobanteSelector from "./ComprobanteSelector";
import PriceListSelector from "./PriceListSelector";
import { Producto } from "@/lib/validations/producto.schema";
import { useVentaStore, Item, OrigenPrecio } from "@/store/ventaStore";
import { useConfiguracion } from "@/hooks/useConfiguracion";

type MobileTab = "productos" | "pago";
type InnerTab = "carrito" | "buscar";

export default function VentasScreen() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("productos");
  const [innerTab, setInnerTab] = useState<InnerTab>("carrito");
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingPanel, setIsSearchingPanel] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Store
  const {
    items,
    cliente,
    tipoComprobante,
    listaPrecios,
    descuentoPorcentaje,
    addItem,
    updateItemQuantity,
    updateItemDiscount,
    toggleItemPromo,
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

  const { configuracion, fiscal } = useConfiguracion({
    enableConfiguracion: true,
    enableFiscal: true,
  });
  const unificarRenglones =
    configuracion?.unificarRenglonesIngresarMismoProducto ?? true;

  // Business Logic Helpers
  const checkProductRules = (product: Producto | Item, newQuantity: number) => {
    // 1. Stock Check
    if (product.DescuentaStock && !product.PermiteStockNegativo) {
      if (product.Stock < newQuantity) {
        throw new Error(
          `"${product.Descripcion || 'El artÃ­culo'}" no tiene suficiente stock disponible. (Stock actual: ${product.Stock})`,
        );
      }
    }

    // 2. Sales Limit Check
    if (product.ActivarLimiteVenta && product.LimiteVenta > 0) {
      if (newQuantity > product.LimiteVenta) {
        throw new Error(
          `Supera el lÃ­mite de venta permitido (${product.LimiteVenta} unidades).`,
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
  const handleAddItem = (
    producto: Producto,
    cantidad: number = 1,
    precioOverride?: number,
    origenPrecio?: OrigenPrecio,
    ingresadoPorBalanza?: boolean,
  ) => {
    try {
      const currentQty = items
        .filter((i) => i.CodigoBarra === producto.CodigoBarra)
        .reduce((sum, i) => sum + i.cantidad, 0);
      const totalQty = currentQty + cantidad;

      checkProductRules(producto, totalQty);

      addItem(
        producto,
        cantidad,
        listaPrecios,
        precioOverride,
        origenPrecio,
        unificarRenglones,
        ingresadoPorBalanza,
      );

      // Al agregar un producto desde el panel de búsqueda, volver al carrito y limpiar la búsqueda
      if (innerTab === "buscar") {
        setInnerTab("carrito");
      }
      setSearchResults([]);
      setSearchQuery("");

      // Devolver el foco al buscador para encadenar la próxima búsqueda sin usar el mouse
      document.getElementById("product-search-input")?.focus();
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

      const currentItemQty = item.cantidad;
      const totalOtherItems = items
        .filter((i) => i.CodigoBarra === item.CodigoBarra && i.Id !== id)
        .reduce((sum, i) => sum + i.cantidad, 0);
      const totalQty = cantidad - currentItemQty + totalOtherItems + cantidad;

      const productForCheck = { ...item, cantidad: cantidad + totalOtherItems };
      checkProductRules(productForCheck, cantidad + totalOtherItems);

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

  // Handler para bÃºsquedas ambiguas desde ProductSearch:
  // guarda los resultados y activa la pestaÃ±a "buscar"
  const handleAmbiguousSearch = (results: Producto[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
    setInnerTab("buscar");
    setHighlightedIndex(0);
  };

  // â”€â”€ Keyboard shortcuts â”€â”€
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      const isProductSearch = target?.id === "product-search-input";
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) && !isProductSearch)
        return;
      if (document.querySelector('[data-slot="backdrop"]')) return;

      if (e.key === "F2") {
        e.preventDefault();
        document.getElementById("product-search-input")?.focus();
      }
      if (e.key === "F6") {
        e.preventDefault();
        document
          .querySelector<HTMLElement>('[data-shortcut="cliente-trigger"]')
          ?.click();
      }

      // ── Navegación por teclado en los resultados de búsqueda ──
      if (innerTab === "buscar" && searchResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, searchResults.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setInnerTab("carrito");
          return;
        }
        if (e.key === "Enter" && isProductSearch) {
          const value = (target as HTMLInputElement).value ?? "";
          // Sólo agrega el resaltado si no hay un término nuevo esperando búsqueda
          if (!value.trim()) {
            e.preventDefault();
            e.stopPropagation();
            const producto = searchResults[highlightedIndex];
            if (producto) handleAddItem(producto);
          }
        }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [innerTab, searchResults, highlightedIndex, handleAddItem]);

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col gap-0">
      {/* â”€â”€ MOBILE TABS â”€â”€ solo visible en pantallas < lg */}
      <div className="lg:hidden flex items-center shrink-0 px-0 pt-1">
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
              $
              {total.toLocaleString("es-AR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          )}
        </button>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 h-full gap-2 overflow-auto lg:overflow-hidden p-2 px-0">
        {/* ── LEFT PANEL: PRODUCTS ── */}
        <div
          className={`flex-1 min-h-0 h-full flex flex-col gap-2 lg:overflow-hidden ${
            mobileTab === "productos" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center shrink-0">
            {/* Buscador */}
            <div className="flex-1">
              <ProductSearch
                onProductSelect={handleAddItem}
                onAmbiguousSearch={handleAmbiguousSearch}
              />
            </div>

            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2" />

            {/* Lista de precios */}
            <PriceListSelector
              listaPrecios={listaPrecios}
              setListaPrecios={setListaPrecios}
            />
          </div>

          {/* Panel con pestaÃ±as Carrito / Buscar */}
          <VentaProductosPanel
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateDiscount={updateItemDiscount}
            onTogglePromo={toggleItemPromo}
            onRemoveItem={removeItem}
            onChangeListaPrecios={updateItemsListaPrecios}
            onRemoveItems={removeItems}
            onApplyDiscount={applyDiscountToItems}
            searchResults={searchResults}
            isSearching={isSearchingPanel}
            searchQuery={searchQuery}
            onProductAdd={handleAddItem}
            activeTab={innerTab}
            onTabChange={setInnerTab}
            highlightedIndex={highlightedIndex}
            onHighlightChange={setHighlightedIndex}
          />
        </div>

        {/* â”€â”€ RIGHT PANEL: CLIENT + PAYMENT â”€â”€ */}
        <div
          className={`w-full lg:w-[320px] xl:w-[350px] flex flex-col gap-2 shrink-0 lg:h-full lg:overflow-hidden ${
            mobileTab === "pago" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Cliente y Comprobante */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
            {/* Cliente */}
            <ClienteSearch selected={cliente} onSelect={setCliente} />

            {/* Comprobante */}
            <ComprobanteSelector
              tipoComprobante={tipoComprobante}
              setTipoComprobante={setTipoComprobante}
              numeroComprobanteAsociado={numeroComprobanteAsociado}
              setNumeroComprobanteAsociado={setNumeroComprobanteAsociado}
              clienteCondicionIvaId={cliente?.CondicionIvaId}
              configuracionCondicionIvaId={fiscal?.condicionIvaId}
            />
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
