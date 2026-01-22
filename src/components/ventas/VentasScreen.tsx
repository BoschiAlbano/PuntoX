"use client";

import React, { useState } from "react";
import { Select, SelectItem, addToast } from "@heroui/react";

import ProductSearch from "./ProductSearch";
import VentaGrid from "./VentaGrid";
import VentaFooter from "./VentaFooter";
import ClienteSearch from "./ClienteSearch";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";
import { Producto } from "@/lib/validations/producto.schema";
import { Cliente } from "@/lib/validations/cliente.schema";
import { useConfiguracion } from "@/hooks/useConfiguracion";

interface Item extends Producto {
  cantidad: number;
  precio: number;
  subtotal: number;
}

export default function VentasScreen() {
  const { configuracion } = useConfiguracion();

  // State
  const [items, setItems] = useState<Item[]>([]);
  const [cliente, setCliente] = useState<Partial<Cliente>>({
    Id: 0,
    Nombre: "Consumidor Final",
  });
  const [tipoComprobante, setTipoComprobante] = useState<number>(
    TIPO_COMPROBANTE_VENTA.FACTURA_B,
  );

  // Removed tipoPago state as it is now handled in the modal
  const [listaPrecios, setListaPrecios] = useState<1 | 2>(1);
  const [descuentoGeneral, setDescuentoGeneral] = useState<number>(0);

  // Business Logic Helpers
  const checkProductRules = (product: Producto | Item, newQuantity: number) => {
    // 1. Stock Check
    if (product.DescuentaStock && !product.PermiteStockNegativo) {
      if (product.Stock < newQuantity) {
        throw new Error(
          `No hay suficiente stock disponible. Stock actual: ${product.Stock}`,
        );
      }
    }

    // 2. Sales Limit Check
    if (product.ActivarLimiteVenta && product.LimiteVenta > 0) {
      if (newQuantity > product.LimiteVenta) {
        throw new Error(
          `Supera el límite de venta permitido (${product.LimiteVenta} unidades).`,
        );
      }
    }

    // 3. Time Check
    if (
      product.ActivarHoraVenta &&
      product.HoraLimiteVentaDesde &&
      product.HoraLimiteVentaHasta
    ) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // ejemplo: inicio 00:00 fin 06:00
      const [startH, startM] =
        product.HoraLimiteVentaDesde.split(":").map(Number);
      const [endH, endM] = product.HoraLimiteVentaHasta.split(":").map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      console.log(product.HoraLimiteVentaDesde, product.HoraLimiteVentaHasta);
      console.log(currentMinutes, startMinutes, endMinutes);

      let isRestricted = false;

      // Case 1: Standard range (e.g., 14:00 to 16:00)
      if (startMinutes <= endMinutes) {
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          isRestricted = true;
        }
      }
      // Case 2: Overnight range (e.g., 22:00 to 06:00)
      else {
        if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) {
          isRestricted = true;
        }
      }

      if (isRestricted) {
        throw new Error(
          `Producto restringido en el horario (${product.HoraLimiteVentaDesde} - ${product.HoraLimiteVentaHasta})`,
        );
      }
    }
  };

  // Handlers
  const handleAddItem = (producto: Producto, cantidad: number = 1) => {
    try {
      // Use 'items' from closure (latest state) for validation
      const existing = items.find((i) => i.Id === producto.Id);
      const currentQty = existing ? existing.cantidad : 0;
      const totalQty = currentQty + cantidad;

      // Validate BEFORE updating state
      checkProductRules(producto, totalQty);

      setItems((prev) => {
        const existingInPrev = prev.find((i) => i.Id === producto.Id);
        const precioUnitario =
          listaPrecios === 1
            ? producto.Precio.PrecioPublico
            : producto.Precio.PrecioPublico2;

        if (existingInPrev) {
          return prev.map((i) =>
            i.Id === producto.Id
              ? {
                  ...i,
                  cantidad: i.cantidad + cantidad,
                  subtotal: (i.cantidad + cantidad) * i.precio,
                }
              : i,
          );
        }
        return [
          ...prev,
          {
            ...producto,
            cantidad,
            precio: Number(precioUnitario), // Ensure number
            subtotal: Number(precioUnitario) * cantidad,
          },
        ];
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      addToast({
        title: "Error",
        description: message,
        color: "danger",
      });
    }
  };

  const handleUpdateQuantity = (id: number, cantidad: number) => {
    try {
      // Find item to validate using 'items' from closure
      const item = items.find((i) => i.Id === id);
      if (!item) return;

      // Validate Rules
      checkProductRules(item, cantidad);

      setItems((prev) =>
        prev.map((item) => {
          if (item.Id === id) {
            return { ...item, cantidad, subtotal: item.precio * cantidad };
          }
          return item;
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      addToast({
        title: "Error al actualizar cantidad",
        description: message,
        color: "danger",
      });
    }
  };

  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.Id !== id));
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    return subtotal - (descuentoGeneral || 0);
  };

  const handleLimpiar = () => {
    setItems([]);
    setCliente({
      Id: 0,
      Nombre: "Consumidor Final",
    });
    setTipoComprobante(TIPO_COMPROBANTE_VENTA.FACTURA_B);
    setListaPrecios(1);
    setDescuentoGeneral(0);
  };

  return (
    <div className="flex flex-col h-full gap-4 p-2">
      {/* Header: Client & Config */}

      <div className="flex-1 flex flex-row justify-between gap-4 min-h-0">
        <section className=" flex flex-col flex-1 gap-4">
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
                  <SelectItem
                    key={TIPO_COMPROBANTE_VENTA.FACTURA_A}
                    textValue={"Factura A"}
                  >
                    Factura A
                  </SelectItem>
                  <SelectItem
                    key={TIPO_COMPROBANTE_VENTA.FACTURA_B}
                    textValue={"Factura B"}
                  >
                    Factura B
                  </SelectItem>
                  <SelectItem
                    key={TIPO_COMPROBANTE_VENTA.FACTURA_C}
                    textValue={"Factura C"}
                  >
                    Factura C
                  </SelectItem>
                  <SelectItem
                    key={TIPO_COMPROBANTE_VENTA.PRESUPUESTO}
                    textValue={"Presupuesto"}
                  >
                    Presupuesto
                  </SelectItem>
                  <SelectItem
                    key={TIPO_COMPROBANTE_VENTA.REMITO}
                    textValue={"Remito"}
                  >
                    Remito
                  </SelectItem>
                  <SelectItem
                    key={TIPO_COMPROBANTE_VENTA.NOTA_CREDITO}
                    textValue={"Nota de Credito"}
                  >
                    Nota de Credito
                  </SelectItem>
                </Select>

                <Select
                  label="Lista Precios"
                  size="sm"
                  className="w-40"
                  selectedKeys={[listaPrecios.toString()]}
                  onChange={(e) =>
                    setListaPrecios(Number(e.target.value) as 1 | 2)
                  }
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

          {/* Grilla de items */}
          <VentaGrid
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        </section>

        {/* Footer: Totales y Acciones */}
        <VentaFooter
          subtotal={items.reduce((acc, item) => acc + item.subtotal, 0)}
          descuento={descuentoGeneral}
          setDescuento={setDescuentoGeneral}
          total={calculateTotal()}
          items={items}
          cliente={cliente}
          tipoComprobante={tipoComprobante}
          handleLimpiar={handleLimpiar}
        />
      </div>
    </div>
  );
}
