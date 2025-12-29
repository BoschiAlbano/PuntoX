"use client";

import React, { useState } from "react";
import { Card, CardBody, Select, SelectItem } from "@heroui/react";
import { User } from "lucide-react";

import ProductSearch from "./ProductSearch";
import VentaGrid from "./VentaGrid";
import VentaFooter from "./VentaFooter";
import ClienteSearch from "./ClienteSearch";
import { TIPO_COMPROBANTE, TIPO_PAGO } from "@/lib/constants/comprobantes";

export default function VentasScreen() {
  // State
  const [items, setItems] = useState<any[]>([]);
  const [cliente, setCliente] = useState<any>({
    Id: 0,
    NombreCompleto: "Consumidor Final",
  });
  const [tipoComprobante, setTipoComprobante] = useState<number>(
    TIPO_COMPROBANTE.FACTURA
  );
  // Removed tipoPago state as it is now handled in the modal
  const [listaPrecios, setListaPrecios] = useState<1 | 2>(1);
  const [descuentoGeneral, setDescuentoGeneral] = useState<number>(0);

  // Queries
  // TODO: Fetch Config if needed

  // Handlers
  const handleAddItem = (producto: any, cantidad: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.Id === producto.Id);
      const precioUnitario =
        listaPrecios === 1
          ? producto.Precio.PrecioPublico
          : producto.Precio.PrecioPublico2;

      if (existing) {
        return prev.map((i) =>
          i.Id === producto.Id
            ? {
                ...i,
                cantidad: i.cantidad + cantidad,
                subtotal: (i.cantidad + cantidad) * i.precio,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          ...producto,
          cantidad,
          precio: Number(precioUnitario), // Ensure number
          subtotal: Number(precioUnitario) * cantidad,
          articuloId: producto.Id,
        },
      ];
    });
  };

  const handleUpdateQuantity = (id: number, cantidad: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.Id === id) {
          return { ...item, cantidad, subtotal: item.precio * cantidad };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.Id !== id));
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    return subtotal - (descuentoGeneral || 0);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] gap-4 p-2">
      {/* Header: Client & Config */}

      <section className="flex-none flex flex-col md:flex-row gap-4 items-center justify-between w-full">
        <ProductSearch onProductSelect={handleAddItem} />
        <div className="flex flex-col md:flex-row gap-4 items-center w-auto">
          <ClienteSearch selected={cliente} onSelect={setCliente} />
          <div className="flex gap-4 w-full md:w-auto">
            <Select
              label="Comprobante"
              size="sm"
              className="w-40"
              selectedKeys={[tipoComprobante.toString()]}
              value={tipoComprobante.toString()}
              onChange={(e) => setTipoComprobante(Number(e.target.value))}
            >
              <SelectItem key={TIPO_COMPROBANTE.FACTURA} textValue={"Factura"}>
                Factura
              </SelectItem>
              <SelectItem
                key={TIPO_COMPROBANTE.PRESUPUESTO}
                textValue={"Presupuesto"}
              >
                Presupuesto
              </SelectItem>
              <SelectItem key={TIPO_COMPROBANTE.REMITO} textValue={"Remito"}>
                Remito
              </SelectItem>
            </Select>

            <Select
              label="Lista Precios"
              size="sm"
              className="w-40"
              selectedKeys={[listaPrecios.toString()]}
              onChange={(e) => setListaPrecios(Number(e.target.value) as 1 | 2)}
            >
              <SelectItem key="1" textValue="L1: General">
                L1: General
              </SelectItem>
              <SelectItem key="2" textValue="L2: Mayorista">
                L2: Mayorista
              </SelectItem>
            </Select>
          </div>
        </div>
      </section>

      {/* Main: Product Search & Grid */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex-1 overflow-auto min-h-0 bg-content1 rounded-medium border-1 border-default-200">
          <VentaGrid
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>

      {/* Footer: Totals & Action */}
      <VentaFooter
        subtotal={items.reduce((acc, item) => acc + item.subtotal, 0)}
        descuento={descuentoGeneral}
        setDescuento={setDescuentoGeneral}
        total={calculateTotal()}
        items={items}
        cliente={cliente}
        tipoComprobante={tipoComprobante}
        onSaleCreate={() => {}}
      />
    </div>
  );
}
