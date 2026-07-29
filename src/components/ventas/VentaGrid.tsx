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
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { Trash2, Minus, Plus, ShoppingBag, DollarSign, PenLine, Scale, Tag, Check, X, Percent, AlertTriangle, ScanBarcode, Gift, Package } from "lucide-react";
import { TiposVenta } from "../../../prisma/generated/prisma";
import { OrigenPrecio } from "@/store/ventaStore";
import { useQuery } from "@tanstack/react-query";

interface VentaGridProps {
  items: any[];
  onUpdateQuantity: (id: number, qty: number) => void;
  onUpdateDiscount: (id: number, discountPercent: number) => void;
  onTogglePromo: (id: number, enablePromo: boolean) => void;
  onRemoveItem: (id: number) => void;
  onChangeListaPrecios: (ids: number[], listaPrecioId: number) => void;
  onRemoveItems: (ids: number[]) => void;
  onApplyDiscount: (ids: number[], porcentaje: number) => void;
}

// ─── Item Warning Helper ────────────────────────────────────────────────────────

type WarningType = "stock" | "limit" | null;

interface ItemWarning {
  type: WarningType;
  message: string;
}

function getItemWarning(item: any): ItemWarning {
  if (item.DescuentaStock && !item.PermiteStockNegativo && item.Stock !== null) {
    const stock = parseFloat(item.Stock);
    if (!isNaN(stock)) {
      if (item.cantidad > stock) {
        return { type: "stock", message: `Sin stock suficiente (disponible: ${stock})` };
      }
      if (item.cantidad >= stock && stock > 0) {
        return { type: "stock", message: `Último stock disponible (${stock})` };
      }
    }
  }
  if (item.ActivarLimiteVenta && item.LimiteVenta > 0 && item.cantidad >= item.LimiteVenta) {
    return { type: "limit", message: `Límite de venta alcanzado (máx. ${item.LimiteVenta})` };
  }
  return { type: null, message: "" };
}

