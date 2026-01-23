"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Divider,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  CardHeader,
  addToast,
  CardFooter,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";

interface VentaFooterProps {
  subtotal: number;
  descuento: number;
  setDescuento: (v: number) => void;
  total: number;
  items: any[];
  cliente: any;
  tipoComprobante: number;
  handleLimpiar: () => void;
}

export default function VentaFooter({
  subtotal,
  descuento,
  setDescuento,
  total,
  items,
  cliente,
  tipoComprobante,
  handleLimpiar,
}: VentaFooterProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Payment Logic State
  const [pagos, setPagos] = useState<{ tipoPago: number; monto: number }[]>([]);
  const [currentTipo, setCurrentTipo] = useState<number>(TIPO_PAGO.EFECTIVO);
  const [currentMonto, setCurrentMonto] = useState<string>("");

  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
  const restante = total - totalPagado;

  // Reset payments if items are cleared
  useEffect(() => {
    if (items.length === 0) {
      setPagos([]);
      setCurrentTipo(TIPO_PAGO.EFECTIVO);
      setCurrentMonto("");
    }
  }, [items]);

  useEffect(() => {
    if (restante > 0.001) {
      setCurrentMonto(restante.toFixed(2));
    } else {
      setCurrentMonto("");
    }
  }, [totalPagado, total, restante]);

  const handleAddPayment = () => {
    const montoVal = parseFloat(currentMonto);
    if (isNaN(montoVal) || montoVal <= 0) return;

    setPagos([...pagos, { tipoPago: currentTipo, monto: montoVal }]);
  };

  const handleRemovePayment = (index: number) => {
    const newPagos = [...pagos];
    newPagos.splice(index, 1);
    setPagos(newPagos);
  };

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
      handleLimpiar();
      setIsSaving(false);
      // window.location.reload();
    },
    onError: (err: any) => {
      addToast({
        title: "Error",
        description: err.message,
      });
      setIsSaving(false);
    },
  });

  const handleFinalizeSale = () => {
    if (items.length === 0) {
      addToast({ title: "Error", description: "No hay items en la venta" });
      return;
    }

    if (Math.abs(restante) > 0.01) {
      addToast({
        title: "Error",
        description: "El pago debe ser exacto (cubrir el total sin excedente)",
        color: "danger",
      });
      return;
    }

    setIsSaving(true);

    const payload = {
      tipoComprobante,
      clienteId: cliente?.id || 0,
      // puestoTrabajoId: 1, // HARDCODED DEFAULT
      detalles: items.map((i) => ({
        articuloId: i.Id,
        codigo: i.Codigo?.toString() || "",
        descripcion: i.Descripcion,
        cantidad: i.cantidad,
        precio: i.precio,
        iva: Number(i.Iva?.Porcentaje || 0),
        subtotal: i.subtotal,
        costo: Number(i.Precio?.PrecioCosto || 0),
      })),
      formasPago: pagos.map((p) => ({
        tipoPago: p.tipoPago,
        monto: p.monto,
      })),
      descuento,
      fecha: new Date().toISOString(),
    };

    createSaleMutation.mutate(payload);
  };

  const getTipoLabel = (tipo: number) => {
    switch (tipo) {
      case TIPO_PAGO.EFECTIVO:
        return "Efectivo";
      case TIPO_PAGO.TARJETA:
        return "Tarjeta";
      case TIPO_PAGO.CHEQUE:
        return "Cheque";
      case TIPO_PAGO.CUENTA_CORRIENTE:
        return "Cta. Cte.";
      case TIPO_PAGO.TRANSFERENCIA:
        return "Transf.";
      default:
        return "Otro";
    }
  };

  return (
    <section className="flex-none w-full md:w-[320px] lg:w-[360px] flex flex-col gap-4 h-full">
      {/* Payment Card */}
      <Card className="border-default-200 bg-[#ffffff] flex-1 min-h-[350px]">
        <CardHeader className="pb-4 pt-4 px-4 flex-col items-start">
          <div className="font-bold text-large absolute top-0 left-0 flex items-center gap-2 p-2">
            <div className=" h-2 w-2 rounded-full bg-[#67afc3]"></div>
            <p className="text-xs text-default-500">Formas de Pago</p>
          </div>
        </CardHeader>
        <CardBody className="overflow-hidden">
          {/* Inputs */}
          <div className="flex gap-2 items-end mb-4">
            <Select
              label="Método"
              selectedKeys={[currentTipo.toString()]}
              onChange={(e) => setCurrentTipo(Number(e.target.value))}
              className="flex-2"
              size="sm"
            >
              <SelectItem key={TIPO_PAGO.EFECTIVO} textValue="Efectivo">
                Efectivo
              </SelectItem>
              <SelectItem key={TIPO_PAGO.TARJETA} textValue="Tarjeta">
                Tarjeta
              </SelectItem>
              <SelectItem
                key={TIPO_PAGO.TRANSFERENCIA}
                textValue="Transferencia"
              >
                Transferencia
              </SelectItem>
              <SelectItem key={TIPO_PAGO.CHEQUE} textValue="Cheque">
                Cheque
              </SelectItem>
              <SelectItem
                key={TIPO_PAGO.CUENTA_CORRIENTE}
                textValue="Cta. Corriente"
              >
                Cta. Corriente
              </SelectItem>
            </Select>
            <Input
              label="Monto"
              type="number"
              value={currentMonto}
              onValueChange={setCurrentMonto}
              startContent="$"
              className="flex-[1.5]"
              size="sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPayment();
              }}
            />
            <Button
              isIconOnly
              size="lg"
              onPress={handleAddPayment}
              className="mb-0.5 bg-[#67afc3] text-white"
            >
              <Plus size={20} />
            </Button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            <Table
              aria-label="Pagos"
              removeWrapper
              classNames={{
                th: "bg-transparent h-8 text-tiny ",
                td: "py-1 text-small",
                tr: "hover:bg-default-100",
              }}
              isCompact
            >
              <TableHeader>
                <TableColumn>MÉTODO</TableColumn>
                <TableColumn align="end">MONTO</TableColumn>
                <TableColumn align="end" width={40}>
                  ACCIÓN
                </TableColumn>
              </TableHeader>
              <TableBody emptyContent="Sin pagos.">
                {pagos.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{getTipoLabel(p.tipoPago)}</TableCell>
                    <TableCell>${p.monto.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        isIconOnly
                        color="danger"
                        variant="light"
                        onPress={() => handleRemovePayment(idx)}
                        className="h-6 w-6 min-w-4"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
        <CardFooter>
          <div className="flex justify-between w-full mt-2 p-2 rounded-lg">
            {restante > 0.01 ? (
              <>
                <span className="text-small text-default-500">Restante 1:</span>
                <span
                  className={`font-bold ${restante > 0.01 && "text-warning"}`}
                >
                  $
                  {Math.max(0, restante).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </>
            ) : (
              <>
                <span className="text-small text-default-500">Vuelto:</span>
                <span
                  className={`font-bold ${restante < 0.01 && "text-[#67afc3]"}`}
                >
                  $
                  {Math.abs(restante).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Totals Card */}
      <Card className="border-t-1 border-default-200 bg-content1 dark:bg-content1 flex-none">
        <CardHeader className="pb-4 pt-4 px-4 flex-col items-start">
          <div className="font-bold text-large absolute top-0 left-0 flex items-center gap-2 p-2">
            <div className=" h-2 w-2 rounded-full bg-[#67afc3]"></div>
            <p className="text-xs text-default-500">Totales</p>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm text-default-500">
              <span>Subtotal:</span>
              <span>
                $
                {subtotal.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-default-500 gap-2">
              <span>Descuento:</span>
              <Input
                size="sm"
                type="number"
                value={descuento.toString()}
                onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                startContent="$"
                classNames={{
                  inputWrapper: "h-6",
                  input: "text-right",
                }}
                className="w-24"
              />
            </div>
            <Divider className="my-1" />
            <div className="flex justify-between text-xl font-bold text-[#67afc3]">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            size="md"
            className={`font-bold text-white shadow-lg bg-linear-to-r from-blue-500 to-[#90c472] mt-2`}
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
            onPress={handleFinalizeSale}
            isLoading={isSaving}
            isDisabled={Math.abs(restante) > 0.01 || items.length === 0}
          >
            {Math.abs(restante) < 0.01 || items.length === 0
              ? "CONFIRMAR VENTA"
              : `FALTA $${
                  restante > 0
                    ? restante.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "AJUSTE"
                }`}
          </Button>
          <Button
            size="md"
            className="font-bold text-white shadow-lg bg-red-300"
            startContent={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5 mb-1"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            }
            onPress={handleLimpiar}
            isLoading={isSaving}
          >
            Cancelar
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
