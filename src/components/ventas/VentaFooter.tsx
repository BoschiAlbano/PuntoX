"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Divider,
  useDisclosure,
} from "@heroui/react";
import { CreditCard, Save, DollarSign } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";
import PaymentModal from "./PaymentModal";

interface VentaFooterProps {
  subtotal: number;
  descuento: number;
  setDescuento: (v: number) => void;
  total: number;
  items: any[];
  cliente: any;
  tipoComprobante: number;
  onSaleCreate: (data: any) => void;
  // Removed unused props: tipoPago, setTipoPago
}

export default function VentaFooter({
  subtotal,
  descuento,
  setDescuento,
  total,
  items,
  cliente,
  tipoComprobante,
  onSaleCreate,
}: VentaFooterProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const res = await fetch("/api/comprobantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear venta");
      }
      return res.json();
    },
    onSuccess: (data) => {
      addToast({
        title: "Venta registrada",
        description: `Venta #${data.comprobante.numero} registrada con éxito`,
      });
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      window.location.reload();
    },
    onError: (err: any) => {
      addToast({
        title: "Error",
        description: err.message,
      });
      setIsSaving(false);
    },
  });

  const handleOpenPayment = () => {
    if (items.length === 0) {
      addToast({
        title: "Error",
        description: "No hay items en la venta",
      });
      return;
    }
    onOpen();
  };

  const handleFinalizeSale = (pagos: any[]) => {
    onClose();
    setIsSaving(true);

    const payload = {
      tipoComprobante,
      clienteId: cliente?.id || 0,
      puestoTrabajoId: 1, // HARDCODED DEFAULT
      detalles: items.map((i) => ({
        articuloId: i.Id,
        codigo: i.Codigo?.toString() || "",
        descripcion: i.Descripcion,
        cantidad: i.cantidad,
        precio: i.precio,
        iva: Number(i.Iva?.Porcentaje || 0),
        subtotal: i.subtotal,
        costo: i.Precio?.PrecioCosto || 0,
      })),
      formasPago: pagos.map((p) => ({
        tipoPago: p.tipoPago,
        monto: p.monto,
      })),
      descuento,
      fecha: new Date().toISOString(),
    };

    console.log(payload);
    setIsSaving(false);

    // createSaleMutation.mutate(payload);
  };

  return (
    <>
      <Card className="flex-none bg-content2 dark:bg-content1 border-t-1 border-default-200">
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-8 justify-between items-center">
            <section className="flex flex-col gap-2">
              <div className="flex gap-4">
                <Button
                  size="md"
                  className="font-bold text-white shadow-lg bg-red-300"
                  startContent={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                  onPress={handleOpenPayment}
                  isLoading={isSaving}
                >
                  Cancelar
                </Button>
              </div>

              <Button
                size="md"
                className="font-bold text-white shadow-lg bg-gradient-to-r from-blue-500 to-[#90c472]"
                startContent={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM1.75 14.5a.75.75 0 0 0 0 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 0 0-1.5 0v.784a.272.272 0 0 1-.35.25A49.043 49.043 0 0 0 1.75 14.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                onPress={handleOpenPayment}
                isLoading={isSaving}
              >
                CONFIRMAR VENTA
              </Button>
            </section>

            <div className="flex gap-8 items-center w-full md:w-auto justify-end">
              <div className="flex flex-col gap-1 min-w-[150px]">
                <div className="flex justify-between text-sm text-default-500">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-default-500 gap-2">
                  <span>Descuento:</span>
                  <Input
                    size="sm"
                    type="number"
                    value={descuento.toString()}
                    onChange={(e) =>
                      setDescuento(parseFloat(e.target.value) || 0)
                    }
                    startContent="$"
                    classNames={{ inputWrapper: "h-6", input: "text-right" }}
                  />
                </div>
                <Divider className="my-1" />
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <PaymentModal
        isOpen={isOpen}
        onClose={onClose}
        total={total}
        onConfirm={handleFinalizeSale}
      />
    </>
  );
}
