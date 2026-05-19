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
import { TiposVenta } from "../../../prisma/generated/prisma";

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
    <div className="bg-white flex-1 overflow-hidden rounded-lg border border-slate-300 flex flex-col justify-start min-h-[150px]">
      {items.length === 0 ? (
        /* ── Empty State ── */
        <div className="flex-1 flex flex-col items-center justify-center gap-4 select-none px-4">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <ShoppingBag size={26} className="text-slate-300" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-semibold text-slate-500">Sin productos</p>
            <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
              Busca un producto para agregar a la compra
            </p>
          </div>

          {/* Keyboard shortcuts reference — only desktop */}
          <div className="hidden sm:flex flex-col gap-1.5 border-t border-slate-100 pt-3 w-full max-w-[220px]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 text-center mb-0.5">
              Atajos de teclado
            </p>
            {[
              { key: "F2",  label: "Buscar producto" },
              { key: "F6",  label: "Buscar proveedor" },
              { key: "F10", label: "Confirmar compra" },
              { key: "Esc", label: "Cancelar compra" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <kbd className="min-w-[34px] text-center px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-semibold text-slate-400 shadow-[0_1px_0_rgba(0,0,0,0.07)] shrink-0">
                  {key}
                </kbd>
                <span className="text-[11px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ── MOBILE CARD LAYOUT ── */}
          <div className="sm:hidden flex-1 overflow-auto scrollbar-hide divide-y divide-slate-50">
            {items.map((item) => (
              <div
                key={item.Id}
                className="px-3 py-2.5 flex flex-col gap-1.5 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-1.5">
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="font-medium text-slate-700 text-xs leading-snug line-clamp-2">
                      {item.Descripcion}
                    </span>
                    {item.preciosListaActualizados?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.preciosListaActualizados.map(
                          (pl: {
                            ListaPrecioId: number;
                            PorcentajeGanancia: number;
                            PrecioFinal: number;
                          }) => {
                            const original = item.PreciosLista?.find(
                              (o: { ListaPrecioId: number }) =>
                                o.ListaPrecioId === pl.ListaPrecioId,
                            );
                            const changed =
                              original &&
                              original.PrecioFinal !== pl.PrecioFinal;
                            return (
                              <span
                                key={pl.ListaPrecioId}
                                className={`text-[9px] px-1.5 py-px rounded font-medium ${
                                  changed
                                    ? "bg-[#67afc3]/10 text-[#67afc3] border border-[#67afc3]/25"
                                    : "bg-slate-50 text-slate-400"
                                }`}
                              >
                                {changed && (
                                  <span className="mr-0.5 opacity-60">→</span>
                                )}
                                ${pl.PrecioFinal.toLocaleString("es-AR")}
                              </span>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
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
                    tipoVenta={item.TipoVenta}
                    compact
                  />
                  <span className="text-[11px] font-bold text-slate-800 min-w-[55px] text-right">
                    $
                    {item.subtotal.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
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
              <TableColumn width={110} align="center">
                CÓDIGO
              </TableColumn>
              <TableColumn>DESCRIPCIÓN</TableColumn>
              <TableColumn width={120} align="center">
                COSTO UNIT.
              </TableColumn>
              <TableColumn width={115} align="center">
                CANT.
              </TableColumn>
              <TableColumn width={95} align="end">
                SUBTOTAL
              </TableColumn>
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
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-700 text-xs leading-snug">
                        {item.Descripcion}
                      </span>
                      {item.preciosListaActualizados?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.preciosListaActualizados.map(
                            (pl: {
                              ListaPrecioId: number;
                              PorcentajeGanancia: number;
                              PrecioFinal: number;
                            }) => {
                              const original = item.PreciosLista?.find(
                                (o: { ListaPrecioId: number }) =>
                                  o.ListaPrecioId === pl.ListaPrecioId,
                              );
                              const changed =
                                original &&
                                original.PrecioFinal !== pl.PrecioFinal;
                              return (
                                <span
                                  key={pl.ListaPrecioId}
                                  className={`text-[9px] px-1.5 py-px rounded font-medium ${
                                    changed
                                      ? "bg-[#67afc3]/10 text-[#67afc3] border border-[#67afc3]/25"
                                      : "bg-slate-50 text-slate-400"
                                  }`}
                                  title={`${pl.PorcentajeGanancia}% ganancia`}
                                >
                                  {changed && (
                                    <span className="mr-0.5 opacity-60">→</span>
                                  )}
                                  ${pl.PrecioFinal.toLocaleString("es-AR")}
                                </span>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
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
                      tipoVenta={item.TipoVenta}
                    />
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-slate-800 text-xs">
                      $
                      {item.subtotal.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
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
  const [isFocused, setIsFocused] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
  };

  const height = compact ? "h-7" : "h-8";
  const fontSize = compact ? "text-[10px]" : "text-[11px]";
  const containerWidth = compact ? "w-[72px]" : "w-[88px]";

  return (
    <div
      className={`inline-flex flex-row items-center border rounded-lg overflow-hidden ${height} ${containerWidth} shrink-0 transition-colors ${
        isFocused
          ? "border-[#67afc3] bg-[#67afc3]/5 shadow-sm shadow-[#67afc3]/20"
          : "border-[#67afc3]/30 bg-[#67afc3]/5"
      }`}
    >
      <span
        className={`${fontSize} text-[#67afc3] font-semibold pl-1.5 pr-0.5 shrink-0 select-none leading-none`}
      >
        $
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={0.01}
        className={`min-w-0 w-full h-full text-right ${fontSize} font-semibold focus:outline-none bg-transparent border-none pr-1.5 text-slate-700 placeholder:text-slate-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        value={value === 0 ? "" : value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
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
  tipoVenta,
  compact = false,
}: {
  value: number;
  onChange: (value: number) => void;
  tipoVenta?: string;
  compact?: boolean;
}) {
  const esPeso = tipoVenta === TiposVenta.PESO;
  const step = esPeso ? 0.001 : 1;

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
    if (!isNaN(valNum)) onChange(valNum);
    else onChange(0);
  };

  const handleMinus = () => {
    let val = Number(value) - step;
    if (esPeso) val = parseFloat(val.toFixed(3));
    onChange(Math.max(0, val));
  };

  const handlePlus = () => {
    let val = Number(value) + step;
    if (esPeso) val = parseFloat(val.toFixed(3));
    onChange(val);
  };

  const btnSize = compact ? "min-w-[24px] w-6" : "min-w-[28px] w-7";
  const inputWidth = compact ? "w-9" : "w-11";
  const height = compact ? "h-7" : "h-8";
  const iconSize = compact ? 10 : 11;
  const fontSize = compact ? "text-[10px]" : "text-[11px]";

  return (
    <div className="flex items-center justify-center">
      <div
        className={`flex flex-row items-center border border-slate-200 rounded-lg overflow-hidden bg-white ${height}`}
      >
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
          className={`${inputWidth} h-full text-center ${fontSize} font-semibold focus:ring-0 focus:bg-[#67afc3]/5 p-0 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-700 placeholder:text-slate-300 bg-transparent border-none transition-colors`}
          value={localValue}
          onChange={handleInputChange}
          step={esPeso ? "0.001" : "1"}
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
