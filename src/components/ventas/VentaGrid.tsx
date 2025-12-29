"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Tooltip,
} from "@heroui/react";
import { Trash2 } from "lucide-react";

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
        <TableColumn>CODIGO</TableColumn>
        <TableColumn>DESCRIPCION</TableColumn>
        <TableColumn width={120}>CANTIDAD</TableColumn>
        <TableColumn>PRECIO UNIT.</TableColumn>
        <TableColumn>SUBTOTAL</TableColumn>
        <TableColumn width={50} align="center">
          ACCIONES
        </TableColumn>
      </TableHeader>
      <TableBody emptyContent={"Escanea o busca productos para comenzar."}>
        {items.map((item) => (
          <TableRow key={item.Id} className="hover:bg-default-100">
            <TableCell>{item.Codigo}</TableCell>
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
              <Input
                type="number"
                size="sm"
                variant="bordered"
                min={0.0}
                max={parseFloat(item.Stock?.toString())}
                step={0.1}
                value={item.cantidad.toString()}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateQuantity(item.Id, isNaN(val) ? 0 : val);
                }}
                classNames={{
                  input: "text-right font-bold",
                  inputWrapper: "w-24",
                }}
              />
            </TableCell>
            <TableCell>
              <span className="font-mono">${item.precio.toFixed(2)}</span>
            </TableCell>
            <TableCell>
              <span className="font-mono font-bold text-primary">
                ${item.precio * item.cantidad.toFixed(2)}
              </span>
            </TableCell>
            <TableCell>
              <Tooltip content="Quitar item" color="danger">
                <Button
                  isIconOnly
                  color="danger"
                  variant="light"
                  size="sm"
                  onPress={() => onRemoveItem(item.Id)}
                >
                  <Trash2 size={18} />
                </Button>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
