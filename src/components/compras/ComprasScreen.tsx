"use client";

import { useState } from "react";
import { ShoppingCart, CreditCard } from "lucide-react";
import { addToast } from "@heroui/react";

import ProductSearchCompras from "./ProductSearchCompras";
import CompraGrid from "./CompraGrid";
import CompraFooter from "./CompraFooter";
import { Producto } from "@/lib/validations/producto.schema";
import { useCompraStore } from "@/store/useCompraStore";

type MobileTab = "productos" | "pago";

export default function ComprasScreen() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("productos");

  const {
    items,
    addItem,
    updateItemQuantity,
    updateItemCosto,
    removeItem,
    clearCompra,
  } = useCompraStore();

  // ProductSearch puede pasar hasta 4 args: (producto, cantidad?, precioOverride?, origenPrecio?)
  // En compras ignoramos precioOverride/origenPrecio y siempre usamos PrecioCosto como default
  const handleAddItem = (producto: Producto, cantidad: number = 1) => {
    try {
      // Pre-cargar el costo del artículo desde su PrecioCosto
      const costoDefault = Number(producto.PrecioCosto ?? 0);
      addItem(producto, cantidad, costoDefault);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      addToast({ title: "Error", description: message, color: "danger" });
    }
  };

  const handleUpdateQuantity = (id: number, cantidad: number) => {
    if (cantidad <= 0) return;
    updateItemQuantity(id, cantidad);
  };

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  const subtotal = total;

  return (
    <div className="h-full w-full flex flex-col gap-0">
      {/* ── MOBILE TABS ── */}
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
        {/* ── LEFT: PRODUCTS ── */}
        <div className={`flex-1 flex flex-col gap-2 lg:overflow-hidden rounded-xl ${mobileTab === "productos" ? "flex" : "hidden lg:flex"}`}>
          {/* Toolbar */}
          <div className="bg-white p-2 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-0 items-stretch sm:items-center shrink-0 relative shadow-sm">
            <div className="flex-1">
              <ProductSearchCompras onProductSelect={handleAddItem} />
            </div>
          </div>

          {/* Grilla */}
          <CompraGrid
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateCosto={updateItemCosto}
            onRemoveItem={removeItem}
          />
        </div>

        {/* ── RIGHT: PROVEEDOR + PAGO ── */}
        <div className={`w-full lg:w-[320px] xl:w-[350px] flex flex-col gap-2 shrink-0 lg:h-full lg:overflow-hidden ${mobileTab === "pago" ? "flex" : "hidden lg:flex"}`}>
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
