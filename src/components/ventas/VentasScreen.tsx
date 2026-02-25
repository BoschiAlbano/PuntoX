"use client";

import {
  Select,
  SelectItem,
  addToast,
  Input,
  RadioGroup,
  Radio,
} from "@heroui/react";
import { motion } from "framer-motion";

import ProductSearch from "./ProductSearch";
import VentaGrid from "./VentaGrid";
import VentaFooter from "./VentaFooter";
import ClienteSearch from "./ClienteSearch";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";
import { Producto } from "@/lib/validations/producto.schema";
import { useVentaStore, Item } from "@/store/ventaStore";
import { ShoppingCart } from "lucide-react";

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
    <div className="h-full w-full bg-slate-50/50 p-4 overflow-hidden flex flex-col gap-4">
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* LEFT PANEL: PRODUCT SEARCH & GRID */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden rounded-2xl">
          {/* Toolbar Card */}
          <div className="bg-white p-3 rounded-2xl border border-slate-100 flex gap-4 items-center shrink-0">
            {/* Buscador de productos - Flex grow to take available space */}
            <div className="flex-1">
              <ProductSearch onProductSelect={handleAddItem} />
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            {/* Selector de lista de precios - Compact pill design */}
            <div className="flex bg-slate-100 p-1 rounded-xl h-10 items-center relative">
              <button
                onClick={() => setListaPrecios(1)}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 z-10 ${
                  listaPrecios === 1
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Minorista
                {listaPrecios === 1 && (
                  <motion.div
                    layoutId="priceListTab"
                    className="absolute inset-0 bg-slate-800 rounded-lg -z-10 shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
              <button
                onClick={() => setListaPrecios(2)}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 z-10 ${
                  listaPrecios === 2
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Mayorista
                {listaPrecios === 2 && (
                  <motion.div
                    layoutId="priceListTab"
                    className="absolute inset-0 bg-slate-800 rounded-lg -z-10 shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Grilla de items */}
          <VentaGrid
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={removeItem}
          />
        </div>

        {/* RIGHT PANEL: CLIENT & FOOTER */}
        <div className="w-[400px] flex flex-col gap-4 shrink-0 h-full overflow-hidden">
          {/* Cliente Card */}
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cliente
              </h3>
            </div>
            <div className="p-3">
              <ClienteSearch selected={cliente} onSelect={setCliente} />
            </div>
          </div>

          {/* Comprobante Card */}
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Comprobante
              </h3>
            </div>
            <div className="p-3">
              <ComprobanteSelector
                tipoComprobante={tipoComprobante}
                setTipoComprobante={setTipoComprobante}
                numeroComprobanteAsociado={numeroComprobanteAsociado}
                setNumeroComprobanteAsociado={setNumeroComprobanteAsociado}
              />
            </div>
          </div>

          {/* Footer / Totals Section */}
          <div className="flex-1 min-h-0 flex flex-col">
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
      </div>
    </div>
  );
}

function ComprobanteSelector({
  tipoComprobante,
  setTipoComprobante,
  numeroComprobanteAsociado,
  setNumeroComprobanteAsociado,
}: {
  tipoComprobante: number;
  setTipoComprobante: (tipoComprobante: number) => void;
  numeroComprobanteAsociado: number | null;
  setNumeroComprobanteAsociado: (
    numeroComprobanteAsociado: number | null,
  ) => void;
}) {
  return (
    <div className="flex gap-4 w-full items-end rounded-lg">
      <Select
        label="Comprobante"
        size="sm"
        className="w-full"
        selectedKeys={[tipoComprobante.toString()]}
        value={tipoComprobante.toString()}
        onChange={(e) => setTipoComprobante(Number(e.target.value))}
        classNames={{
          trigger:
            "h-10 min-h-10 rounded-lg shadow-none border border-slate-200 data-[hover=true]:border-slate-300",
          value: "text-small",
        }}
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
        <SelectItem key={TIPO_COMPROBANTE_VENTA.REMITO} textValue={"Remito"}>
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
          classNames={{
            inputWrapper:
              "h-10 min-h-10 rounded-lg shadow-none border border-slate-200 group-data-[focus=true]:border-blue-400",
          }}
        />
      )}
    </div>
  );
}
