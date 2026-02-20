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
    <div className="flex flex-col h-full gap-4 p-2 w-full">
      <section className=" w-full flex flex-col flex-1 gap-4">
        {/* Grilla de items y footer */}
        <section className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-row gap-4">
              {/* Buscador de productos */}
              <ProductSearch onProductSelect={handleAddItem} />
              {/* Selector de lista de precios */}
              <div className="flex flex-col gap-1">
                <div className="relative flex gap-0 p-1 rounded-lg h-12 items-center shadow-sm bg-white">
                  {/* Buttons */}
                  <button
                    onClick={() => setListaPrecios(1)}
                    className="relative flex-1 h-10 px-4 rounded-lg font-medium text-sm transition-colors z-10 cursor-pointer "
                  >
                    {listaPrecios === 1 && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-[#7dbbcc] rounded-lg"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <span
                      className={`relative z-10 ${
                        listaPrecios === 1 ? "text-white" : "text-slate-700"
                      }`}
                    >
                      Minorista
                    </span>
                  </button>
                  <button
                    onClick={() => setListaPrecios(2)}
                    className="relative flex-1 h-10 px-4 rounded-lg font-medium text-sm transition-colors z-10 cursor-pointer"
                  >
                    {listaPrecios === 2 && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-[#7dbbcc] rounded-lg"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <span
                      className={`relative z-10 ${
                        listaPrecios === 2 ? "text-white" : "text-slate-700"
                      }`}
                    >
                      Mayorista
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grilla de items */}
            <VentaGrid
              items={items}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={removeItem}
            />
          </div>

          <div className="flex flex-col gap-2 h-full">
            <div className=" flex flex-row gap-2 items-center text-center justify-center">
              {/* Clientes */}
              <ClienteSearch selected={cliente} onSelect={setCliente} />
              {/* Comprobantes */}
              <ComprobanteSelector
                tipoComprobante={tipoComprobante}
                setTipoComprobante={setTipoComprobante}
                numeroComprobanteAsociado={numeroComprobanteAsociado}
                setNumeroComprobanteAsociado={setNumeroComprobanteAsociado}
              />
            </div>

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
        </section>
      </section>
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
    <div className="flex gap-4 w-full  items-end rounded-lg shadow-sm">
      <Select
        label="Comprobante"
        size="sm"
        className="w-50"
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
        />
      )}
    </div>
  );
}
