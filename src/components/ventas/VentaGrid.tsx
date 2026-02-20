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
    <div className="flex-1 overflow-auto min-h-0 bg-content1 shadow-sm rounded-lg">
      <Table aria-label="Detalle de venta" removeWrapper className="h-full p-4">
        <TableHeader>
          <TableColumn className="bg-[#7dbbcc] text-white" width={100}>
            CODIGO
          </TableColumn>
          <TableColumn className="bg-[#7dbbcc] text-white">
            DESCRIPCION
          </TableColumn>
          <TableColumn
            className="bg-[#7dbbcc] text-white"
            width={100}
            align="center"
          >
            CANTIDAD
          </TableColumn>
          <TableColumn
            className="bg-[#7dbbcc] text-white"
            width={100}
            align="center"
          >
            PRECIO UNIT.
          </TableColumn>
          <TableColumn
            className="bg-[#7dbbcc] text-white"
            width={100}
            align="center"
          >
            SUBTOTAL
          </TableColumn>
          <TableColumn
            className="bg-[#7dbbcc] text-white"
            width={50}
            align="center"
          >
            ACCIONES
          </TableColumn>
        </TableHeader>
        <TableBody emptyContent={"Escanea o busca productos para comenzar."}>
          {items.map((item) => (
            <TableRow key={item.Id} className="hover:bg-[#7dbbcc50]">
              <TableCell>{item.Codigo.toString().padStart(6, "0")}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold">{item.Descripcion}</span>
                  {item.CodigoBarra && (
                    <span className="text-xs text-default-400">
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
                <span className="font-mono">${item.precio.toFixed(2)}</span>
              </TableCell>
              <TableCell>
                <span className="font-mono font-bold text-[#67afc3]">
                  $
                  {(item.precio.toFixed(2) * item.cantidad.toFixed(2)).toFixed(
                    2,
                  )}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  isIconOnly
                  color="danger"
                  variant="light"
                  size="sm"
                  onPress={() => onRemoveItem(item.Id)}
                >
                  <Trash2 size={18} />
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
    <div className="flex items-center gap-1 justify-center rounded-2xl">
      <div className="flex flex-row items-center h-8 w-fit overflow-hidden gap-1">
        <button
          onClick={handleMinus}
          className="w-7 h-7 flex items-center justify-center text-white transition-colors active:bg-[#5a99ab] hover:bg-[#6cb6ca] rounded-full bg-[#7dbbcc]"
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
        <input
          type="number"
          className="w-20 h-full text-center text-sm font-bold focus:ring-0 p-0 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none  text-slate-700 border border-[#7dbbcc] shadow-sm rounded-2xl"
          value={localValue}
          onChange={handleInputChange}
          step={tipoVenta === TiposVenta.PESO ? "0.001" : "1"}
          min={0}
          placeholder="0"
        />
        <button
          onClick={handlePlus}
          className="w-7 h-7 flex items-center justify-center text-white transition-colors active:bg-[#5a99ab] hover:bg-[#6cb6ca] rounded-full bg-[#7dbbcc]"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
