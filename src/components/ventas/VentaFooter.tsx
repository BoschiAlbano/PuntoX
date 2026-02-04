"use client";

import React, { useState, useEffect, ReactNode } from "react";
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
  Skeleton,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, X } from "lucide-react";
import {
  TIPO_PAGO,
  TIPO_COMPROBANTE_VENTA,
} from "@/lib/constants/comprobantes";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { useCaja } from "@/hooks/useCaja";
import { useVentaStore } from "@/store/ventaStore";
import { TicketImpresion } from "./TicketImpresion";

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
  const { configuracion } = useConfiguracion({
    enableConfiguracion: true,
  });
  const { cajaActual, abrirCaja, isLoading } = useCaja({
    enableCaja: true,
  });

  // Global Store
  const { pagos, addPago, removePago, setPagos, numeroComprobanteAsociado } =
    useVentaStore();

  // Payment Logic State
  const [currentTipo, setCurrentTipo] = useState<number>(
    configuracion?.tipoFormaPagoPorDefectoVenta || TIPO_PAGO.EFECTIVO,
  );
  const [currentMonto, setCurrentMonto] = useState<string>("");

  const [openModalAbrirCaja, setOpenModalAbrirCaja] = useState(false);

  const [isOpening, setIsOpening] = useState(false);
  const [montoInicial, setMontoInicial] = useState<string>("0");

  // Ticket Printing
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const ticketRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (ticketRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ticket de Venta</title>
              <style>
                body { margin: 0; padding: 20px; font-family: monospace; }
                @media print {
                  body { margin: 0; padding: 0; }
                }
              </style>
            </head>
            <body>
              ${ticketRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
  const restante = total - totalPagado;

  const handleAbrirCaja = async () => {
    try {
      setIsOpening(true);
      const montoVal = parseFloat(montoInicial);
      if (isNaN(montoVal) || montoVal < 0) {
        addToast({
          title: "Error",
          description: "Monto inicial inválido",
          color: "danger",
        });
        return;
      }
      await abrirCaja(montoVal);
      setOpenModalAbrirCaja(false);
      setMontoInicial("");
    } catch (error) {
      addToast({
        title: "Error",
        description: "Error al abrir caja",
        color: "danger",
      });
    } finally {
      setIsOpening(false);
    }
  };

  // Reset payments if items are cleared
  useEffect(() => {
    if (items.length === 0) {
      setPagos([]);
      setCurrentTipo(
        configuracion?.tipoFormaPagoPorDefectoVenta || TIPO_PAGO.EFECTIVO,
      );
      setCurrentMonto("");
    }
  }, [items, configuracion, setPagos]);

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

    // Validación de Límite de Cuenta Corriente
    if (
      currentTipo === TIPO_PAGO.CUENTA_CORRIENTE &&
      cliente?.Persona_Cliente?.TieneLimiteCompra
    ) {
      const margenDisponible = cliente.Persona_Cliente.MargenDisponible ?? 0;
      const pagosCtaCteAcumulados = pagos
        .filter((p) => p.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE)
        .reduce((sum, p) => sum + p.monto, 0);

      const nuevoTotalCtaCte = pagosCtaCteAcumulados + montoVal;

      if (nuevoTotalCtaCte > margenDisponible) {
        addToast({
          title: "Límite Excedido",
          description: `El monto excede el margen disponible del cliente ($${(margenDisponible - pagosCtaCteAcumulados).toFixed(2)})`,
          color: "danger",
        });
        return;
      }
    }

    addPago({ tipoPago: currentTipo, monto: montoVal });
  };

  const handleRemovePayment = (index: number) => {
    removePago(index);
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
      // Prepare data for printing BEFORE clearing state
      const ticketData = {
        items: [...items], // Copy items
        cliente: cliente,
        subtotal: items.reduce(
          (acc: number, item: any) => acc + item.subtotal,
          0,
        ),
        descuento: subtotal * (descuento / 100),
        total: total,
        fecha: data.comprobante.fecha,
        numeroComprobante: data.comprobante.numero,
        tipoComprobante: getTipoComprobanteLabel(tipoComprobante),
        formasPago: [...pagos],
      };

      setLastSaleData(ticketData);

      addToast({
        title: "Venta registrada",
        description: `Venta #${data.comprobante.numero} registrada con éxito`,
      });

      // Trigger print with a small delay to ensure state update
      setTimeout(() => {
        // handlePrint();
      }, 500);

      queryClient.invalidateQueries({ queryKey: ["productos"] });
      handleLimpiar();
      setIsSaving(false);
    },
    onError: (err: any) => {
      addToast({
        title: "Error",
        description: err.message,
      });
      setIsSaving(false);
    },
  });

  const getTipoComprobanteLabel = (tipo: number) => {
    switch (tipo) {
      case TIPO_COMPROBANTE_VENTA.FACTURA_A:
        return "Factura A";
      case TIPO_COMPROBANTE_VENTA.FACTURA_B:
        return "Factura B";
      case TIPO_COMPROBANTE_VENTA.FACTURA_C:
        return "Factura C";
      case TIPO_COMPROBANTE_VENTA.PRESUPUESTO:
        return "Presupuesto";
      case TIPO_COMPROBANTE_VENTA.REMITO:
        return "Remito";
      case TIPO_COMPROBANTE_VENTA.NOTA_CREDITO:
        return "Nota de Crédito";
      default:
        return "Comprobante";
    }
  };

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

    if (
      tipoComprobante === TIPO_COMPROBANTE_VENTA.NOTA_CREDITO &&
      !numeroComprobanteAsociado
    ) {
      addToast({
        title: "Error",
        description:
          "Debe ingresar el número de factura asociada para la Nota de Crédito",
        color: "danger",
      });
      return;
    }

    setIsSaving(true);

    const payload = {
      tipoComprobante,
      clienteId: cliente?.Id || 0,
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
      descuento: subtotal * (descuento / 100),
      fecha: new Date().toISOString(),
      numeroComprobanteAsociado,
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
        if (cliente?.Persona_Cliente?.ActivarCtaCte === true) {
          return "Cta. Cte.";
        }
        return null;
      case TIPO_PAGO.TRANSFERENCIA:
        return "Transf.";
      default:
        return "Otro";
    }
  };

  const paymentOptions = [
    { key: TIPO_PAGO.EFECTIVO, label: "Efectivo" },
    { key: TIPO_PAGO.TARJETA, label: "Tarjeta" },
    { key: TIPO_PAGO.TRANSFERENCIA, label: "Transferencia" },
    { key: TIPO_PAGO.CHEQUE, label: "Cheque" },
    ...(cliente?.Persona_Cliente?.ActivarCtaCte
      ? [{ key: TIPO_PAGO.CUENTA_CORRIENTE, label: "Cta. Corriente" }]
      : []),
  ];

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
              {paymentOptions.map((option) => (
                <SelectItem key={option.key} textValue={option.label}>
                  {option.label}
                </SelectItem>
              ))}
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

          {/* Margen Disponible Indicator */}
          {currentTipo === TIPO_PAGO.CUENTA_CORRIENTE &&
            cliente?.Persona_Cliente?.ActivarCtaCte && (
              <div
                className={`text-xs px-1 mb-2 ${cliente?.Persona_Cliente?.TieneLimiteCompra ? (cliente.Persona_Cliente.MargenDisponible < 0 ? "text-danger" : "text-success") : "text-default-500"}`}
              >
                {cliente?.Persona_Cliente?.TieneLimiteCompra ? (
                  <>
                    Margen Disponible:{" "}
                    <b>
                      $
                      {(
                        cliente.Persona_Cliente.MargenDisponible -
                        pagos
                          .filter(
                            (p) => p.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE,
                          )
                          .reduce((acc, p) => acc + p.monto, 0)
                      ).toFixed(2)}
                    </b>
                  </>
                ) : (
                  "Sin límite de compra"
                )}
              </div>
            )}

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
                <span className="text-small text-default-500">Restante:</span>
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
              <span>Descuento (%):</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-default-400">
                  - $
                  {(subtotal * (descuento / 100)).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <Input
                  size="sm"
                  type="number"
                  value={descuento.toString()}
                  onChange={(e) =>
                    setDescuento(parseFloat(e.target.value) || 0)
                  }
                  endContent="%"
                  classNames={{
                    inputWrapper: "h-6",
                    input: "text-right",
                  }}
                  className="w-20"
                />
              </div>
            </div>
            <Divider className="my-1" />
            <div className="flex justify-between text-xl font-bold text-[#67afc3]">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="shadow-lg mt-2 rounded-xl">
              <Button className=" text-center">Cargando...</Button>
            </Skeleton>
          ) : cajaActual ? (
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
          ) : (
            <Button
              size="md"
              className="font-bold text-white shadow-lg bg-yellow-500"
              startContent={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 mb-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              onPress={() => setOpenModalAbrirCaja(true)}
            >
              Abrir Caja
            </Button>
          )}

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

      <ModalShell
        open={openModalAbrirCaja}
        title="Abrir Caja"
        onClose={() => setOpenModalAbrirCaja(false)}
        footer={
          <>
            <button
              onClick={() => setOpenModalAbrirCaja(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAbrirCaja}
              disabled={isOpening}
              className="rounded-lg bg-[#67afc3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5a9fb2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isOpening ? "Abriendo..." : "Abrir Caja"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Monto inicial
          </label>
          <input
            type="number"
            value={montoInicial}
            onChange={(e) => setMontoInicial(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#67afc3] focus:outline-none focus:ring-2 focus:ring-[#67afc3]/20"
            aria-label="Monto inicial para abrir la caja"
          />
          <p className="text-xs text-slate-500">
            Ingrese el monto inicial con el que se abrira la caja.
          </p>
        </div>
      </ModalShell>

      {/* Hidden Ticket Component */}
      <div style={{ display: "none" }}>
        <TicketImpresion ref={ticketRef} datosVenta={lastSaleData} />
      </div>
    </section>
  );
}

function ModalShell({
  open,
  title,
  onClose,
  size = "md",
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  size?: "md" | "xl";
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;

  const sizeClass = size === "xl" ? "max-w-2xl" : "max-w-md";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-label="Cerrar modal"
      />
      <div
        className={`relative w-full ${sizeClass} rounded-2xl border border-slate-200 bg-white p-5 shadow-xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
