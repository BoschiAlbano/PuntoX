"use client";

import { useEffect, useRef } from "react";
import { Producto } from "@/lib/validations/producto.schema";
import { Plus } from "lucide-react";
import { useVentaStore } from "@/store/ventaStore";

const PLACEHOLDER_IMG = "/producto-placeholder.svg";

interface VentaProductoCardProps {
  item: Producto;
  onAdd: (item: Producto) => void;
  isHighlighted?: boolean;
  onMouseEnter?: () => void;
}

export function VentaProductoCard({
  item,
  onAdd,
  isHighlighted = false,
  onMouseEnter,
}: VentaProductoCardProps) {
  const { listaPrecios } = useVentaStore();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isHighlighted) {
      buttonRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isHighlighted]);

  const precio =
    item.PreciosLista?.find(
      (p) => Number(p.ListaPrecioId) === Number(listaPrecios),
    )?.PrecioFinal ||
    item.PrecioCosto ||
    0;

  const stock = item.Stock ?? 0;
  const stockMinimo = item.StockMinimo ?? 0;
  const isLowStock = stockMinimo > 0 && stock <= stockMinimo;
  const sinStock = stock <= 0;

  return (
    <button
      ref={buttonRef}
      onClick={() => onAdd(item)}
      onMouseEnter={onMouseEnter}
      className={`group w-full text-left bg-white rounded-xl border overflow-hidden hover:border-[#67afc3]/60 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#67afc3]/40 ${
        isHighlighted
          ? "border-[#67afc3] ring-2 ring-[#67afc3]/40 shadow-md"
          : "border-slate-200"
      }`}
    >
      {/* Foto */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        <img
          src={item.Foto || PLACEHOLDER_IMG}
          alt={item.Descripcion}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
          }}
        />
        {/* Stock badge */}
        <div className="absolute bottom-1.5 right-1.5">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm ${
              sinStock
                ? "bg-red-100 text-red-600"
                : isLowStock
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-50 text-emerald-600"
            }`}
          >
            Stock: {stock}
          </span>
        </div>
        {/* Botón agregar overlay */}
        <div className="absolute inset-0 bg-[#67afc3]/0 group-hover:bg-[#67afc3]/10 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#67afc3] text-white rounded-full p-2 shadow-lg">
            <Plus size={16} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p
          className="text-xs font-semibold text-slate-700 leading-tight line-clamp-2 group-hover:text-[#67afc3] transition-colors min-h-[2.4em]"
          title={item.Descripcion}
        >
          {item.Descripcion}
        </p>
        {(item.Marca?.Descripcion || item.Rubro?.Descripcion) && (
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            {[item.Marca?.Descripcion, item.Rubro?.Descripcion]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span className="text-sm font-bold text-slate-800">
            $
            {Number(precio).toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            #{item.Codigo}
          </span>
        </div>
      </div>
    </button>
  );
}
