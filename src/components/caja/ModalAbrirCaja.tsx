"use client";

import { useState } from "react";
import { addToast } from "@heroui/react";
import { useCaja } from "@/hooks/useCaja";
import { useConfiguracion } from "@/hooks/useConfiguracion";

interface ModalAbrirCajaProps {
  open: boolean;
  onClose: () => void;
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
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  const sizeClass = size === "xl" ? "max-w-2xl" : "max-w-md";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ModalAbrirCaja({ open, onClose }: ModalAbrirCajaProps) {
  const { abrirCaja } = useCaja({ enableCaja: true });
  const { configuracion } = useConfiguracion({ enableConfiguracion: true });
  
  const ingresoManualHabilitado = configuracion?.ingresoManualCajaInicial ?? false;
  const [montoInicial, setMontoInicial] = useState<string>("0");
  const [isOpening, setIsOpening] = useState(false);

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
      setMontoInicial("0");
      onClose();
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

  return (
    <ModalShell
      open={open}
      title="Abrir Caja"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
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
          disabled={!ingresoManualHabilitado}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 ${
            ingresoManualHabilitado
              ? "border-slate-200 text-slate-700 focus:border-slate-800"
              : "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
          }`}
          aria-label="Monto inicial para abrir la caja"
        />
        <p className="text-xs text-slate-500">
          {ingresoManualHabilitado
            ? "Ingrese el monto inicial con el que se abrirá la caja."
            : "El monto inicial está configurado en 0."}
        </p>
      </div>
    </ModalShell>
  );
}