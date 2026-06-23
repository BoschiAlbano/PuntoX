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
import { ModalAbrirCaja } from "@/components/caja/ModalAbrirCaja";
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
  Clock,
  DollarSign,
} from "lucide-react";
import {
  TIPO_PAGO,
  TIPO_COMPROBANTE_VENTA,
} from "@/lib/constants/comprobantes";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { useCaja } from "@/hooks/useCaja";
import { useVentaStore } from "@/store/ventaStore";
import { useUserStore } from "@/store/useUserStore";
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
  const { configuracion, fiscal } = useConfiguracion({
    enableConfiguracion: true,
    enableFiscal: true,
  });
  const { cajaActual, abrirCaja, isLoading } = useCaja({
    enableCaja: true,
  });

  // Global Store
  const { pagos, addPago, removePago, setPagos, numeroComprobanteAsociado } =
    useVentaStore();
  const { currentBranch } = useUserStore();

  // Payment Logic State
  const [currentTipo, setCurrentTipo] = useState<number>(
    configuracion?.tipoFormaPagoPorDefectoVenta || TIPO_PAGO.EFECTIVO,
  );
  const [currentMonto, setCurrentMonto] = useState<string>("");

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [openModalAbrirCaja, setOpenModalAbrirCaja] = useState(false);

  // ── Keyboard shortcuts (F10 → confirmar, Escape → cancelar) ──
  const handleFinalizeSaleRef = React.useRef<() => void>(() => {});
  const itemsLengthRef = React.useRef(items.length);
  itemsLengthRef.current = items.length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      const isProductSearch = target?.id === 'product-search-input';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && !isProductSearch) return;
      if (document.querySelector('[data-slot="backdrop"]')) return;

      if (e.key === 'F10') {
        e.preventDefault();
        handleFinalizeSaleRef.current();
      }
      if (e.key === 'Escape' && itemsLengthRef.current > 0) {
        e.preventDefault();
        setIsCancelModalOpen(true);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Modo diferido: PuestoCajaSeparado activo + factura A/B/C
  const modoDiferido =
    !!configuracion?.puestoCajaSeparado &&
    [
      TIPO_COMPROBANTE_VENTA.FACTURA_A,
      TIPO_COMPROBANTE_VENTA.FACTURA_B,
      TIPO_COMPROBANTE_VENTA.FACTURA_C,
    ].includes(tipoComprobante as 1 | 2 | 3);

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
      // Modo diferido: no imprimir, invalidar cobros-pendientes
      if (data.comprobante.esDiferido) {
        addToast({
          title: "Factura registrada",
          description: `Factura #${data.comprobante.numero} pendiente de cobro en Caja.`,
        });
        queryClient.invalidateQueries({ queryKey: ["cobros-pendientes"] });
        queryClient.invalidateQueries({ queryKey: ["productos"] });
        handleLimpiar();
        setIsSaving(false);
        return;
      }

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
        arcaStatus: data.comprobante.arcaStatus,
        cae: data.comprobante.cae,
        caeFchVto: data.comprobante.caeFchVto,
        cuitEmisor: fiscal?.cuit || configuracion?.cuit || "",
        puntoVentaNum: currentBranch?.PuntoVentaAfip 
          ? Number(currentBranch.PuntoVentaAfip) 
          : (fiscal?.puntoVenta ? Number(fiscal.puntoVenta) : 1),
        cbteNro: data.comprobante.numero,
      };

      setLastSaleData(ticketData);

      // Determinar tipo de error de ARCA para la notificación
      const arcaError = data.comprobante.arcaErrores;
      const esConexionFallida = arcaError?.includes("conexión") || arcaError?.includes("conectar");
      const esRechazado = data.comprobante.arcaStatus === 'RECHAZADO';

      if (esRechazado || esConexionFallida) {
        // ARCA falló o rechazó: imprimir ticket SIN QR pero notificar al usuario
        addToast({
          title: esRechazado ? "⚠️ ARCA rechazó el comprobante" : "⚠️ ARCA no respondió",
          description: arcaError
            ? `La venta se registró pero la FE tuvo un problema: ${arcaError}. El ticket se imprime sin QR.`
            : "La venta se registró pero la FE no se completó. El ticket se imprime sin QR.",
          color: "warning",
          timeout: 12000,
        });
      } else {
        // ARCA autorizó o no aplica FE
        addToast({
          title: "✅ Venta registrada",
          description: data.comprobante.cae
            ? `Factura #${data.comprobante.numero} autorizada por ARCA. CAE: ${data.comprobante.cae}`
            : `Venta #${data.comprobante.numero} registrada con éxito`,
        });
      }

      // Siempre imprimir el ticket (con o sin QR según el caso)
      setTimeout(() => {
        handlePrint();
      }, 500);

      queryClient.invalidateQueries({ queryKey: ["productos"] });
      queryClient.invalidateQueries({ queryKey: ["caja"] });
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

    if (!modoDiferido && Math.abs(restante) > 0.01) {
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
      formasPago: modoDiferido
        ? []
        : pagos.map((p) => ({
            tipoPago: p.tipoPago,
            monto: p.monto,
          })),
      descuento: subtotal * (descuento / 100),
      fecha: new Date().toISOString(),
      numeroComprobanteAsociado,
    };
    createSaleMutation.mutate(payload);
  };
  // keep ref in sync with the latest closure
  handleFinalizeSaleRef.current = handleFinalizeSale;

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
    <section className="flex-1 min-h-0 flex flex-col gap-2">
      {/* Payment Methods Section */}
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        {/* Section header */}
        <div className="px-4 py-3 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 text-[#67afc3]">
            <CreditCard size={14} strokeWidth={2.5} />
          </div>
          <h3 className="text-xs font-bold text-slate-600 tracking-tight">
            Formas de pago
          </h3>
        </div>
        {modoDiferido ? (
          /* Banner modo diferido */
          <div className="flex flex-col items-center justify-center gap-3 flex-1 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Clock size={22} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                Cobro diferido activo
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                La factura se registra como <b>pendiente</b>. El cobro se
                completa desde <b>Caja &rsaquo; Cobros</b>.
              </p>
            </div>
          </div>
        ) : (
          <>
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
                          {(
                            cliente.Persona_Cliente.MargenDisponible -
                            pagos
                              .filter(
                                (p) =>
                                  p.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE,
                              )
                              .reduce((acc, p) => acc + p.monto, 0)
                          ).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </b>
                      </>
                    ) : (
                      "Sin límite de compra"
                    )}
                  </div>
                </div>
              )}

            <div className="p-3 flex flex-col gap-3 flex-1 min-h-0">
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
                    trigger:
                      "rounded-lg bg-slate-50 h-10 min-h-10 border border-slate-200",
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
                  startContent={
                    <span className="text-slate-400 text-xs">$</span>
                  }
                  className="flex-[1.5]"
                  size="sm"
                  variant="flat"
                  classNames={{
                    inputWrapper:
                      "rounded-lg bg-slate-50 h-10 min-h-10 border border-slate-200",
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
              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
                {pagos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 h-full py-6 text-slate-300">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Wallet
                        size={22}
                        className="text-slate-300"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(
                        [
                          CreditCard,
                          Banknote,
                          ArrowRightLeft,
                          Wallet,
                        ] as React.ElementType[]
                      ).map((Icon, i) => (
                        <div
                          key={i}
                          className="w-9 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center"
                        >
                          <Icon
                            size={11}
                            className="text-slate-300"
                            strokeWidth={1.5}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 text-center max-w-[150px] leading-relaxed">
                      Selecciona un método y monto para agregar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-0.5">
                    {pagos.map((p, idx) => (
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
                            $
                            {p.monto.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}
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
                    ))}
                  </div>
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
                      $
                      {Math.max(0, restante).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "#67afc3" }}
                    >
                      Vuelto
                    </span>
                    <span
                      className="text-base font-bold"
                      style={{ color: "#67afc3" }}
                    >
                      $
                      {Math.abs(restante).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Totals & Actions Card */}
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shrink-0 relative z-10">
        {/* Section header */}
        <div className="px-4 py-3 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 text-[#67afc3]">
            <DollarSign size={14} strokeWidth={2.5} />
          </div>
          <h3 className="text-xs font-bold text-slate-600 tracking-tight">
            Totales
          </h3>
        </div>
        <div className="p-3 flex flex-col gap-3">
          {/* Subtotal + Descuento */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="font-medium">Subtotal</span>
              <span>
                $
                {subtotal.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="font-medium">Descuento</span>
              <div className="flex items-center gap-2">
                {descuento > 0 && subtotal > 0 && (
                  <span className="text-[10px] text-red-400 font-medium">
                    − $
                    {(subtotal * (descuento / 100)).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
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
            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-bold text-slate-500">Total</span>
              <span
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: "#67afc3" }}
              >
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
                className="flex-1 h-11 bg-[#67afc3] hover:bg-[#5a9eb1] text-white font-bold rounded-xl transition-all active:scale-[0.98] text-sm tracking-wide shadow-[0_4px_14px_rgba(103,175,195,0.35)] hover:shadow-[0_6px_20px_rgba(103,175,195,0.45)]"
                onPress={handleFinalizeSale}
                isLoading={isSaving}
                isDisabled={
                  items.length === 0 ||
                  (!modoDiferido && Math.abs(restante) > 0.01)
                }
              >
                {modoDiferido
                  ? "Registrar factura"
                  : Math.abs(restante) < 0.01 && items.length > 0
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
          closeButton:
            "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
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
                  Se eliminarán todos los productos agregados y pagos
                  ingresados. Esta acción no se puede deshacer.
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

      <ModalAbrirCaja
        open={openModalAbrirCaja}
        onClose={() => setOpenModalAbrirCaja(false)}
      />

      {/* Hidden Ticket Component */}
      <div style={{ display: "none" }}>
        <TicketImpresion ref={ticketRef} datosVenta={lastSaleData} />
      </div>
    </section>
  );
}
