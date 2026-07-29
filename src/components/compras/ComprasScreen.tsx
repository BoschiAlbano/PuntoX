"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, CreditCard } from "lucide-react";
import { addToast } from "@heroui/react";

import ProductSearchCompras from "./ProductSearchCompras";
import CompraProductosPanel from "./CompraProductosPanel";
import CompraFooter from "./CompraFooter";
import { Producto } from "@/lib/validations/producto.schema";
import { useCompraStore } from "@/store/useCompraStore";
import { useConfiguracion } from "@/hooks/useConfiguracion";

type MobileTab = "productos" | "pago";
type InnerTab = "carrito" | "buscar";

export default function ComprasScreen() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("productos");
  const [innerTab, setInnerTab] = useState<InnerTab>("carrito");
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const {
    items,
    addItem,
    updateItemQuantity,
    updateItemCosto,
    removeItem,
    clearCompra,
  } = useCompraStore();

  const { configuracion } = useConfiguracion({ enableConfiguracion: true });
  const unificarRenglones =
    configuracion?.unificarRenglonesIngresarMismoProducto ?? true;

  // ProductSearch puede pasar hasta 4 args: (producto, cantidad?, precioOverride?, origenPrecio?)
  // En compras ignoramos precioOverride/origenPrecio y siempre usamos PrecioCosto como default
  const handleAddItem = (producto: Producto, cantidad: number = 1) => {
    try {
      // Pre-cargar el costo del artículo desde su PrecioCosto
      const costoDefault = Number(producto.PrecioCosto ?? 0);

      // Sumar todas las cantidades de productos con el mismo código
      // (necesario cuando no se unifica y hay múltiples renglones del mismo producto)
      const currentQty = items
        .filter((i) => i.CodigoBarra === producto.CodigoBarra)
        .reduce((sum, i) => sum + i.cantidad, 0);
      const totalQty = currentQty + cantidad;

      // Validar que no se exceda el stock mínimo si está configurado
      if (producto.StockMinimo && producto.DescuentaStock) {
        if (totalQty > producto.StockMinimo) {
          addToast({
            title: "Advertencia",
            description: `La cantidad total (${totalQty}) supera el stock mínimo (${producto.StockMinimo})`,
            color: "warning",
          });
        }
      }

      addItem(producto, cantidad, costoDefault, unificarRenglones);

      // Al agregar un producto desde el panel de búsqueda, volver al carrito y limpiar la búsqueda
      if (innerTab === "buscar") {
        setInnerTab("carrito");
      }
      setSearchResults([]);
      setSearchQuery("");

      // Devolver el foco al buscador para encadenar la próxima búsqueda sin usar el mouse
      document.getElementById("product-search-compras-input")?.focus();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      addToast({ title: "Error", description: message, color: "danger" });
    }
  };

  // Handler para búsquedas ambiguas desde ProductSearchCompras:
  // guarda los resultados y activa la vista de búsqueda
  const handleAmbiguousSearch = (results: Producto[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
    setInnerTab("buscar");
    setHighlightedIndex(0);
  };

  const handleUpdateQuantity = (id: number, cantidad: number) => {
    if (cantidad <= 0) return;

    const item = items.find((i) => i.Id === id);
    if (item && item.StockMinimo && item.DescuentaStock) {
      // Calcular la cantidad total de todos los renglones de este producto
      const currentItemQty = item.cantidad;
      const totalOtherItems = items
        .filter((i) => i.CodigoBarra === item.CodigoBarra && i.Id !== id)
        .reduce((sum, i) => sum + i.cantidad, 0);
      const totalQty = cantidad + totalOtherItems;

      if (totalQty > item.StockMinimo) {
        addToast({
          title: "Advertencia",
          description: `La cantidad total (${totalQty}) supera el stock mínimo (${item.StockMinimo})`,
          color: "warning",
        });
      }
    }

    updateItemQuantity(id, cantidad);
  };

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  const subtotal = total;

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      const isProductSearch = target?.id === "product-search-compras-input";
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) && !isProductSearch)
        return;
      if (document.querySelector('[data-slot="backdrop"]')) return;

      if (e.key === "F2") {
        e.preventDefault();
        document.getElementById("product-search-compras-input")?.focus();
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
      {/* ── MOBILE TABS ── */}
      <div className="lg:hidden flex items-center bg-transparent border-b border-slate-100 shrink-0 px-0 pt-1">
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
            <span className="ml-1 min-w-5 h-5 rounded-full bg-[#67afc3] text-white text-[10px] font-bold flex items-center justify-center px-1.5">
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
      <div className="flex flex-col lg:flex-row flex-1 gap-2 overflow-auto lg:overflow-hidden p-2 px-0">
        {/* ── LEFT: PRODUCTS ── */}
        <div
          className={`flex-1 flex flex-col gap-2 lg:overflow-hidden ${mobileTab === "productos" ? "flex" : "hidden lg:flex"}`}
        >
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center shrink-0">
            <div className="flex-1">
              <ProductSearchCompras
                onProductSelect={handleAddItem}
                onAmbiguousSearch={handleAmbiguousSearch}
              />
            </div>
          </div>

          {/* Panel con carrito / resultados de búsqueda */}
          <CompraProductosPanel
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateCosto={updateItemCosto}
            onRemoveItem={removeItem}
            searchResults={searchResults}
            searchQuery={searchQuery}
            onProductAdd={handleAddItem}
            activeTab={innerTab}
            onTabChange={setInnerTab}
            highlightedIndex={highlightedIndex}
            onHighlightChange={setHighlightedIndex}
          />
        </div>

        {/* ── RIGHT: PROVEEDOR + PAGO ── */}
        <div
          className={`w-full lg:w-[320px] xl:w-[350px] flex flex-col gap-2 shrink-0 lg:h-full lg:overflow-hidden ${mobileTab === "pago" ? "flex" : "hidden lg:flex"}`}
        >
          <CompraFooter
            subtotal={subtotal}
            total={total}
            items={items}
            handleLimpiar={clearCompra}
          />
        </div>
      </div>
    </div>
  );
}