export default function VentaGrid({
  items,
  onUpdateQuantity,
  onUpdateDiscount,
  onTogglePromo,
  onRemoveItem,
  onChangeListaPrecios,
  onRemoveItems,
  onApplyDiscount,
}: VentaGridProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [bulkLista, setBulkLista] = React.useState<string>("");
  const [bulkMode, setBulkMode] = React.useState<"lista" | "descuento">("lista");
  const [bulkDescuento, setBulkDescuento] = React.useState<string>("");

  // Clear selection when items change (product removed)
  React.useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(items.map((i) => i.Id));
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size !== prev.size ? next : prev;
    });
  }, [items]);

  const { data: listas = [] } = useQuery({
    queryKey: ["listas-precios-activas"],
    queryFn: async () => {
      const res = await fetch("/api/listas-precios");
      if (!res.ok) throw new Error("Error fetching");
      const json = await res.json();
      return json.data || [];
    },
  });

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.Id)));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApplyBulkLista = () => {
    if (!bulkLista || selectedIds.size === 0) return;
    onChangeListaPrecios([...selectedIds], Number(bulkLista));
    setSelectedIds(new Set());
    setBulkLista("");
  };

  const handleCancelSelection = () => {
    setSelectedIds(new Set());
    setBulkLista("");
    setBulkDescuento("");
    setBulkMode("lista");
  };

  const handleApplyDiscount = () => {
    const pct = parseFloat(bulkDescuento);
    if (isNaN(pct) || pct <= 0 || pct > 100 || selectedIds.size === 0) return;
    onApplyDiscount([...selectedIds], pct);
    setSelectedIds(new Set());
    setBulkDescuento("");
    setBulkMode("lista");
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    onRemoveItems([...selectedIds]);
    setSelectedIds(new Set());
  };

  return (
    <div className="bg-white flex-1 h-full w-full overflow-hidden rounded-lg border border-slate-300 flex flex-col justify-start min-h-[150px]">
      {/* ── Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="shrink-0 flex flex-col gap-2 px-3 py-2.5 bg-[#67afc3]/10 border-b border-[#67afc3]/20">
          {/* Row 1: count + action tabs + delete + cancel */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#4a8fa3] shrink-0">
              {selectedIds.size} {selectedIds.size === 1 ? "seleccionado" : "seleccionados"}
            </span>

            {/* Action tabs */}
            <div className="flex items-center rounded-lg overflow-hidden border border-[#67afc3]/30 bg-white shrink-0">
              <button
                onClick={() => setBulkMode("lista")}
                className={`flex items-center gap-1 px-2.5 h-7 text-[11px] font-semibold transition-colors ${bulkMode === "lista" ? "bg-[#67afc3] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Tag size={11} />
                Lista precios
              </button>
              <button
                onClick={() => setBulkMode("descuento")}
                className={`flex items-center gap-1 px-2.5 h-7 text-[11px] font-semibold transition-colors ${bulkMode === "descuento" ? "bg-[#67afc3] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Percent size={11} />
                Descuento
              </button>
            </div>

            <div className="flex-1" />

            {/* Delete selected */}
            <Button
              size="sm"
              variant="light"
              onPress={handleDeleteSelected}
              startContent={<Trash2 size={13} />}
              className="shrink-0 h-7 px-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 text-[11px] font-semibold"
            >
              Eliminar
            </Button>

            {/* Cancel */}
            <Button
              size="sm"
              variant="light"
              onPress={handleCancelSelection}
              isIconOnly
              aria-label="Cancelar selección"
              className="shrink-0 h-7 w-7 min-w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X size={13} />
            </Button>
          </div>

          {/* Row 2: action input */}
          {bulkMode === "lista" && (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Select
                  aria-label="Cambiar lista de precios"
                  placeholder="Seleccionar lista de precios..."
                  selectedKeys={bulkLista ? [bulkLista] : []}
                  onChange={(e) => setBulkLista(e.target.value)}
                  size="sm"
                  startContent={<Tag size={13} className="text-[#67afc3]" />}
                  classNames={{
                    trigger: "bg-white border border-[#67afc3]/40 shadow-none h-8 min-h-8",
                    value: "font-semibold text-slate-700 text-[12px]",
                  }}
                >
                  {listas.map((lista: any) => (
                    <SelectItem key={lista.Id.toString()} textValue={lista.Nombre}>
                      <span className="text-[13px] font-medium">{lista.Nombre}</span>
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <Button
                size="sm"
                isDisabled={!bulkLista}
                onPress={handleApplyBulkLista}
                className="shrink-0 h-8 px-3 bg-[#67afc3] text-white text-[12px] font-semibold hover:bg-[#4a8fa3] transition-colors"
                startContent={<Check size={13} />}
              >
                Aplicar
              </Button>
            </div>
          )}

          {bulkMode === "descuento" && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-[160px]">
                <input
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.1}
                  placeholder="% descuento"
                  value={bulkDescuento}
                  onChange={(e) => setBulkDescuento(e.target.value)}
                  className="w-full h-8 pl-3 pr-8 rounded-lg border border-[#67afc3]/40 bg-white text-[12px] font-semibold text-slate-700 outline-none focus:border-[#67afc3] transition-colors appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">%</span>
              </div>
              <Button
                size="sm"
                isDisabled={!bulkDescuento || parseFloat(bulkDescuento) <= 0 || parseFloat(bulkDescuento) > 100}
                onPress={handleApplyDiscount}
                className="shrink-0 h-8 px-3 bg-[#67afc3] text-white text-[12px] font-semibold hover:bg-[#4a8fa3] transition-colors"
                startContent={<Check size={13} />}
              >
                Aplicar
              </Button>
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        /* ── Empty State ── */
        <div className="flex-1 flex flex-col items-center justify-center gap-4 select-none px-4">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <ShoppingBag size={26} className="text-slate-300" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-semibold text-slate-500">Sin productos</p>
            <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
              Escanea o busca un producto para comenzar
            </p>
          </div>

          {/* Keyboard shortcuts reference — only desktop */}
          <div className="hidden sm:flex flex-col gap-1.5 border-t border-slate-100 pt-3 w-full max-w-[220px]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 text-center mb-0.5">
              Atajos de teclado
            </p>
            {[
              { key: "F2",  label: "Buscar producto" },
              { key: "F6",  label: "Buscar cliente" },
              { key: "F10", label: "Confirmar venta" },
              { key: "Esc", label: "Cancelar venta" },
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
          {/* ── MOBILE CARD LAYOUT (<sm) ── */}
          <div className="sm:hidden flex-1 overflow-auto scrollbar-hide divide-y divide-slate-50">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.Id);
              const warning = getItemWarning(item);
              return (
                <div
                  key={item.Id}
                  className={`px-3 py-2.5 flex flex-col gap-1.5 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#67afc3]/8"
                      : warning.type
                      ? "bg-yellow-50/40"
                      : "hover:bg-slate-50/50"
                  }`}
                  onClick={() => toggleSelectOne(item.Id)}
                >
                  {/* Row 1: Checkbox + Icon + Description + Delete */}
                  <div className="flex items-start gap-1.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(item.Id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 shrink-0 h-3.5 w-3.5 rounded accent-[#67afc3] cursor-pointer"
                    />
                    <ItemIcons item={item} warning={warning} />
                    <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                      <span className="font-medium text-slate-700 text-xs leading-snug line-clamp-2">
                        {item.Descripcion}
                        {item.porcentajeDescuentoAplicado ? (
                          <span className="ml-1.5 inline-flex items-center rounded bg-pink-100 px-1.5 py-0.5 text-[9px] font-bold text-pink-700">
                            {item.porcentajeDescuentoAplicado}% OFF
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveItem(item.Id); }}
                      aria-label={`Eliminar ${item.Descripcion}`}
                      className="shrink-0 p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Row 2: Price · Quantity · Subtotal */}
                  <div className="flex items-center gap-2 pl-[30px]" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] text-slate-500 font-medium min-w-[55px]">
                      ${item.precio.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex-1 flex justify-center">
                      <QuantitySelector
                        value={item.cantidad}
                        stock={item.Stock}
                        tipoVenta={item.TipoVenta}
                        descuentaStock={item.DescuentaStock}
                        permiteStockNegativo={item.PermiteStockNegativo}
                        activarLimiteVenta={item.ActivarLimiteVenta}
                        limiteVenta={item.LimiteVenta}
                        onChange={(val) => onUpdateQuantity(item.Id, val)}
                        compact
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 min-w-[55px] text-right">
                      ${(item.precio * item.cantidad).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
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
              <TableColumn width={32} align="center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleSelectAll}
                  aria-label="Seleccionar todos"
                  className="h-3.5 w-3.5 rounded accent-[#67afc3] cursor-pointer"
                />
              </TableColumn>
              <TableColumn width={100} align="center">CÓDIGO</TableColumn>
              <TableColumn>DESCRIPCIÓN</TableColumn>
              <TableColumn width={115} align="center">CANT.</TableColumn>
              <TableColumn width={90} align="end">PRECIO</TableColumn>
              <TableColumn width={70} align="end">DTO %</TableColumn>
              <TableColumn width={90} align="end">SUBTOTAL</TableColumn>
              <TableColumn width={40} align="center">
                <span className="sr-only">ACCIONES</span>
              </TableColumn>
            </TableHeader>
            <TableBody>
            {items.map((item) => {
                const isSelected = selectedIds.has(item.Id);
                const warning = getItemWarning(item);
                return (
                  <TableRow
                    key={item.Id}
                    className={
                      isSelected
                        ? "!bg-[#67afc3]/8"
                        : warning.type
                        ? "!bg-yellow-50/40"
                        : ""
                    }
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(item.Id)}
                        aria-label={`Seleccionar ${item.Descripcion}`}
                        className="h-3.5 w-3.5 rounded accent-[#67afc3] cursor-pointer"
                      />
                    </TableCell>

                    <TableCell className="text-[10px] font-mono text-slate-400">
                      {item.Codigo.toString().padStart(6, "0")}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-start gap-2">
                        <ItemIcons item={item} warning={warning} />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-700 text-xs leading-snug mt-0.5">
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
                        activarLimiteVenta={item.ActivarLimiteVenta}
                        limiteVenta={item.LimiteVenta}
                        onChange={(val) => onUpdateQuantity(item.Id, val)}
                      />
                    </TableCell>

                    <TableCell>
                      <span className="font-medium text-slate-600 text-xs">
                        ${item.precio.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <div
                          className={`flex items-center border rounded-md px-1 transition-colors ${
                            item.precioOverride == null
                              ? "bg-cyan-50 border-[#67afc3]/30"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.porcentajeDescuentoAplicado || ''}
                            placeholder="0"
                            onChange={(e) => {
                              let val = parseFloat(e.target.value);
                              if (isNaN(val) || val < 0) val = 0;
                              if (val > 100) val = 100;
                              onUpdateDiscount(item.Id, val);
                            }}
                            className={`w-10 h-7 text-right text-[11px] font-bold outline-none bg-transparent ${
                              item.precioOverride == null ? "text-[#5293a5]" : "text-slate-700"
                            }`}
                          />
                          <span className={`text-[10px] font-bold ml-0.5 ${
                            item.precioOverride == null ? "text-[#67afc3]/70" : "text-slate-400"
                          }`}>
                            %
                          </span>
                        </div>
                        
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          className={`w-7 h-7 min-w-7 rounded-md transition-all ${
                            item.precioOverride == null
                              ? "bg-[#67afc3] text-white hover:bg-[#5293a5]"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                          title={item.precioOverride == null ? "Promo Automática (Click para fijar manual)" : "Descuento Manual (Click para usar promo automática)"}
                          onPress={() => onTogglePromo(item.Id, item.precioOverride != null)}
                        >
                          {item.precioOverride == null ? <Tag size={13} /> : <PenLine size={13} />}
                        </Button>
                      </div>
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
                );
              })}
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
  activarLimiteVenta?: boolean;
  limiteVenta?: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

function QuantitySelector({
  value,
  stock,
  tipoVenta,
  descuentaStock,
  permiteStockNegativo,
  activarLimiteVenta,
  limiteVenta,
  onChange,
  compact = false,
}: QuantitySelectorProps) {
  const [localValue, setLocalValue] = React.useState(value.toString());

  // Máximo efectivo para este ítem
  const stockMax =
    descuentaStock && !permiteStockNegativo && stock !== null
      ? parseFloat(stock)
      : null;
  const limitMax =
    activarLimiteVenta && limiteVenta && limiteVenta > 0 ? limiteVenta : null;
  const effectiveMax =
    stockMax !== null && limitMax !== null
      ? Math.min(stockMax, limitMax)
      : stockMax ?? limitMax ?? null;
  const atMax = effectiveMax !== null && value >= effectiveMax;
  const showStockLabel = descuentaStock && !permiteStockNegativo && stock !== null && !isNaN(parseFloat(stock));

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
    const max = effectiveMax !== null ? effectiveMax : 999999;
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
    <div className="flex flex-col items-center gap-0.5">
      <div className={`flex flex-row items-center border rounded-lg overflow-hidden ${height} transition-colors ${atMax ? "border-yellow-300 bg-yellow-50/40" : "border-slate-200 bg-white"}`}>
        <button
          onClick={handleMinus}
          aria-label="Reducir cantidad"
          className={`${btnSize} h-full flex items-center justify-center transition-colors ${atMax ? "text-yellow-400 hover:text-yellow-600 hover:bg-yellow-100 active:bg-yellow-200" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200"}`}
        >
          <Minus size={iconSize} strokeWidth={2.5} />
        </button>
        <div className={`h-4 w-px ${atMax ? "bg-yellow-200" : "bg-slate-200"}`} />
        <input
          type="number"
          className={`${inputWidth} h-full text-center ${fontSize} font-semibold focus:ring-0 p-0 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-slate-300 bg-transparent border-none transition-colors ${atMax ? "text-yellow-600 focus:bg-yellow-50/50" : "text-slate-700 focus:bg-blue-50/50"}`}
          value={localValue}
          onChange={handleInputChange}
          step={tipoVenta === TiposVenta.PESO ? "0.001" : "1"}
          min={0}
          placeholder="0"
        />
        <div className={`h-4 w-px ${atMax ? "bg-yellow-200" : "bg-slate-200"}`} />
        <button
          onClick={handlePlus}
          disabled={atMax}
          aria-label="Aumentar cantidad"
          className={`${btnSize} h-full flex items-center justify-center transition-colors ${atMax ? "text-yellow-400 cursor-not-allowed" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200"}`}
        >
          <Plus size={iconSize} strokeWidth={2.5} />
        </button>
      </div>
      {showStockLabel && (
        <span className={`text-[9px] font-semibold leading-none ${atMax ? "text-yellow-500" : "text-slate-400"}`}>
          Stock: {parseFloat(stock).toLocaleString("es-AR")}
        </span>
      )}
    </div>
  );
}

// ─── Item Status Icons ──────────────────────────────────────────────────────────

function ItemIcons({ item, warning }: { item: any; warning: ReturnType<typeof getItemWarning> }) {
  const icons = [];

  if (item.ingresadoPorBalanza) {
    icons.push(
      <div key="scale-scan" className="flex items-center justify-center w-[18px] h-[18px] rounded-sm bg-indigo-50 text-indigo-500 border border-indigo-200" title="Ingresado desde escáner de balanza">
        <ScanBarcode size={11} strokeWidth={2.5} />
      </div>
    );
  }

  if (item.TipoVenta === TiposVenta.PESO) {
    icons.push(
      <div key="scale-weight" className="flex items-center justify-center w-[18px] h-[18px] rounded-sm bg-violet-50 text-violet-500 border border-violet-200" title="Venta por peso">
        <Scale size={11} strokeWidth={2.5} />
      </div>
    );
  }

  if (item.precioOverride != null) {
    icons.push(
      <div key="override" className="flex items-center justify-center w-[18px] h-[18px] rounded-sm bg-amber-50 text-amber-500 border border-amber-200" title="Descuento/Precio fijado manualmente">
        <PenLine size={11} strokeWidth={2.5} />
      </div>
    );
  }

  if (item.esPromo) {
    icons.push(
      <div key="promo" className="flex items-center justify-center w-[18px] h-[18px] rounded-sm bg-pink-50 text-pink-500 border border-pink-200" title={`Promoción automática aplicada (-${item.porcentajeDescuentoAplicado}%)`}>
        <Tag size={11} strokeWidth={2.5} />
      </div>
    );
  }

  if (item.esParteDeCombo) {
    icons.push(
      <div key="combo" className="flex items-center justify-center w-[18px] h-[18px] rounded-sm bg-emerald-50 text-emerald-500 border border-emerald-200" title={`Promoción Combo aplicada: ${item.nombreCombo}`}>
        <Gift size={11} strokeWidth={2.5} />
      </div>
    );
  }

  if (item.EsCombo) {
    icons.push(
      <div key="es-combo" className="flex items-center justify-center w-[18px] h-[18px] rounded-sm bg-blue-50 text-blue-500 border border-blue-200" title="Artículo Combo (Kit)">
        <Package size={11} strokeWidth={2.5} />
      </div>
    );
  }

  if (warning.type) {
    icons.push(
      <div key="warning" className="flex items-center justify-center w-[18px] h-[18px] rounded-sm bg-yellow-50 text-yellow-600 border border-yellow-200" title={warning.message}>
        <AlertTriangle size={11} strokeWidth={2.5} />
      </div>
    );
  }

  // If no icons, show a default standard price icon
  if (icons.length === 0) {
    icons.push(
      <div key="normal" className="flex items-center justify-center w-[18px] h-[18px] rounded-sm bg-slate-50 text-slate-400 border border-slate-200" title="Precio estándar de lista">
        <DollarSign size={11} strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 shrink-0">
      {icons}
    </div>
  );
}
