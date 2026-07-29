"use client";

import React from "react";
import { ArrowLeft, Search, Package } from "lucide-react";
import { Producto } from "@/lib/validations/producto.schema";
import { ItemCompra } from "@/store/useCompraStore";
import CompraGrid from "./CompraGrid";
import { CompraProductoCard } from "./CompraProductoCard";

interface CompraProductosPanelProps {
  // Carrito
  items: ItemCompra[];
  onUpdateQuantity: (id: number, cantidad: number) => void;
  onUpdateCosto: (id: number, costo: number) => void;
  onRemoveItem: (id: number) => void;

  // Búsqueda
  searchResults: Producto[];
  searchQuery: string;
  onProductAdd: (producto: Producto) => void;

  // Tab activo controlado desde afuera
  activeTab: "carrito" | "buscar";
  onTabChange: (tab: "carrito" | "buscar") => void;

  // Navegación por teclado en resultados
  highlightedIndex: number;
  onHighlightChange: (index: number) => void;
}

export default function CompraProductosPanel({
  items,
  onUpdateQuantity,
  onUpdateCosto,
  onRemoveItem,
  searchResults,
  searchQuery,
  onProductAdd,
  activeTab,
  onTabChange,
  highlightedIndex,
  onHighlightChange,
}: CompraProductosPanelProps) {
  return (
    <div className="flex-1 min-h-0 h-full w-full flex flex-col">
      {/* ── Volver al carrito (solo visible mientras se ven resultados de búsqueda) ── */}
      {activeTab === "buscar" && (
        <div className="flex items-center shrink-0 pb-2">
          <button
            onClick={() => onTabChange("carrito")}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#67afc3] hover:text-[#5293a5] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Volver al carrito</span>
            {items.length > 0 && (
              <span className="min-w-4.5 h-4.5 rounded-full bg-[#67afc3] text-white text-[10px] font-bold flex items-center justify-center px-1">
                {items.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Content Area ── */}
      <div className="flex-1 min-h-0 h-full w-full flex flex-col overflow-hidden">
        {activeTab === "carrito" ? (
          <CompraGrid
            items={items}
            onUpdateQuantity={onUpdateQuantity}
            onUpdateCosto={onUpdateCosto}
            onRemoveItem={onRemoveItem}
          />
        ) : (
          <div className="flex-1 min-h-0 h-full w-full overflow-y-auto">
            {searchQuery.trim().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                <div className="p-3 bg-slate-50 rounded-full">
                  <Search className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-center">
                  Buscá un producto usando el campo de arriba
                </p>
                <p className="text-xs text-slate-300 text-center">
                  Ingresá un nombre, código o escaneá un código de barras
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                <div className="p-3 bg-slate-50 rounded-full">
                  <Package className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-center">
                  No se encontraron productos
                </p>
                <p className="text-xs text-slate-300 text-center">
                  Intentá con otro término de búsqueda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 pb-2">
                {searchResults.map((producto, index) => (
                  <CompraProductoCard
                    key={producto.Id}
                    item={producto}
                    onAdd={onProductAdd}
                    isHighlighted={index === highlightedIndex}
                    onMouseEnter={() => onHighlightChange(index)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
