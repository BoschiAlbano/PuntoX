"use client";

import { modalMotionProps } from "@/lib/motionConfig";
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
  Spinner,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Wallet,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Plus,
  UserPen,
  Search,
  CheckCircle2,
} from "lucide-react";
import {
  TIPO_PAGO,
  TIPO_COMPROBANTE_VENTA,
  TIPO_COMPROBANTE_VENTA_LABELS,
} from "@/lib/constants/comprobantes";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { useReactToPrint } from "react-to-print";
import { TicketImpresion } from "@/components/ventas/TicketImpresion";

interface CobrarModalProps {
  isOpen: boolean;
  onClose: () => void;
  comprobante: {
    id: number;
    numero: number;
    tipoComprobante: number;
    fecha: string;
    total: number;
    subtotal: number;
    descuento: number;
    cliente: {
      id: number;
      nombre: string;
      apellido: string;
      dni: string | null;
    } | null;
    activarCtaCte: boolean;
    detalles: any[];
  };
}

interface Pago {
  tipoPago: number;
  monto: number;
}

interface ClienteResult {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  dni: string | null;
  activarCtaCte: boolean;
}

const TIPOS_FACTURA = [
  { key: TIPO_COMPROBANTE_VENTA.FACTURA_A, label: "Factura A" },
  { key: TIPO_COMPROBANTE_VENTA.FACTURA_B, label: "Factura B" },
  { key: TIPO_COMPROBANTE_VENTA.FACTURA_C, label: "Factura C" },
];

