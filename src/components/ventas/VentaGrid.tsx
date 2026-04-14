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
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { TiposVenta } from "../../../prisma/generated/prisma";

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
    <div className="bg-white flex-1 overflow-hidden py-1.5 rounded-xl border border-slate-100 flex flex-col justify-start shadow-sm min-h-[150px]">
      <Table
        aria-label="Detalle de venta"
        removeWrapper
        classNames={{
          base: "h-full flex flex-col overflow-hidden",
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
          {/* Código: oculto en mobile */}
          <TableColumn className="hidden sm:table-cell" width={110} align="center">
            CÓDIGO
          </TableColumn>
          {/* Descripción */}
          <TableColumn className="">DESCRIPCIÓN</TableColumn>
          {/* Cantidad */}
          <TableColumn className="" width={115} align="center">
            CANT.
          </TableColumn>
          {/* Precio */}
          <TableColumn className="" width={90} align="end">
            PRECIO
          </TableColumn>
          {/* Subtotal: oculto en mobile */}
          <TableColumn className="hidden sm:table-cell" width={90} align="end">
            SUBTOTAL
          </TableColumn>
          {/* Acciones */}
          <TableColumn className="" width={40} align="center">
            <span className="sr-only">ACCIONES</span>
          </TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 pointer-events-none select-none">
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
          }
        >
          {items.map((item) => (
            <TableRow key={item.Id}>
              {/* Código: oculto en mobile */}
              <TableCell className="text-[10px] font-mono text-slate-400 hidden sm:table-cell">
                {item.Codigo.toString().padStart(6, "0")}
              </TableCell>

              {/* Descripción + código en mobile */}
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-slate-700 text-xs leading-snug">
                    {item.Descripcion}
                  </span>
                  {/* En mobile: mostramos código + subtotal inline */}
                  <div className="flex items-center gap-2 sm:hidden">
                    <span className="text-[9px] text-slate-400 font-mono">
                      #{item.Codigo.toString().padStart(6, "0")}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500">
                      = ${(item.precio * item.cantidad).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {item.CodigoBarra && (
                    <span className="text-[9px] text-slate-400 font-mono tracking-wide leading-none hidden sm:block">
                      {item.CodigoBarra}
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Selector de cantidad */}
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

              {/* Precio */}
              <TableCell>
                <span className="font-medium text-slate-600 text-xs">
                  ${item.precio.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </TableCell>

              {/* Subtotal: oculto en mobile */}
              <TableCell className="hidden sm:table-cell">
                <span className="font-bold text-slate-800 text-xs">
                  ${(item.precio * item.cantidad).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </TableCell>

              {/* Eliminar */}
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
}

function QuantitySelector({
  value,
  stock,
  tipoVenta,
  descuentaStock,
  permiteStockNegativo,
  onChange,
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

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-row items-center border border-slate-200 rounded-lg overflow-hidden bg-white h-8">
        <button
          onClick={handleMinus}
          aria-label="Reducir cantidad"
          className="min-w-[28px] w-7 h-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <Minus size={11} strokeWidth={2.5} />
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <input
          type="number"
          className="w-11 h-full text-center text-[11px] font-semibold focus:ring-0 focus:bg-blue-50/50 p-0 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-700 placeholder:text-slate-300 bg-transparent border-none transition-colors"
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
          className="min-w-[28px] w-7 h-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <Plus size={11} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
