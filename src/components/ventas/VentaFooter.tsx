"use client";

import React, { useState, useEffect, ReactNode, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  addToast,
  Skeleton,
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

  const [isOpening, setIsOpening] = useState(false);
  const [montoInicial, setMontoInicial] = useState<string>("0");

  // Ticket Printing
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const ticketRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: "Ticket de Venta",
    onAfterPrint: () => {},
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
      <div className="flex-1 rounded-xl border border-slate-100 flex flex-col shadow-sm">
        <div className="px-2 pt-1 pb-1 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0 min-h-[28px]">
          {/* Margen Disponible Indicator */}
          {currentTipo === TIPO_PAGO.CUENTA_CORRIENTE &&
            cliente?.Persona_Cliente?.ActivarCtaCte && (
              <div
                className={`text-xs px-2 py-0.5 rounded-full border border-slate-200 ${cliente?.Persona_Cliente?.TieneLimiteCompra ? (cliente.Persona_Cliente.MargenDisponible < 0 ? "text-danger border-danger/20 bg-danger/5" : "text-emerald-600 border-emerald-200 bg-emerald-50") : "text-slate-500"}`}
              >
                {cliente?.Persona_Cliente?.TieneLimiteCompra ? (
                  <>
                    Margen:{" "}
                    <b>
                      $
                      {(
                        cliente.Persona_Cliente.MargenDisponible -
                        pagos
                          .filter(
                            (p) => p.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE,
                          )
                          .reduce((acc, p) => acc + p.monto, 0)
                      ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </b>
                  </>
                ) : (
                  "Sin límite"
                )}
              </div>
            )}
        </div>

        <div className="p-2 flex flex-col gap-2 flex-1">
          {/* Payment Input Group */}
          <div className="flex gap-2 items-end shrink-0">
            <Select
              label="Método"
              selectedKeys={[currentTipo.toString()]}
              onChange={(e) => setCurrentTipo(Number(e.target.value))}
              className="flex-2 max-w-[120px]"
              size="sm"
              variant="flat"
              classNames={{
                trigger: "shadow-sm rounded-lg bg-transparent h-10 min-h-10",
                label: "text-xs",
              }}
            >
              {paymentOptions.map((option) => (
                <SelectItem key={option.key} textValue={option.label} className="text-xs">
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
                inputWrapper: "shadow-sm rounded-lg bg-transparent h-10 min-h-10",
                label: "text-xs",
                input: "text-xs",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPayment();
              }}
            />
            <Button
              isIconOnly
              size="sm"
              onPress={handleAddPayment}
              className="h-10 w-10 min-w-10 bg-[#67afc3] text-white rounded-lg"
            >
              <Plus size={18} />
            </Button>
          </div>

          {/* Payment List */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1 custom-scrollbar">
            {pagos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-1 min-h-[60px]">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <span className="text-sm">$</span>
                </div>
                <span className="text-[10px]">Agrega un pago</span>
              </div>
            ) : (
              pagos.map((p, idx) => (
                <div
                  key={idx}
                  className="group flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      {getTipoIcon(p.tipoPago, 12)}
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      {getTipoLabel(p.tipoPago)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      $
                      {p.monto.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <button
                      onClick={() => handleRemovePayment(idx)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Remaining / Change Display */}
          <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between items-end shrink-0">
            {restante > 0.01 ? (
              <>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Restante
                </span>
                <span className="text-sm font-bold text-slate-700">
                  $
                  {Math.max(0, restante).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">
                  Vuelto
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  $
                  {Math.abs(restante).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Totals & Actions Card */}
      <div className="rounded-xl border border-slate-100 p-3 shrink-0 flex flex-col gap-2 relative z-10 shadow-sm">
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span>
              $
              {subtotal.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 h-5">
            <span>Descuento</span>
            <div className="flex items-center gap-2">
              {descuento > 0 && subtotal > 0 && (
                <span className="text-[10px] text-red-400">
                  - $
                  {(subtotal * (descuento / 100)).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
              <div className="flex items-center rounded-lg w-12">
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
                  className="w-full text-right bg-transparent text-xs font-medium focus:outline-none py-1"
                />
                <span className="text-xs text-slate-400 ml-1">%</span>
              </div>
            </div>
          </div>

          <div className="my-2 h-px bg-slate-100 w-full"></div>

          <div className="flex justify-between items-baseline mt-1">
            <span className="text-sm text-slate-800 font-semibold">Total</span>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="flat"
            className="w-10 h-10 min-w-10 rounded-lg bg-white text-gray-400 hover:text-red-600 hover:bg-red-200"
            isIconOnly
            onPress={handleLimpiar}
            isDisabled={isSaving || items.length === 0}
          >
            <Trash2 size={18} />
          </Button>

          {isLoading ? (
            <Skeleton className="flex-1 rounded-lg h-10" />
          ) : cajaActual ? (
            <Button
              size="sm"
              className="flex-1 h-10 bg-[#182337] text-white font-bold rounded-lg transition-all active:scale-[0.98] text-xs"
              onPress={handleFinalizeSale}
              isLoading={isSaving}
              isDisabled={Math.abs(restante) > 0.01 || items.length === 0}
            >
              {Math.abs(restante) < 0.01 || items.length === 0
                ? "CONFIRMAR VENTA"
                : "COMPLETAR PAGO"}
            </Button>
          ) : (
            <Button
              size="sm"
              color="warning"
              className="flex-1 h-10 font-bold text-white rounded-lg text-xs"
              onPress={() => setOpenModalAbrirCaja(true)}
            >
              ABRIR CAJA
            </Button>
          )}
        </div>
      </div>

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
