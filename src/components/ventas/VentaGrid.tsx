"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@heroui/react";
import { Trash2, Minus, Plus, ShoppingBag, DollarSign, PenLine, Scale } from "lucide-react";
import { TiposVenta } from "../../../prisma/generated/prisma";
import { OrigenPrecio } from "@/store/ventaStore";

interface VentaGridProps {
  items: any[];
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemoveItem: (id: number) => void;
}

export default function VentaGrid({
  items,
  onUpdateQuantity,
  onRemoveItem,
}: VentaGridProps) {
  return (
    <div className="bg-white flex-1 overflow-hidden rounded-xl border border-slate-100 flex flex-col justify-start shadow-sm min-h-[150px]">
      {items.length === 0 ? (
        /* ── Empty State ── */
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 pointer-events-none select-none">
          <div className="p-5 bg-slate-50 rounded-2xl">
            <ShoppingBag size={28} className="text-slate-300" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-semibold text-slate-500">
              Sin productos
            </p>
            <p className="text-xs text-slate-400 text-center max-w-[220px] leading-relaxed">
              Escanea un código de barras o busca un producto para comenzar
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── MOBILE CARD LAYOUT (<sm) ── */}
          <div className="sm:hidden flex-1 overflow-auto scrollbar-hide divide-y divide-slate-50">
            {items.map((item) => (
              <div key={item.Id} className="px-3 py-2.5 flex flex-col gap-1.5 hover:bg-slate-50/50 transition-colors">
                {/* Row 1: Icon + Description + Delete */}
                <div className="flex items-start gap-1.5">
                  <PriceOriginIcon origenPrecio={item.origenPrecio} tipoVenta={item.TipoVenta} />
                  <span className="flex-1 font-medium text-slate-700 text-xs leading-snug line-clamp-2">
                    {item.Descripcion}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.Id)}
                    aria-label={`Eliminar ${item.Descripcion}`}
                    className="shrink-0 p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Row 2: Price · Quantity · Subtotal */}
                <div className="flex items-center gap-2 pl-[18px]">
                  {/* Precio unitario */}
                  <span className="text-[11px] text-slate-500 font-medium min-w-[55px]">
                    ${item.precio.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>

                  {/* Quantity selector compact */}
                  <div className="flex-1 flex justify-center">
                    <QuantitySelector
                      value={item.cantidad}
                      stock={item.Stock}
                      tipoVenta={item.TipoVenta}
                      descuentaStock={item.DescuentaStock}
                      permiteStockNegativo={item.PermiteStockNegativo}
                      onChange={(val) => onUpdateQuantity(item.Id, val)}
                      compact
                    />
                  </div>

                  {/* Subtotal */}
                  <span className="text-[11px] font-bold text-slate-800 min-w-[55px] text-right">
                    ${(item.precio * item.cantidad).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── DESKTOP TABLE LAYOUT (sm+) ── */}
          <Table
            aria-label="Detalle de venta"
            removeWrapper
            classNames={{
              base: "h-full flex-col overflow-hidden hidden sm:flex",
              table: "min-h-0",
              thead: "sticky top-0 z-20 shrink-0",
              th: "bg-transparent text-slate-400 font-semibold text-[10px] tracking-wider border-b border-slate-100 h-8 px-2 py-0 first:rounded-l-none last:rounded-r-none uppercase",
              tr: "hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-none",
              td: "py-2 px-2",
              emptyWrapper: "h-full w-full block",
            }}
            className="h-full overflow-auto scrollbar-hide"
          >
            <TableHeader>
              <TableColumn width={110} align="center">CÓDIGO</TableColumn>
              <TableColumn>DESCRIPCIÓN</TableColumn>
              <TableColumn width={115} align="center">CANT.</TableColumn>
              <TableColumn width={90} align="end">PRECIO</TableColumn>
              <TableColumn width={90} align="end">SUBTOTAL</TableColumn>
              <TableColumn width={40} align="center">
                <span className="sr-only">ACCIONES</span>
              </TableColumn>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.Id}>
                  <TableCell className="text-[10px] font-mono text-slate-400">
                    {item.Codigo.toString().padStart(6, "0")}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-start gap-1.5">
                      <PriceOriginIcon origenPrecio={item.origenPrecio} tipoVenta={item.TipoVenta} />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-700 text-xs leading-snug">
                          {item.Descripcion}
                        </span>
                        {item.CodigoBarra && (
                          <span className="text-[9px] text-slate-400 font-mono tracking-wide leading-none">
                            {item.CodigoBarra}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <QuantitySelector
                      value={item.cantidad}
                      stock={item.Stock}
                      tipoVenta={item.TipoVenta}
                      descuentaStock={item.DescuentaStock}
                      permiteStockNegativo={item.PermiteStockNegativo}
                      onChange={(val) => onUpdateQuantity(item.Id, val)}
                    />
                  </TableCell>

                  <TableCell>
                    <span className="font-medium text-slate-600 text-xs">
                      ${item.precio.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-slate-800 text-xs">
                      ${(item.precio * item.cantidad).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Button
                      isIconOnly
                      color="danger"
                      variant="light"
                      size="sm"
                      aria-label={`Eliminar ${item.Descripcion}`}
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50 min-w-8 w-8 h-8 transition-colors"
                      onPress={() => onRemoveItem(item.Id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

// ─── Quantity Selector ──────────────────────────────────────────────────────────

interface QuantitySelectorProps {
  value: number;
  stock: any;
  tipoVenta: string;
  descuentaStock: boolean;
  permiteStockNegativo: boolean;
  onChange: (value: number) => void;
  compact?: boolean;
}

function QuantitySelector({
  value,
  stock,
  tipoVenta,
  descuentaStock,
  permiteStockNegativo,
  onChange,
  compact = false,
}: QuantitySelectorProps) {
  const [localValue, setLocalValue] = React.useState(value.toString());

  React.useEffect(() => {
    const parsedLocal = parseFloat(localValue);
    if (value === 0 && localValue === "") return;
    if (parsedLocal === value) return;
    setLocalValue(value.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setLocalValue(valStr);
    const valNum = parseFloat(valStr);
    if (!isNaN(valNum)) {
      onChange(valNum);
    } else {
      onChange(0);
    }
  };

  const handleMinus = () => {
    const step = tipoVenta === TiposVenta.PESO ? 0.001 : 1;
    let val = Number(value) - step;
    if (tipoVenta === TiposVenta.PESO) {
      val = parseFloat(val.toFixed(3));
    }
    const newValue = Math.max(0, val);
    onChange(newValue);
  };

  const handlePlus = () => {
    const step = tipoVenta === TiposVenta.PESO ? 0.001 : 1;
    const max =
      descuentaStock && !permiteStockNegativo ? parseFloat(stock) : 999999;
    let val = Number(value) + step;
    if (tipoVenta === TiposVenta.PESO) {
      val = parseFloat(val.toFixed(3));
    }
    const newValue = Math.min(max, val);
    onChange(newValue);
  };

  const btnSize = compact ? "min-w-[24px] w-6" : "min-w-[28px] w-7";
  const inputWidth = compact ? "w-9" : "w-11";
  const height = compact ? "h-7" : "h-8";
  const iconSize = compact ? 10 : 11;
  const fontSize = compact ? "text-[10px]" : "text-[11px]";

  return (
    <div className="flex items-center justify-center">
      <div className={`flex flex-row items-center border border-slate-200 rounded-lg overflow-hidden bg-white ${height}`}>
        <button
          onClick={handleMinus}
          aria-label="Reducir cantidad"
          className={`${btnSize} h-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors`}
        >
          <Minus size={iconSize} strokeWidth={2.5} />
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <input
          type="number"
          className={`${inputWidth} h-full text-center ${fontSize} font-semibold focus:ring-0 focus:bg-blue-50/50 p-0 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-700 placeholder:text-slate-300 bg-transparent border-none transition-colors`}
          value={localValue}
          onChange={handleInputChange}
          step={tipoVenta === TiposVenta.PESO ? "0.001" : "1"}
          min={0}
          placeholder="0"
        />
        <div className="h-4 w-px bg-slate-200" />
        <button
          onClick={handlePlus}
          aria-label="Aumentar cantidad"
          className={`${btnSize} h-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors`}
        >
          <Plus size={iconSize} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ─── Price Origin Icon ──────────────────────────────────────────────────────────

function PriceOriginIcon({ origenPrecio, tipoVenta }: { origenPrecio?: OrigenPrecio; tipoVenta?: string }) {
  // Prioridad: precio alternativo > tipo de venta por peso > normal
  if (origenPrecio === "alternativo") {
    return (
      <span className="shrink-0 mt-[2px] text-amber-500" title="Precio alternativo">
        <PenLine size={12} strokeWidth={2} />
      </span>
    );
  }

  if (tipoVenta === TiposVenta.PESO) {
    return (
      <span className="shrink-0 mt-[2px] text-violet-500" title="Producto por peso">
        <Scale size={12} strokeWidth={2} />
      </span>
    );
  }

  return (
    <span className="shrink-0 mt-[2px] text-emerald-500" title="Precio de lista">
      <DollarSign size={12} strokeWidth={2} />
    </span>
  );
}
