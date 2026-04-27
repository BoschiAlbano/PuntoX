"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
} from "@heroui/react";
import {
  Trash2,
  Plus,
  X,
  Wallet,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";
import ProveedorSearchModal from "./ProveedorSearchModal";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { useCaja } from "@/hooks/useCaja";
import { useCompraStore } from "@/store/useCompraStore";
import { useRealizarCompra } from "@/hooks/useRealizarCompra";

interface CompraFooterProps {
  subtotal: number;
  total: number;
  items: any[];
  handleLimpiar: () => void;
}

export default function CompraFooter({
  subtotal,
  total,
  items,
  handleLimpiar,
}: CompraFooterProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const { configuracion } = useConfiguracion({ enableConfiguracion: true });
  const { cajaActual, abrirCaja, isLoading } = useCaja({ enableCaja: true });

  const { pagos, addPago, removePago, setPagos, proveedor, setProveedor } =
    useCompraStore();

  const [currentTipo, setCurrentTipo] = useState<number>(
    configuracion?.tipoFormaPagoPorDefectoCompra || TIPO_PAGO.EFECTIVO,
  );
  const [currentMonto, setCurrentMonto] = useState<string>("");
  const [openModalAbrirCaja, setOpenModalAbrirCaja] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [montoInicial, setMontoInicial] = useState<string>("0");
  const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);

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
    } catch {
      addToast({
        title: "Error",
        description: "Error al abrir caja",
        color: "danger",
      });
    } finally {
      setIsOpening(false);
    }
  };

  useEffect(() => {
    if (items.length === 0) {
      setPagos([]);
      setCurrentTipo(
        configuracion?.tipoFormaPagoPorDefectoCompra || TIPO_PAGO.EFECTIVO,
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

  const paymentOptions = useMemo(
    () =>
      [
        { key: TIPO_PAGO.EFECTIVO, label: "Efectivo" },
        { key: TIPO_PAGO.TARJETA, label: "Tarjeta" },
        { key: TIPO_PAGO.TRANSFERENCIA, label: "Transferencia" },
        { key: TIPO_PAGO.CHEQUE, label: "Cheque" },
        ...(proveedor
          ? [{ key: TIPO_PAGO.CUENTA_CORRIENTE, label: "Cta. Corriente" }]
          : []),
      ].filter((option) => !pagos.some((p) => p.tipoPago === option.key)),
    [pagos, proveedor],
  );

  const handleAddPayment = () => {
    const montoVal = parseFloat(currentMonto);
    if (isNaN(montoVal) || montoVal <= 0) return;
    if (pagos.some((p) => p.tipoPago === currentTipo)) {
      addToast({
        title: "Error",
        description: "Este método ya fue agregado",
        color: "warning",
      });
      return;
    }
    addPago({ tipoPago: currentTipo, monto: montoVal });
  };

  const realizarCompra = useRealizarCompra(() => {
    handleLimpiar();
  });

  const handleFinalizeCompra = () => {
    if (items.length === 0) {
      addToast({
        title: "Error",
        description: "No hay productos en la compra",
        color: "danger",
      });
      return;
    }
    if (!proveedor) {
      addToast({
        title: "Error",
        description: "Debe seleccionar un proveedor",
        color: "danger",
      });
      return;
    }
    if (Math.abs(restante) > 0.01) {
      addToast({
        title: "Error",
        description: "El pago debe cubrir el total exactamente",
        color: "danger",
      });
      return;
    }

    realizarCompra.mutate({
      proveedorId: proveedor.Id,
      detalles: items.map((i) => ({
        articuloId: i.Id,
        codigo: i.Codigo?.toString() || "",
        descripcion: i.Descripcion,
        cantidad: i.cantidad,
        costoUnitario: i.costoUnitario,
        subtotal: i.subtotal,
        preciosListaActualizados: i.preciosListaActualizados ?? [],
      })),
      formasPago: pagos.map((p) => ({ tipoPago: p.tipoPago, monto: p.monto })),
      fecha: new Date().toISOString(),
    });
  };

  const getTipoLabel = (tipo: number) => {
    switch (tipo) {
      case TIPO_PAGO.EFECTIVO:
        return "Efectivo";
      case TIPO_PAGO.TARJETA:
        return "Tarjeta";
      case TIPO_PAGO.CHEQUE:
        return "Cheque";
      case TIPO_PAGO.TRANSFERENCIA:
        return "Transf.";
      case TIPO_PAGO.CUENTA_CORRIENTE:
        return "Cta. Corriente";
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
        return <Building2 size={size} className="text-[#67afc3]" />;
      default:
        return <Wallet size={size} className="text-slate-500" />;
    }
  };

  return (
    <section className="flex-1 flex flex-col gap-2">
      {/* Proveedor */}
      <div className="flex flex-col gap-1.5 h-[58px]">
        {proveedor ? (
          <div className="flex  bg-white rounded-xl border border-slate-100 shrink-0 overflow-hidden shadow-sm items-center justify-between px-3 py-3 ">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#67afc3]/15 border border-[#67afc3]/20 flex items-center justify-center text-[#67afc3] font-bold text-sm shrink-0">
                {proveedor.RazonSocial.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-800 truncate">
                {proveedor.RazonSocial}
              </span>
            </div>
            <button
              onClick={() => setProveedor(null)}
              className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
              aria-label="Quitar proveedor"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <Button
            variant="flat"
            className="bg-white rounded-xl border border-slate-100 shrink-0 overflow-hidden shadow-sm justify-start gap-2 p-3 h-full "
            onPress={() => setIsProveedorModalOpen(true)}
            startContent={<Building2 size={15} className="text-[#67afc3]" />}
          >
            <span className="text-xs font-medium">Buscar proveedor...</span>
          </Button>
        )}
      </div>

      <ProveedorSearchModal
        isOpen={isProveedorModalOpen}
        onOpenChange={() => setIsProveedorModalOpen(false)}
        handleSelect={(p) => {
          setProveedor(p);
          setIsProveedorModalOpen(false);
        }}
      />

      {/* Formas de pago */}
      <div className="bg-white flex-1 rounded-xl border border-slate-100 flex flex-col shadow-sm overflow-hidden">
        <div className="p-3 flex flex-col gap-3 flex-1">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Formas de pago
          </p>

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
              startContent={<span className="text-slate-400 text-xs">$</span>}
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
              className="h-10 w-10 min-w-10 bg-[#67afc3] hover:bg-[#5a9eb1] active:scale-95 text-white rounded-lg flex items-center justify-center transition-all shrink-0"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-1 scrollbar-hide">
            {pagos.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-300 gap-1.5 py-4 min-h-[56px]">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center">
                  <Wallet size={16} className="text-slate-300" />
                </div>
                <span className="text-[10px] font-medium">
                  Sin pagos agregados
                </span>
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
                      $
                      {p.monto.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <button
                      onClick={() => removePago(idx)}
                      className="min-w-[28px] h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

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
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">
                  Completo
                </span>
                <span className="text-base font-bold text-emerald-600">✓</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Totales y acción */}
      <div className="bg-white rounded-xl border border-slate-100 p-3 shrink-0 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span className="font-medium">Subtotal</span>
            <span>
              ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-px bg-slate-100 w-full" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Total</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="flat"
            isIconOnly
            className="w-11 h-11 min-w-11 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition-colors"
            onPress={() => setIsCancelModalOpen(true)}
            isDisabled={realizarCompra.isPending || items.length === 0}
          >
            <Trash2 size={17} />
          </Button>

          {isLoading ? (
            <Skeleton className="flex-1 rounded-xl h-11" />
          ) : cajaActual ? (
            <Button
              size="sm"
              className="flex-1 h-11 bg-[#182337] hover:bg-[#0f1929] text-white font-bold rounded-xl transition-all active:scale-[0.98] text-sm tracking-wide shadow-sm"
              onPress={handleFinalizeCompra}
              isLoading={realizarCompra.isPending}
              isDisabled={
                Math.abs(restante) > 0.01 || items.length === 0 || !proveedor
              }
            >
              {Math.abs(restante) < 0.01 && items.length > 0 && proveedor
                ? "Confirmar compra"
                : !proveedor
                  ? "Seleccionar proveedor"
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

      {/* Modal confirmación cancelar */}
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
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-2">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Cancelar Compra
                </h2>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm font-medium text-slate-500">
                  ¿Estás seguro de que deseas cancelar la compra actual?
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Se eliminarán todos los productos y pagos ingresados.
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

      {/* Modal abrir caja */}
      {openModalAbrirCaja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpenModalAbrirCaja(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Abrir Caja
            </h3>
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
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpenModalAbrirCaja(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAbrirCaja}
                disabled={isOpening}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
              >
                {isOpening ? "Abriendo..." : "Abrir Caja"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