export function CobrarModal({ isOpen, onClose, comprobante }: CobrarModalProps) {
  const queryClient = useQueryClient();
  const { configuracion } = useConfiguracion({ enableConfiguracion: true });

  // Formas de pago
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [currentTipo, setCurrentTipo] = useState<number>(TIPO_PAGO.EFECTIVO);
  const [currentMonto, setCurrentMonto] = useState<string>(
    comprobante.total.toFixed(2),
  );

  // Cambio de cliente / tipo
  const [clienteQuery, setClienteQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [nuevoCliente, setNuevoCliente] = useState<ClienteResult | null>(null);
  const [nuevoTipo, setNuevoTipo] = useState<number>(comprobante.tipoComprobante);
  const [showClientSearch, setShowClientSearch] = useState(false);

  const [lastTicketData, setLastTicketData] = useState<any>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Debounce de búsqueda de cliente
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(clienteQuery), 400);
    return () => clearTimeout(t);
  }, [clienteQuery]);

  const { data: clienteResults = [], isFetching: buscandoCliente } = useQuery<
    ClienteResult[]
  >({
    queryKey: ["clientes_cobro", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const res = await fetch(
        `/api/ventas/clientes?q=${encodeURIComponent(debouncedQuery)}`,
        { credentials: "include" },
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showClientSearch && debouncedQuery.trim().length > 0,
    staleTime: 0,
  });

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: "Ticket de Cobro",
    pageStyle: `
      @page { size: 58mm auto; margin: 0; }
      @media print { body { margin: 0; padding: 0; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
  const restante = comprobante.total - totalPagado;

  const esConsumidorFinal =
    comprobante.cliente?.nombre === "Consumidor" &&
    comprobante.cliente?.apellido === "Final";

  const paymentOptions = useMemo(
    () =>
      [
        { key: TIPO_PAGO.EFECTIVO, label: "Efectivo" },
        { key: TIPO_PAGO.TARJETA, label: "Tarjeta" },
        { key: TIPO_PAGO.TRANSFERENCIA, label: "Transferencia" },
        { key: TIPO_PAGO.CHEQUE, label: "Cheque" },
        ...(comprobante.activarCtaCte || nuevoCliente?.activarCtaCte
          ? [{ key: TIPO_PAGO.CUENTA_CORRIENTE, label: "Cta. Corriente" }]
          : []),
      ].filter((opt) => !pagos.some((p) => p.tipoPago === opt.key)),
    [comprobante.activarCtaCte, nuevoCliente, pagos],
  );

  const handleAddPayment = () => {
    const montoVal = parseFloat(currentMonto);
    if (isNaN(montoVal) || montoVal <= 0) return;
    if (pagos.some((p) => p.tipoPago === currentTipo)) {
      addToast({
        title: "Error",
        description: "Ese método de pago ya fue agregado.",
        color: "warning",
      });
      return;
    }
    setPagos((prev) => [...prev, { tipoPago: currentTipo, monto: montoVal }]);
    setCurrentMonto("");
  };

  const handleRemove = (idx: number) => {
    setPagos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSelectCliente = (c: ClienteResult) => {
    setNuevoCliente(c);
    setClienteQuery("");
    setDebouncedQuery("");
    setShowClientSearch(false);
  };

  const handleClearCliente = () => {
    setNuevoCliente(null);
    setNuevoTipo(comprobante.tipoComprobante);
  };

  const getTipoLabel = (tipo: number) => {
    switch (tipo) {
      case TIPO_PAGO.EFECTIVO: return "Efectivo";
      case TIPO_PAGO.TARJETA: return "Tarjeta";
      case TIPO_PAGO.CHEQUE: return "Cheque";
      case TIPO_PAGO.CUENTA_CORRIENTE: return "Cta. Cte.";
      case TIPO_PAGO.TRANSFERENCIA: return "Transf.";
      default: return "Otro";
    }
  };

  const getTipoIcon = (tipo: number) => {
    switch (tipo) {
      case TIPO_PAGO.EFECTIVO: return <Banknote size={13} className="text-emerald-500" />;
      case TIPO_PAGO.TARJETA: return <CreditCard size={13} className="text-blue-500" />;
      case TIPO_PAGO.TRANSFERENCIA: return <ArrowRightLeft size={13} className="text-purple-500" />;
      default: return <Wallet size={13} className="text-slate-500" />;
    }
  };

  const cobrarMutation = useMutation({
    mutationFn: async (payload: {
      formasPago: Pago[];
      clienteId?: number;
      tipoComprobante?: number;
    }) => {
      const res = await fetch(`/api/cobros/${comprobante.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        const msg =
          typeof err.error === "object" ? err.error.message : err.error;
        throw new Error(msg || "Error al cobrar");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const cobro = data.cobro;
      const tipoLabel =
        TIPO_COMPROBANTE_VENTA_LABELS[cobro.tipoComprobante] || "Factura";

      const ticketData = {
        items: cobro.detalles,
        cliente: cobro.cliente
          ? {
              Nombre: cobro.cliente.Nombre,
              Apellido: cobro.cliente.Apellido,
              Cuit: cobro.cliente.Dni,
            }
          : null,
        subtotal: cobro.subtotal,
        descuento: cobro.descuento,
        total: cobro.total,
        fecha: cobro.fecha,
        numeroComprobante: cobro.numero.toString(),
        tipoComprobante: tipoLabel,
        formasPago: cobro.formasPago,
        pie: configuracion?.observacionPieFactura ?? "",
      };

      setLastTicketData(ticketData);
      queryClient.invalidateQueries({ queryKey: ["cobros-pendientes"] });
      queryClient.invalidateQueries({ queryKey: ["caja"] });

      addToast({
        title: "Cobro registrado",
        description: `${tipoLabel} #${cobro.numero} cobrada con éxito.`,
      });

      setTimeout(() => {
        handlePrint();
        onClose();
        resetState();
      }, 400);
    },
    onError: (err: any) => {
      addToast({ title: "Error", description: err.message, color: "danger" });
    },
  });

  const resetState = () => {
    setPagos([]);
    setCurrentMonto(comprobante.total.toFixed(2));
    setNuevoCliente(null);
    setNuevoTipo(comprobante.tipoComprobante);
    setClienteQuery("");
    setShowClientSearch(false);
  };

  const handleCobrar = () => {
    if (Math.abs(restante) > 0.01) {
      addToast({
        title: "Error",
        description: "El pago debe cubrir exactamente el total del comprobante.",
        color: "danger",
      });
      return;
    }
    const payload: { formasPago: Pago[]; clienteId?: number; tipoComprobante?: number } = {
      formasPago: pagos,
    };
    if (nuevoCliente) payload.clienteId = nuevoCliente.id;
    if (nuevoTipo !== comprobante.tipoComprobante) payload.tipoComprobante = nuevoTipo;
    cobrarMutation.mutate(payload);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const tipoLabel =
    TIPO_COMPROBANTE_VENTA_LABELS[comprobante.tipoComprobante] || "Factura";
  const clienteNombre = nuevoCliente
    ? `${nuevoCliente.nombre} ${nuevoCliente.apellido}`.trim()
    : comprobante.cliente
      ? `${comprobante.cliente.nombre} ${comprobante.cliente.apellido}`.trim()
      : "Consumidor Final";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={handleClose}
        size="lg"
        backdrop="opaque"
        scrollBehavior="inside"
        motionProps={modalMotionProps}
        classNames={{
          wrapper: "items-end sm:items-center",
          base: "bg-white shadow-2xl rounded-t-2xl rounded-b-none sm:rounded-2xl w-full sm:w-auto m-0 sm:m-auto max-h-[92vh]",
          header: "border-b border-slate-100 pb-4",
          footer: "border-t border-slate-100 pt-3",
        }}
      >
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader className="flex flex-col gap-0.5 pt-5 px-6">
                <h2 className="text-lg font-extrabold text-slate-800">
                  Cobrar {tipoLabel} #
                  {comprobante.numero.toString().padStart(8, "0")}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>{clienteNombre}</span>
                  {esConsumidorFinal && !nuevoCliente && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <UserPen size={11} />
                      Consumidor Final
                    </span>
                  )}
                  <span>·</span>
                  <span>
                    {new Date(comprobante.fecha).toLocaleDateString("es-AR")}
                  </span>
                </div>
              </ModalHeader>

              <ModalBody className="px-6 py-4 flex flex-col gap-4">
                {/* Total */}
                <div className="flex justify-between items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                  <span className="text-sm font-semibold text-slate-500">
                    Total a cobrar
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    $
                    {comprobante.total.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Cambio de cliente (solo para Consumidor Final) */}
                {esConsumidorFinal && (
                  <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <UserPen size={11} />
                        Cambiar cliente
                      </p>
                      {!nuevoCliente && (
                        <button
                          type="button"
                          onClick={() => setShowClientSearch((v) => !v)}
                          className="text-[10px] font-semibold text-[#67afc3] hover:underline"
                        >
                          {showClientSearch ? "Cancelar" : "Buscar cliente"}
                        </button>
                      )}
                    </div>

                    {/* Cliente seleccionado */}
                    {nuevoCliente ? (
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {nuevoCliente.nombre} {nuevoCliente.apellido}
                          </p>
                          {nuevoCliente.dni && (
                            <p className="text-[10px] text-slate-400">
                              DNI {nuevoCliente.dni}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={handleClearCliente}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : showClientSearch ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="relative">
                          <Input
                            autoFocus
                            size="sm"
                            placeholder="Buscar por nombre, apellido o DNI..."
                            value={clienteQuery}
                            onValueChange={setClienteQuery}
                            startContent={
                              buscandoCliente ? (
                                <Spinner size="sm" className="scale-75" />
                              ) : (
                                <Search size={13} className="text-slate-400" />
                              )
                            }
                            classNames={{
                              inputWrapper:
                                "rounded-lg bg-white h-9 min-h-9 border border-slate-200",
                              input: "text-xs",
                            }}
                            variant="flat"
                          />
                        </div>

                        {clienteResults.length > 0 && (
                          <div className="flex flex-col divide-y divide-slate-50 bg-white border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                            {clienteResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectCliente(c)}
                                className="flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                              >
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">
                                    {c.nombre} {c.apellido}
                                  </p>
                                  {c.dni && (
                                    <p className="text-[10px] text-slate-400">
                                      DNI {c.dni}
                                    </p>
                                  )}
                                </div>
                                {c.activarCtaCte && (
                                  <span className="text-[9px] font-bold bg-blue-50 text-blue-500 border border-blue-200 rounded px-1.5 py-0.5">
                                    CtaCte
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {debouncedQuery.trim().length > 0 &&
                          !buscandoCliente &&
                          clienteResults.length === 0 && (
                            <p className="text-[10px] text-slate-400 text-center py-2">
                              Sin resultados para "{debouncedQuery}"
                            </p>
                          )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        La factura se cobrará a Consumidor Final.
                      </p>
                    )}

                    {/* Selector de tipo de comprobante (después de elegir cliente) */}
                    {nuevoCliente && (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                          Tipo de comprobante
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {TIPOS_FACTURA.map((t) => (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => setNuevoTipo(t.key)}
                              className={[
                                "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                nuevoTipo === t.key
                                  ? "bg-[#67afc3] border-[#67afc3] text-white shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-[#67afc3] hover:text-[#67afc3]",
                              ].join(" ")}
                            >
                              {t.key === nuevoTipo ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 size={11} />
                                  {t.label}
                                </span>
                              ) : (
                                t.label
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Formas de pago */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Formas de pago
                  </p>

                  <div className="flex gap-2 items-end">
                    <Select
                      label="Método"
                      selectedKeys={[currentTipo.toString()]}
                      onChange={(e) => {
                        setCurrentTipo(Number(e.target.value));
                        const remaining =
                          comprobante.total -
                          pagos.reduce((acc, p) => acc + p.monto, 0);
                        setCurrentMonto(Math.max(0, remaining).toFixed(2));
                      }}
                      className="flex-[1.2]"
                      size="sm"
                      variant="flat"
                      classNames={{
                        trigger:
                          "rounded-lg bg-slate-50 h-10 min-h-10 border border-slate-200",
                        label: "text-xs",
                      }}
                    >
                      {paymentOptions.map((opt) => (
                        <SelectItem
                          key={opt.key}
                          textValue={opt.label}
                          className="text-xs"
                        >
                          {opt.label}
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

                  {/* Lista de pagos */}
                  <div className="space-y-1 min-h-[40px]">
                    {pagos.length === 0 ? (
                      <div className="flex items-center justify-center py-3 text-slate-300 text-xs">
                        Sin pagos agregados
                      </div>
                    ) : (
                      pagos.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center px-3 py-2 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                              {getTipoIcon(p.tipoPago)}
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
                              onClick={() => handleRemove(idx)}
                              className="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Restante */}
                  {pagos.length > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      {restante > 0.01 ? (
                        <>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                            Restante
                          </span>
                          <span className="text-base font-bold text-slate-700">
                            $
                            {restante.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">
                            Vuelto
                          </span>
                          <span className="text-base font-bold text-emerald-600">
                            $
                            {Math.abs(restante).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </ModalBody>

              <ModalFooter className="px-6 pb-5 flex gap-2">
                <Button
                  variant="light"
                  className="flex-1 text-slate-500 font-medium"
                  onPress={onModalClose}
                  isDisabled={cobrarMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-[#182337] text-white font-bold rounded-xl h-11"
                  onPress={handleCobrar}
                  isLoading={cobrarMutation.isPending}
                  isDisabled={pagos.length === 0 || Math.abs(restante) > 0.01}
                >
                  Confirmar cobro
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Hidden ticket for printing */}
      <div style={{ display: "none" }}>
        <TicketImpresion ref={ticketRef} datosVenta={lastTicketData} />
      </div>
    </>
  );
}
