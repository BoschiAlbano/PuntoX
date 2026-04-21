"use client";

import React, { useState, useEffect, ReactNode, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  addToast,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  Plus,
  X,
  Wallet,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  AlertTriangle,
} from "lucide-react";
import {
  TIPO_PAGO,
  TIPO_COMPROBANTE_VENTA,
} from "@/lib/constants/comprobantes";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { useCaja } from "@/hooks/useCaja";
import { useVentaStore } from "@/store/ventaStore";
import { useReactToPrint } from "react-to-print";
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
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [isOpening, setIsOpening] = useState(false);
  const [montoInicial, setMontoInicial] = useState<string>("0");

  // Ticket Printing
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const ticketRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: "Ticket de Venta",
    onAfterPrint: () => {},
    pageStyle: `
      @page {
        size: 58mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

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

    if (pagos.some((p) => p.tipoPago === currentTipo)) {
      addToast({
        title: "Error",
        description: "Este método de pago ya ha sido agregado.",
        color: "warning",
      });
      return;
    }

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
        pie: configuracion?.observacionPieFactura,
      };

      setLastSaleData(ticketData);

      addToast({
        title: "Venta registrada",
        description: `Venta #${data.comprobante.numero} registrada con éxito`,
      });

      // Trigger print with a small delay to ensure state update
      setTimeout(() => {
        handlePrint();
      }, 500);

      queryClient.invalidateQueries({ queryKey: ["productos"] });
      handleLimpiar();
      setIsSaving(false);
    },
    onError: (err: any) => {
      addToast({
        title: "Error",
        description: err.message,
        color: "danger",
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
        costo: Number(i.PrecioCosto || 0),
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

  const getTipoIcon = (tipo: number, size: number = 16) => {
    switch (tipo) {
      case TIPO_PAGO.EFECTIVO:
        return <Banknote size={size} className="text-emerald-500" />;
      case TIPO_PAGO.TARJETA:
        return <CreditCard size={size} className="text-blue-500" />;
      case TIPO_PAGO.TRANSFERENCIA:
        return <ArrowRightLeft size={size} className="text-purple-500" />;
      case TIPO_PAGO.CHEQUE:
        return <Wallet size={size} className="text-orange-500" />;
      case TIPO_PAGO.CUENTA_CORRIENTE:
        return <Wallet size={size} className="text-slate-500" />;
      default:
        return <Wallet size={size} className="text-slate-500" />;
    }
  };

  const paymentOptions = useMemo(
    () =>
      [
        { key: TIPO_PAGO.EFECTIVO, label: "Efectivo" },
        { key: TIPO_PAGO.TARJETA, label: "Tarjeta" },
        { key: TIPO_PAGO.TRANSFERENCIA, label: "Transferencia" },
        { key: TIPO_PAGO.CHEQUE, label: "Cheque" },
        ...(cliente?.Persona_Cliente?.ActivarCtaCte
          ? [{ key: TIPO_PAGO.CUENTA_CORRIENTE, label: "Cta. Corriente" }]
          : []),
      ].filter((option) => !pagos.some((p) => p.tipoPago === option.key)),
    [cliente, pagos],
  );

  useEffect(() => {
    if (
      paymentOptions.length > 0 &&
      !paymentOptions.find((op) => op.key === currentTipo)
    ) {
      setCurrentTipo(paymentOptions[0].key);
    }
  }, [paymentOptions, currentTipo]);

  return (
    <section className="flex-1 flex flex-col gap-2">
      {/* Payment Methods Section */}
      <div className="bg-white flex-1 rounded-xl border border-slate-100 flex flex-col shadow-sm overflow-hidden">
        {/* Header con margen de cta cte */}
        {currentTipo === TIPO_PAGO.CUENTA_CORRIENTE &&
          cliente?.Persona_Cliente?.ActivarCtaCte && (
            <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50/50 flex items-center shrink-0">
              <div
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  cliente?.Persona_Cliente?.TieneLimiteCompra
                    ? cliente.Persona_Cliente.MargenDisponible < 0
                      ? "text-red-600 border-red-200 bg-red-50"
                      : "text-emerald-600 border-emerald-200 bg-emerald-50"
                    : "text-slate-500 border-slate-200 bg-slate-50"
                }`}
              >
                {cliente?.Persona_Cliente?.TieneLimiteCompra ? (
                  <>
                    Margen disponible:{" "}
                    <b>
                      $
                      {
                        (
                          cliente.Persona_Cliente.MargenDisponible -
                          pagos
                            .filter((p) => p.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE)
                            .reduce((acc, p) => acc + p.monto, 0)
                        ).toLocaleString("es-AR", { minimumFractionDigits: 2 })
                      }
                    </b>
                  </>
                ) : (
                  "Sin límite de compra"
                )}
              </div>
            </div>
          )}

        <div className="p-3 flex flex-col gap-3 flex-1">
          {/* Título sección */}
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Formas de pago
          </p>

          {/* Payment Input Group */}
          <div className="flex gap-2 items-end shrink-0">
            <Select
              label="Método"
              selectedKeys={[currentTipo.toString()]}
              onChange={(e) => setCurrentTipo(Number(e.target.value))}
              className="flex-[1.2]"
              size="sm"
              variant="flat"
              classNames={{
                trigger: "rounded-lg bg-slate-50 h-10 min-h-10 border border-slate-200",
                label: "text-xs",
              }}
            >
              {paymentOptions.map((option) => (
                <SelectItem
                  key={option.key}
                  textValue={option.label}
                  className="text-xs"
                >
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            <Input
              label="Monto"
              type="number"
              value={currentMonto}
              onValueChange={setCurrentMonto}
              startContent={<span className="text-slate-400 text-xs">$</span>}
              className="flex-[1.5]"
              size="sm"
              variant="flat"
              classNames={{
                inputWrapper: "rounded-lg bg-slate-50 h-10 min-h-10 border border-slate-200",
                label: "text-xs",
                input: "text-xs",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPayment();
              }}
            />
            <button
              onClick={handleAddPayment}
              aria-label="Agregar pago"
              className="h-10 w-10 min-w-10 bg-[#67afc3] hover:bg-[#5a9eb1] active:scale-95 text-white rounded-lg flex items-center justify-center transition-all shrink-0"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Payment List */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-1 scrollbar-hide">
            {pagos.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-300 gap-1.5 py-4 min-h-[56px]">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center">
                  <Wallet size={16} className="text-slate-300" />
                </div>
                <span className="text-[10px] font-medium">Sin pagos agregados</span>
              </div>
            ) : (
              pagos.map((p, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {getTipoIcon(p.tipoPago, 13)}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {getTipoLabel(p.tipoPago)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">
                      ${p.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleRemovePayment(idx)}
                      aria-label={`Eliminar pago ${getTipoLabel(p.tipoPago)}`}
                      className="min-w-[28px] h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Restante / Vuelto */}
          <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center shrink-0">
            {restante > 0.01 ? (
              <>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Restante
                </span>
                <span className="text-base font-bold text-slate-700">
                  ${Math.max(0, restante).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">
                  Vuelto
                </span>
                <span className="text-base font-bold text-emerald-600">
                  ${Math.abs(restante).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Totals & Actions Card */}
      <div className="bg-white rounded-xl border border-slate-100 p-3 shrink-0 flex flex-col gap-3 relative z-10 shadow-sm">
        {/* Subtotal + Descuento */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span className="font-medium">Subtotal</span>
            <span>
              ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500">
            <span className="font-medium">Descuento</span>
            <div className="flex items-center gap-2">
              {descuento > 0 && subtotal > 0 && (
                <span className="text-[10px] text-red-400 font-medium">
                  − ${(subtotal * (descuento / 100)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              )}
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <input
                  data-testid="descuento-input"
                  type="number"
                  min={0}
                  max={100}
                  value={descuento.toString()}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setDescuento(Math.min(100, Math.max(0, v)));
                  }}
                  className="w-10 text-right bg-transparent text-xs font-semibold focus:outline-none py-1 pl-2"
                />
                <span className="text-xs text-slate-400 pr-1.5">%</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Total destacado */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Total</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="flat"
            aria-label="Limpiar venta"
            className="w-11 h-11 min-w-11 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition-colors"
            isIconOnly
            onPress={() => setIsCancelModalOpen(true)}
            isDisabled={isSaving || items.length === 0}
          >
            <Trash2 size={17} />
          </Button>

          {isLoading ? (
            <Skeleton className="flex-1 rounded-xl h-11" />
          ) : cajaActual ? (
            <Button
              size="sm"
              className="flex-1 h-11 bg-[#182337] hover:bg-[#0f1929] text-white font-bold rounded-xl transition-all active:scale-[0.98] text-sm tracking-wide shadow-sm"
              onPress={handleFinalizeSale}
              isLoading={isSaving}
              isDisabled={Math.abs(restante) > 0.01 || items.length === 0}
            >
              {Math.abs(restante) < 0.01 && items.length > 0
                ? "Confirmar venta"
                : "Completar pago"}
            </Button>
          ) : (
            <Button
              size="sm"
              color="warning"
              className="flex-1 h-11 font-bold text-white rounded-xl text-sm tracking-wide"
              onPress={() => setOpenModalAbrirCaja(true)}
            >
              Abrir Caja
            </Button>
          )}
        </div>
      </div>

      <Modal
        isOpen={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
        size="md"
        backdrop="blur"
        classNames={{
          base: "bg-white/95 backdrop-blur-3xl shadow-2xl border border-white/60 rounded-[24px]",
          header: "border-b border-slate-100/60 pb-4 pt-6 px-6 sm:px-8",
          body: "py-6 px-4 sm:px-8 text-center",
          footer: "border-t border-slate-100/60 py-4 px-4 sm:px-8",
          closeButton: "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-2 shadow-sm border border-red-100">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Cancelar Venta
                </h2>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm font-medium text-slate-500">
                  ¿Estás seguro de que deseas cancelar la venta actual?
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Se eliminarán todos los productos agregados y pagos ingresados. Esta acción no se puede deshacer.
                </p>
              </ModalBody>
              <ModalFooter className="flex w-full justify-between gap-2">
                <Button
                  className="flex-1 text-slate-500 font-medium hover:bg-slate-100"
                  variant="light"
                  onPress={onClose}
                >
                  Volver
                </Button>
                <Button
                  className="flex-1 bg-red-500 text-white font-semibold shadow-md shadow-red-500/20"
                  onPress={() => {
                    handleLimpiar();
                    onClose();
                  }}
                >
                  Sí, Cancelar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

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
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
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
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Cerrar modal"
      />
      <div
        className={`relative w-full ${sizeClass} rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transform transition-all`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2">{children}</div>
        {footer && (
          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
