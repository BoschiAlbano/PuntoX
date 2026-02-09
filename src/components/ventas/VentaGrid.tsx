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
  NumberInput,
} from "@heroui/react";
import { Trash2 } from "lucide-react";
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
  console.log(items);
  return (
    <div className="flex-1 overflow-auto min-h-0 bg-content1 rounded-medium border-1 border-default-200">
      <Table
        aria-label="Detalle de venta"
        removeWrapper
        className="h-full p-4"
        // classNames={{
        //   thead:
        //     "[&>tr]:bg-gradient-to-r [&>tr]:from-blue-500 [&>tr]:to-[#90c472]",
        //   th: "bg-transparent text-white first:rounded-l-lg last:rounded-r-lg",
        // }}
      >
        <TableHeader>
          <TableColumn width={200}>CODIGO</TableColumn>
          <TableColumn>DESCRIPCION</TableColumn>
          <TableColumn width={200} align="center">
            CANTIDAD
          </TableColumn>
          <TableColumn width={200} align="center">
            PRECIO UNIT.
          </TableColumn>
          <TableColumn width={200} align="center">
            SUBTOTAL
          </TableColumn>
          <TableColumn width={100} align="center">
            ACCIONES
          </TableColumn>
        </TableHeader>
        <TableBody emptyContent={"Escanea o busca productos para comenzar."}>
          {items.map((item) => (
            <TableRow key={item.Id} className="hover:bg-default-100">
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
                <NumberInput
                  label="Cantidad"
                  placeholder={
                    item.TipoVenta === TiposVenta.PESO ? "0,000" : "0"
                  }
                  size="sm"
                  variant="bordered"
                  minValue={0}
                  maxValue={
                    item.DescuentaStock && !item.PermiteStockNegativo
                      ? parseFloat(item.Stock)
                      : 999999
                  }
                  step={item.TipoVenta === TiposVenta.PESO ? 0.001 : 1}
                  formatOptions={{
                    minimumFractionDigits:
                      item.TipoVenta === TiposVenta.PESO ? 3 : 0,
                    maximumFractionDigits:
                      item.TipoVenta === TiposVenta.PESO ? 3 : 0,
                  }}
                  value={Number(item.cantidad) || Number(0)}
                  onValueChange={(value) => {
                    onUpdateQuantity(item.Id, Number(value));
                  }}
                  classNames={{
                    input: "text-right font-bold",
                    inputWrapper: "w-32 text-center",
                    mainWrapper: "flex flex-col items-center justify-center",
                  }}
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
                {/* <Tooltip content="Quitar item" color="danger"> */}
                <Button
                  isIconOnly
                  color="danger"
                  variant="light"
                  size="sm"
                  onPress={() => onRemoveItem(item.Id)}
                >
                  <Trash2 size={18} />
                </Button>
                {/* </Tooltip> */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
