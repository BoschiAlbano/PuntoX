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
import { ItemCompra } from "@/store/useCompraStore";

interface CompraGridProps {
  items: ItemCompra[];
  onUpdateQuantity: (id: number, qty: number) => void;
  onUpdateCosto: (id: number, costo: number) => void;
  onRemoveItem: (id: number) => void;
}

export default function CompraGrid({
  items,
  onUpdateQuantity,
  onUpdateCosto,
  onRemoveItem,
}: CompraGridProps) {
  return (
    <div className="bg-white flex-1 overflow-hidden rounded-xl border border-slate-100 flex flex-col justify-start shadow-sm min-h-[150px]">
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 pointer-events-none select-none">
          <div className="p-5 bg-slate-50 rounded-2xl">
            <ShoppingBag size={28} className="text-slate-300" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-semibold text-slate-500">Sin productos</p>
            <p className="text-xs text-slate-400 text-center max-w-[220px] leading-relaxed">
              Busca un producto para agregar a la compra
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── MOBILE CARD LAYOUT ── */}
          <div className="sm:hidden flex-1 overflow-auto scrollbar-hide divide-y divide-slate-50">
            {items.map((item) => (
              <div key={item.Id} className="px-3 py-2.5 flex flex-col gap-1.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-1.5">
                  <span className="flex-1 font-medium text-slate-700 text-xs leading-snug line-clamp-2">
                    {item.Descripcion}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.Id)}
                    className="shrink-0 p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2 pl-2">
                  <CostoInput
                    value={item.costoUnitario}
                    onChange={(v) => onUpdateCosto(item.Id, v)}
                    compact
                  />
                  <QuantitySelector
                    value={item.cantidad}
                    onChange={(val) => onUpdateQuantity(item.Id, val)}
                    compact
                  />
                  <span className="text-[11px] font-bold text-slate-800 min-w-[55px] text-right">
                    ${item.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── DESKTOP TABLE LAYOUT ── */}
          <Table
            aria-label="Detalle de compra"
            removeWrapper
            classNames={{
              base: "h-full flex-col overflow-hidden hidden sm:flex",
              table: "min-h-0",
              thead: "sticky top-0 z-20 shrink-0",
              th: "bg-transparent text-slate-400 font-semibold text-[10px] tracking-wider border-b border-slate-100 h-8 px-2 py-0 first:rounded-l-none last:rounded-r-none uppercase",
              tr: "hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-none",
              td: "py-2 px-2",
            }}
            className="h-full overflow-auto scrollbar-hide"
          >
            <TableHeader>
              <TableColumn width={110} align="center">CÓDIGO</TableColumn>
              <TableColumn>DESCRIPCIÓN</TableColumn>
              <TableColumn width={120} align="center">COSTO UNIT.</TableColumn>
              <TableColumn width={115} align="center">CANT.</TableColumn>
              <TableColumn width={95} align="end">SUBTOTAL</TableColumn>
              <TableColumn width={40} align="center">
                <span className="sr-only">ACCIONES</span>
              </TableColumn>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.Id}>
                  <TableCell className="text-[10px] font-mono text-slate-400">
                    {item.Codigo?.toString().padStart(6, "0")}
                  </TableCell>

                  <TableCell>
                    <span className="font-medium text-slate-700 text-xs leading-snug">
                      {item.Descripcion}
                    </span>
                  </TableCell>

                  <TableCell>
                    <CostoInput
                      value={item.costoUnitario}
                      onChange={(v) => onUpdateCosto(item.Id, v)}
                    />
                  </TableCell>

                  <TableCell>
                    <QuantitySelector
                      value={item.cantidad}
                      onChange={(val) => onUpdateQuantity(item.Id, val)}
                    />
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-slate-800 text-xs">
                      ${item.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Button
                      isIconOnly
                      color="danger"
                      variant="light"
                      size="sm"
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

// ─── Costo Input ────────────────────────────────────────────────────────────────

function CostoInput({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  // Mostramos el valor formateado; solo cuando el usuario está editando mostramos el raw
  const [local, setLocal] = React.useState(() => value.toFixed(2));
  const [isFocused, setIsFocused] = React.useState(false);

  // Cada vez que el valor externo cambie y el campo no esté en edición → actualizar el display
  React.useEffect(() => {
    if (!isFocused) {
      setLocal(value.toFixed(2));
    }
  // Solo react a cambios del `value` externo; isFocused es referencia estable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Seleccionar todo el texto al enfocar para facilitar reemplazo
    e.target.select();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Solo permitir dígitos, punto y coma decimal
    if (/^[0-9]*[.,]?[0-9]*$/.test(raw) || raw === "") {
      setLocal(raw.replace(",", "."));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(local.replace(",", "."));
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
      setLocal(parsed.toFixed(2));
    } else {
      // Restaurar el valor previo
      setLocal(value.toFixed(2));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const height = compact ? "h-7" : "h-8";
  const fontSize = compact ? "text-[10px]" : "text-[11px]";
  // Ancho fijo según modo: suficiente para "$ 9999.99"
  const containerWidth = compact ? "w-[68px]" : "w-[82px]";

  return (
    <div
      className={`inline-flex flex-row items-center border rounded-lg overflow-hidden ${height} ${containerWidth} shrink-0 transition-colors ${
        isFocused
          ? "border-amber-400 bg-amber-50 shadow-sm shadow-amber-100"
          : "border-amber-200 bg-amber-50/50"
      }`}
    >
      {/* Signo $ fijo a la izquierda — nunca se mueve */}
      <span
        className={`${fontSize} text-amber-500 font-semibold pl-1.5 pr-0.5 shrink-0 select-none leading-none`}
      >
        $
      </span>

      {/* Input de texto con validación numérica */}
      <input
        type="text"
        inputMode="decimal"
        className={`min-w-0 w-full h-full text-right ${fontSize} font-semibold focus:outline-none bg-transparent border-none pr-1.5 text-amber-700 placeholder:text-amber-300`}
        value={local}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="0.00"
        aria-label="Costo unitario"
      />
    </div>
  );
}

// ─── Quantity Selector ──────────────────────────────────────────────────────────

function QuantitySelector({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}) {
  const [localValue, setLocalValue] = React.useState(value.toString());

  React.useEffect(() => {
    const parsedLocal = parseFloat(localValue);
    if (parsedLocal !== value) setLocalValue(value.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setLocalValue(valStr);
    const valNum = parseFloat(valStr);
    if (!isNaN(valNum)) onChange(valNum);
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
          onClick={() => onChange(Math.max(0.001, value - 1))}
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
          min={0.001}
          step={1}
          placeholder="0"
        />
        <div className="h-4 w-px bg-slate-200" />
        <button
          onClick={() => onChange(value + 1)}
          className={`${btnSize} h-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors`}
        >
          <Plus size={iconSize} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
