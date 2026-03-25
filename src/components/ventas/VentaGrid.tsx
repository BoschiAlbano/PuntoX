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
import { Trash2, Minus, Plus } from "lucide-react";
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
    <div className="flex-1 overflow-hidden py-1.5 rounded-xl border border-slate-100 flex flex-col justify-start shadow-sm min-h-[150px]">
      <Table
        aria-label="Detalle de venta"
        removeWrapper
        classNames={{
          base: "h-full flex flex-col overflow-hidden",
          table: "min-h-0",
          thead: "sticky top-0 z-20 shrink-0",
          th: "bg-transparent text-slate-500 font-semibold text-[10px] tracking-wider border-b border-slate-100 h-8 px-2 py-0 first:rounded-l-none last:rounded-r-none",
          tr: "hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none h-fit",
          td: "py-1.5 px-2",
          emptyWrapper: "h-full w-full block",
        }}
        className="h-full overflow-auto scrollbar-hide"
      >
        <TableHeader>
          <TableColumn
            className="hidden sm:table-cell"
            width={120}
            align="center"
          >
            CÓDIGO
          </TableColumn>
          <TableColumn className="">DESCRIPCIÓN</TableColumn>
          <TableColumn className="" width={120} align="center">
            CANTIDAD
          </TableColumn>
          <TableColumn className="" width={90} align="center">
            PRECIO
          </TableColumn>
          <TableColumn
            className="hidden sm:table-cell"
            width={90}
            align="center"
          >
            SUBTOTAL
          </TableColumn>
          <TableColumn className="" width={40} align="center">
            <span className="sr-only">ACCIONES</span>
          </TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 pointer-events-none">
              <div className="p-4 bg-slate-50 rounded-full mb-2">
                <Plus size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium">
                No hay productos en la venta
              </p>
              <p className="text-xs">
                Escanea un código de barras o busca un producto
              </p>
            </div>
          }
        >
          {items.map((item) => (
            <TableRow key={item.Id}>
              <TableCell className="text-[10px] font-mono text-slate-400 hidden sm:table-cell">
                {item.Codigo.toString().padStart(6, "0")}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-slate-700 text-xs leading-tight">
                    {item.Descripcion}
                  </span>
                  {item.CodigoBarra && (
                    <span className="text-[9px] text-slate-400 font-mono tracking-wide leading-none">
                      {item.CodigoBarra}
                    </span>
                  )}
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
                  $
                  {item.precio.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <span className="font-bold text-slate-800 text-xs">
                  $
                  {(item.precio * item.cantidad).toLocaleString("es-AR", {
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
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 min-w-8 w-8 h-8"
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
  // Inicializamos con string para permitir edición flexible
  // value.toString() puede ser "0", "1.5", etc.
  const [localValue, setLocalValue] = React.useState(value.toString());

  // Efecto para sincronizar cambios externos (ej: botones + / - o prop changes)
  React.useEffect(() => {
    // Si el valor numérico del input local coincide con el valor externo,
    // NO actualizamos el string local.
    // Esto previene que si escribo "1." (numéricamente 1), se reescriba a "1" perdiendo el punto.
    // También previene que si borro todo (""), se reescriba a "0" inmediatamente.
    const parsedLocal = parseFloat(localValue);

    // Si la prop value es 0, y mi localValue es "" (vacío), quiero mantenerlo vacío
    // para que el usuario pueda escribir, NO forzar "0".
    if (value === 0 && localValue === "") return;

    // Si el valor numérico es igual, no toco el texto (dejo que el usuario siga escribiendo)
    if (parsedLocal === value) return;

    // Si son diferentes, entonces sí actualizo (ej: se pulsó el botón +)
    setLocalValue(value.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Solo dependemos de value, localValue es para la condición

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setLocalValue(valStr); // Actualizamos la vista inmediatamente

    const valNum = parseFloat(valStr);

    // A nivel de datos, notificamos el cambio
    if (!isNaN(valNum)) {
      onChange(valNum);
    } else {
      // Si el input no es número (ej: vacío), notificamos 0 para cálculos,
      // pero el input visual (localValue) se queda como esté (ej: vacío)
      onChange(0);
    }
  };

  const handleMinus = () => {
    const step = tipoVenta === TiposVenta.PESO ? 0.001 : 1;
    let val = Number(value) - step;
    if (tipoVenta === TiposVenta.PESO) {
      // Redondeo estricto para evitar problemas de punto flotante
      val = parseFloat(val.toFixed(3));
    }
    const newValue = Math.max(0, val);
    onChange(newValue);
    // Nota: El useEffect se encargará de actualizar localValue porque newValue será distinto
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
      <div className="flex flex-row items-center border border-slate-200 rounded-md p-1 bg-white h-7">
        <button
          onClick={handleMinus}
          className="w-6 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
        >
          <Minus size={12} strokeWidth={2.5} />
        </button>
        <div className="h-3 w-px bg-slate-200 mx-0.5"></div>
        <input
          type="number"
          className="w-10 h-full text-center text-[11px] font-semibold focus:ring-0 p-0 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-700 placeholder:text-slate-300 bg-transparent border-none"
          value={localValue}
          onChange={handleInputChange}
          step={tipoVenta === TiposVenta.PESO ? "0.001" : "1"}
          min={0}
          placeholder="0"
        />
        <div className="h-3 w-px bg-slate-200 mx-0.5"></div>
        <button
          onClick={handlePlus}
          className="w-6 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
        >
          <Plus size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
