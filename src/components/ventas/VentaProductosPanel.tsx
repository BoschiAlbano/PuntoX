"use client";

import React from "react";
import { Spinner } from "@heroui/react";
import { ArrowLeft, Search, Package } from "lucide-react";
import { Producto } from "@/lib/validations/producto.schema";
import { Item } from "@/store/ventaStore";
import VentaGrid from "./VentaGrid";
import { VentaProductoCard } from "./VentaProductoCard";

interface VentaProductosPanelProps {
  // Carrito
  items: Item[];
  onUpdateQuantity: (id: number, cantidad: number) => void;
  onUpdateDiscount: (id: number, descuento: number) => void;
  onTogglePromo: (id: number, enablePromo: boolean) => void;
  onRemoveItem: (id: number) => void;
  onChangeListaPrecios: (ids: number[], listaPrecioId: number) => void;
  onRemoveItems: (ids: number[]) => void;
  onApplyDiscount: (ids: number[], descuento: number) => void;

  // Búsqueda
  searchResults: Producto[];
  isSearching: boolean;
  searchQuery: string;
  onProductAdd: (producto: Producto) => void;

  // Tab activo controlado desde afuera
  activeTab: "carrito" | "buscar";
  onTabChange: (tab: "carrito" | "buscar") => void;

  // Navegación por teclado en resultados
  highlightedIndex: number;
  onHighlightChange: (index: number) => void;
}

export default function VentaProductosPanel({
  items,
  onUpdateQuantity,
  onUpdateDiscount,
  onTogglePromo,
  onRemoveItem,
  onChangeListaPrecios,
  onRemoveItems,
  onApplyDiscount,
  searchResults,
  isSearching,
  searchQuery,
  onProductAdd,
  activeTab,
  onTabChange,
  highlightedIndex,
  onHighlightChange,
}: VentaProductosPanelProps) {
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
      <div className="flex-1 min-h-0 h-full w-full pt-2 flex flex-col overflow-hidden">
        {activeTab === "carrito" ? (
          <VentaGrid
            items={items}
            onUpdateQuantity={onUpdateQuantity}
            onUpdateDiscount={onUpdateDiscount}
            onTogglePromo={onTogglePromo}
            onRemoveItem={onRemoveItem}
            onChangeListaPrecios={onChangeListaPrecios}
            onRemoveItems={onRemoveItems}
            onApplyDiscount={onApplyDiscount}
          />
        ) : (
          <div className="flex-1 min-h-0 h-full w-full overflow-y-auto">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                <Spinner size="sm" color="current" className="text-[#67afc3]" />
                <p className="text-sm font-medium">Buscando productos...</p>
              </div>
            ) : searchQuery.trim().length === 0 ? (
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
                  <VentaProductoCard
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
