"use client";

import React from "react";
import { Select, SelectItem, addToast, Input } from "@heroui/react";

import ProductSearch from "./ProductSearch";
import VentaGrid from "./VentaGrid";
import VentaFooter from "./VentaFooter";
import ClienteSearch from "./ClienteSearch";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";
import { Producto } from "@/lib/validations/producto.schema";
import { useVentaStore, Item } from "@/store/ventaStore";

export default function VentasScreen() {
  // Store
  const {
    items,
    cliente,
    tipoComprobante,
    listaPrecios,
    descuentoPorcentaje,
    addItem,
    updateItemQuantity,
    removeItem,
    setCliente,
    setTipoComprobante,
    setListaPrecios,
    setDescuentoPorcentaje,
    numeroComprobanteAsociado,
    setNumeroComprobanteAsociado,
    clearVenta,
  } = useVentaStore();

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
      console.log("AddItem: ", producto);

      // Use 'items' from store
      const existing = items.find((i) => i.Id === producto.Id);
      const currentQty = existing ? existing.cantidad : 0;
      const totalQty = currentQty + cantidad;

      // Validate BEFORE updating state
      checkProductRules(producto, totalQty);

      // Call store action
      addItem(producto, cantidad, listaPrecios);
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
      const item = items.find((i) => i.Id === id);
      if (!item) return;

      // Validate Rules
      checkProductRules(item, cantidad);

      updateItemQuantity(id, cantidad);
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

  const calculateTotal = () => {
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const discountAmount = subtotal * (descuentoPorcentaje / 100);
    return subtotal - discountAmount;
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
              <div className="flex gap-4 w-full md:w-auto items-end">
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

                {tipoComprobante === TIPO_COMPROBANTE_VENTA.NOTA_CREDITO && (
                  <Input
                    label="Nro. Factura"
                    size="sm"
                    className="w-32"
                    type="number"
                    value={numeroComprobanteAsociado?.toString() || ""}
                    onValueChange={(v) =>
                      setNumeroComprobanteAsociado(v ? Number(v) : null)
                    }
                  />
                )}

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
            onRemoveItem={removeItem}
          />
        </section>

        {/* Footer: Totales y Acciones */}
        <VentaFooter
          subtotal={items.reduce((acc, item) => acc + item.subtotal, 0)}
          descuento={descuentoPorcentaje}
          setDescuento={setDescuentoPorcentaje}
          total={calculateTotal()}
          items={items}
          cliente={cliente}
          tipoComprobante={tipoComprobante}
          handleLimpiar={clearVenta}
        />
      </div>
    </div>
  );
}
