"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePagePermission } from "@/lib/permissions/usePagePermission";
import {
  TrendingUp,
  Plus,
  Lock,
  Unlock,
  FileText,
  Wallet,
  Eye,
  RefreshCw,
  X,
} from "lucide-react";

// Constantes de tipos de pago
const TIPO_PAGO = {
  EFECTIVO: 1,
  TARJETA: 2,
  CHEQUE: 3,
  CUENTA_CORRIENTE: 4,
  TRANSFERENCIA: 5,
};

const TIPO_MOVIMIENTO = {
  ENTRADA: 1,
  SALIDA: 2,
};

// Tipos
type UsuarioCaja = {
  Id: number;
  Nombre: string;
  NombreCompleto: string | null;
};

type DetalleCaja = {
  Id: number;
  CajaId: number;
  TipoPago: number;
  Monto: number;
  EstaEliminado: boolean;
  TenantId: number;
};

type Caja = {
  Id: number;
  UsuarioAperturaId: number;
  MontoInicial: number;
  FechaApertura: string;
  UsuarioCierreId: number | null;
  FechaCierre: string | null;
  MontoCierre: number | null;
  TotalEntradaEfectivo: number;
  TotalSalidaEfectivo: number;
  TotalEntradaTarjeta: number;
  TotalSalidaTarjeta: number;
  TotalEntradaCheque: number;
  TotalSalidaCheque: number;
  TotalEntradaCtaCte: number;
  TotalSalidaCtaCte: number;
  TotalEntradaTransf: number;
  TotalSalidaTransf: number;
  Ganancia: number;
  EstaEliminado: boolean;
  UsuarioApertura?: UsuarioCaja | null;
  UsuarioCierre?: UsuarioCaja | null;
  DetalleCaja?: DetalleCaja[];
};

type Movimiento = {
  Id: number;
  CajaId: number;
  ComprobanteId: number;
  UsuarioId: number;
  Monto: number;
  Fecha: string;
  Descripcion: string;
  TipoMovimiento: number;
  EstaEliminado: boolean;
  Comprobante?: {
    Id: number;
    Numero: number;
    TipoComprobante: number;
    Total: number;
    Fecha: string;
  };
  Usuario?: {
    Id: number;
    Nombre: string;
  };
};

type Gasto = {
  Id: number;
  CajaId: number;
  ConceptoGastoId: number;
  Fecha: string;
  Descripcion: string;
  Monto: number;
  EstaEliminado: boolean;
  ConceptoGastos?: {
    Id: number;
    Descripcion: string;
  };
};

type ConceptoGasto = {
  Id: number;
  Descripcion: string;
};

type ResumenDiaCaja = {
  Id: number;
  FechaApertura: string;
  FechaCierre: string | null;
  MontoInicial: number;
  MontoCierre: number | null;
  TotalEntradaEfectivo: number;
  TotalSalidaEfectivo: number;
  Ganancia: number;
  estaCerrada: boolean;
  UsuarioApertura?: {
    Id: number;
    Nombre: string;
    NombreCompleto: string | null;
  } | null;
  UsuarioCierre?: {
    Id: number;
    Nombre: string;
    NombreCompleto: string | null;
  } | null;
};

type ResumenDia = {
  fecha: string;
  cantidadCajas: number;
  totales: {
    montoInicial: number;
    totalEntradaEfectivo: number;
    totalSalidaEfectivo: number;
    totalEntradaTarjeta: number;
    totalSalidaTarjeta: number;
    totalEntradaCheque: number;
    totalSalidaCheque: number;
    totalEntradaCtaCte: number;
    totalSalidaCtaCte: number;
    totalEntradaTransf: number;
    totalSalidaTransf: number;
    ganancia: number;
    efectivo: number;
    tarjeta: number;
    cheque: number;
    cuentaCorriente: number;
    transferencia: number;
    totalCaja: number;
  };
  cajas: ResumenDiaCaja[];
};

type ToastTone = "success" | "warning" | "danger" | "default";

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  color?: ToastTone;
};

export default function CajaPage() {
  // Verificar permisos de acceso a esta página
  const { tieneAcceso, isLoading: isLoadingPermisos } = usePagePermission();

  // TODOS LOS HOOKS DEBEN IR ANTES DE LOS EARLY RETURNS
  const [cajaActual, setCajaActual] = useState<Caja | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [conceptosGasto, setConceptosGasto] = useState<ConceptoGasto[]>([]);
  const [resumenDia, setResumenDia] = useState<ResumenDia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  };

  // Estados para modales
  const [openModalAbrirCaja, setOpenModalAbrirCaja] = useState(false);
  const [openModalCerrarCaja, setOpenModalCerrarCaja] = useState(false);
  const [openModalGasto, setOpenModalGasto] = useState(false);
  const [openModalDetalle, setOpenModalDetalle] = useState(false);

  // Estados para formularios
  const [montoInicial, setMontoInicial] = useState<string>("0");
  const [montoCierre, setMontoCierre] = useState<string>("0");
  const [nuevoGasto, setNuevoGasto] = useState({
    conceptoId: "",
    descripcion: "",
    monto: "",
  });

  // Cargar datos iniciales solo si tiene acceso
  useEffect(() => {
    if (tieneAcceso && !isLoadingPermisos) {
      cargarDatos();
    }
  }, [tieneAcceso, isLoadingPermisos]);

  // EARLY RETURNS DESPUÉS DE TODOS LOS HOOKS
  // No renderizar contenido hasta que los permisos estén verificados
  if (isLoadingPermisos) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si tieneAcceso es undefined, aún está cargando
  if (tieneAcceso === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no tiene acceso, no renderizar nada (usePagePermission ya redirige)
  if (tieneAcceso === false) {
    return null;
  }

  const cargarDatos = async () => {
    // No hacer peticiones si no tiene acceso
    if (!tieneAcceso) {
      return;
    }

    try {
      setIsLoading(true);

      // Cargar caja actual, conceptos de gastos y resumen del día en paralelo
      const [cajaRes, conceptosRes, resumenRes] = await Promise.all([
        fetch("/api/caja?soloAbierta=true", { cache: "no-store" }),
        fetch("/api/conceptos-gastos", { cache: "no-store" }),
        fetch("/api/caja?resumenDia=true", { cache: "no-store" }),
      ]);

      if (cajaRes.ok) {
        const cajaData = await cajaRes.json();
        if (cajaData.caja) {
          setCajaActual(cajaData.caja);
          setMovimientos(cajaData.caja.Movimiento || []);
          setGastos(cajaData.caja.Gasto || []);
        } else {
          setCajaActual(null);
          setMovimientos([]);
          setGastos([]);
        }
      } else {
        // Si es error 401/403, no mostrar toast (el hook ya maneja la redirección)
        if (cajaRes.status === 401 || cajaRes.status === 403) {
          return;
        }
        const errorData = await cajaRes.json().catch(() => null);
        const errorMessage =
          typeof errorData?.error === "string"
            ? errorData.error
            : errorData?.error?.message || "No se pudo cargar la caja";
        addToast({
          title: "Error",
          description: errorMessage,
          color: "warning",
        });
      }

      if (conceptosRes.ok) {
        const conceptosData = await conceptosRes.json();
        setConceptosGasto(conceptosData.conceptosGasto || []);
      } else {
        // Si es error 401/403, no mostrar toast (el hook ya maneja la redirección)
        if (conceptosRes.status !== 401 && conceptosRes.status !== 403) {
          const errorData = await conceptosRes.json().catch(() => null);
          const errorMessage =
            typeof errorData?.error === "string"
              ? errorData.error
              : errorData?.error?.message ||
                "No se pudieron cargar los conceptos de gastos";
          addToast({
            title: "Error",
            description: errorMessage,
            color: "warning",
          });
        }
      }

      if (resumenRes.ok) {
        const resumenData = await resumenRes.json();
        setResumenDia(resumenData.resumenDia || null);
      }
    } catch (error) {
      // No mostrar error si es por falta de permisos (el hook ya maneja la redirección)
      if (error instanceof Error && error.message.includes("401")) {
        return;
      }
      console.error("Error cargando datos", error);
      addToast({
        title: "Error",
        description: "No se pudieron cargar los datos de caja",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular totales - Convertir todos los valores a números para evitar concatenación
  const totales = cajaActual
    ? {
        efectivo:
          Number(cajaActual.MontoInicial || 0) +
          Number(cajaActual.TotalEntradaEfectivo || 0) -
          Number(cajaActual.TotalSalidaEfectivo || 0),
        tarjeta:
          Number(cajaActual.TotalEntradaTarjeta || 0) -
          Number(cajaActual.TotalSalidaTarjeta || 0),
        cheque:
          Number(cajaActual.TotalEntradaCheque || 0) -
          Number(cajaActual.TotalSalidaCheque || 0),
        cuentaCorriente:
          Number(cajaActual.TotalEntradaCtaCte || 0) -
          Number(cajaActual.TotalSalidaCtaCte || 0),
        transferencia:
          Number(cajaActual.TotalEntradaTransf || 0) -
          Number(cajaActual.TotalSalidaTransf || 0),
        totalEntradas:
          Number(cajaActual.TotalEntradaEfectivo || 0) +
          Number(cajaActual.TotalEntradaTarjeta || 0) +
          Number(cajaActual.TotalEntradaCheque || 0) +
          Number(cajaActual.TotalEntradaCtaCte || 0) +
          Number(cajaActual.TotalEntradaTransf || 0),
        totalSalidas:
          Number(cajaActual.TotalSalidaEfectivo || 0) +
          Number(cajaActual.TotalSalidaTarjeta || 0) +
          Number(cajaActual.TotalSalidaCheque || 0) +
          Number(cajaActual.TotalSalidaCtaCte || 0) +
          Number(cajaActual.TotalSalidaTransf || 0),
        totalCaja:
          Number(cajaActual.MontoInicial || 0) +
          Number(cajaActual.TotalEntradaEfectivo || 0) -
          Number(cajaActual.TotalSalidaEfectivo || 0) +
          Number(cajaActual.TotalEntradaTarjeta || 0) -
          Number(cajaActual.TotalSalidaTarjeta || 0) +
          Number(cajaActual.TotalEntradaCheque || 0) -
          Number(cajaActual.TotalSalidaCheque || 0) +
          Number(cajaActual.TotalEntradaCtaCte || 0) -
          Number(cajaActual.TotalSalidaCtaCte || 0) +
          Number(cajaActual.TotalEntradaTransf || 0) -
          Number(cajaActual.TotalSalidaTransf || 0),
      }
    : null;

  const cajaAbierta = cajaActual && !cajaActual.FechaCierre;
  const toastToneStyles: Record<ToastTone, string> = {
    success: "border-emerald-200/70 text-emerald-700 bg-emerald-50/90",
    warning: "border-amber-200/70 text-amber-700 bg-amber-50/90",
    danger: "border-rose-200/70 text-rose-700 bg-rose-50/90",
    default: "border-slate-200/70 text-slate-700 bg-white/90",
  };

  // Separar total de medios de pago para mejor jerarquía
  const mediosPago = totales
    ? [
        {
          key: "efectivo",
          label: "Efectivo",
          value: totales.efectivo,
        },
        {
          key: "transferencia",
          label: "Transferencia",
          value: totales.transferencia,
        },
        {
          key: "tarjeta",
          label: "Tarjeta",
          value: totales.tarjeta,
        },
        {
          key: "cheque",
          label: "Cheque",
          value: totales.cheque,
        },
        {
          key: "cta",
          label: "Cuenta Corriente",
          value: totales.cuentaCorriente,
        },
      ]
    : [];

  // Abrir caja
  const abrirCaja = async () => {
    if (!montoInicial || Number(montoInicial) < 0) {
      addToast({
        title: "Error",
        description: "El monto inicial debe ser mayor o igual a 0",
        color: "danger",
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montoInicial: Number(montoInicial) }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "No se pudo abrir la caja");
      }

      addToast({
        title: "✓ Caja abierta",
        description: `Caja abierta con $${Number(montoInicial).toFixed(2)}`,
        color: "success",
      });

      setOpenModalAbrirCaja(false);
      setMontoInicial("0");
      await cargarDatos();
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo abrir la caja",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cerrar caja
  const cerrarCaja = async () => {
    if (!montoCierre || Number(montoCierre) < 0) {
      addToast({
        title: "Error",
        description: "El monto de cierre debe ser mayor o igual a 0",
        color: "danger",
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/caja?accion=cerrar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montoCierre: Number(montoCierre) }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "No se pudo cerrar la caja");
      }

      addToast({
        title: "✓ Caja cerrada",
        description: `Caja cerrada con $${Number(montoCierre).toFixed(2)}`,
        color: "success",
      });

      setOpenModalCerrarCaja(false);
      setMontoCierre("0");
      await cargarDatos();
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo cerrar la caja",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Agregar gasto
  const agregarGasto = async () => {
    if (
      !nuevoGasto.conceptoId ||
      !nuevoGasto.descripcion ||
      !nuevoGasto.monto
    ) {
      addToast({
        title: "Error",
        description: "Complete todos los campos",
        color: "danger",
      });
      return;
    }

    if (Number(nuevoGasto.monto) <= 0) {
      addToast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        color: "danger",
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/caja?accion=gasto", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptoGastoId: Number(nuevoGasto.conceptoId),
          descripcion: nuevoGasto.descripcion,
          monto: Number(nuevoGasto.monto),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "No se pudo registrar el gasto");
      }

      addToast({
        title: "✓ Gasto registrado",
        description: `Gasto de $${Number(nuevoGasto.monto).toFixed(
          2
        )} registrado`,
        color: "success",
      });

      setOpenModalGasto(false);
      setNuevoGasto({ conceptoId: "", descripcion: "", monto: "" });
      await cargarDatos();
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el gasto",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (value: number) =>
    value.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Obtener nombre del tipo de pago
  const nombreTipoPago = (tipo: number) => {
    switch (tipo) {
      case TIPO_PAGO.EFECTIVO:
        return "Efectivo";
      case TIPO_PAGO.TARJETA:
        return "Tarjeta";
      case TIPO_PAGO.CHEQUE:
        return "Cheque";
      case TIPO_PAGO.CUENTA_CORRIENTE:
        return "Cuenta Corriente";
      case TIPO_PAGO.TRANSFERENCIA:
        return "Transferencia";
      default:
        return "Desconocido";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#67afc3] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:py-8 px-4 sm:px-6 flex flex-col items-stretch justify-center">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[220px] rounded-xl border px-3 py-2 text-sm shadow-sm backdrop-blur ${
              toastToneStyles[toast.color || "default"]
            }`}
          >
            <p className="font-semibold">{toast.title}</p>
            {toast.description && (
              <p className="text-xs opacity-80">{toast.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Barra superior compacta con badges y botones */}
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 shadow-sm">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              cajaAbierta
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
          </span>
          {cajaActual?.UsuarioApertura && (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Usuario:{" "}
              {cajaActual.UsuarioApertura.NombreCompleto ||
                cajaActual.UsuarioApertura.Nombre}
            </span>
          )}
          {cajaActual?.FechaApertura && (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Apertura: {formatearFecha(cajaActual.FechaApertura)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
          <button
            onClick={() => cargarDatos()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Actualizar datos de caja"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <button
            onClick={() => setOpenModalDetalle(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Ver detalle completo"
          >
            <Eye className="h-4 w-4" />
            Ver detalle
          </button>
          {cajaAbierta ? (
            <button
              onClick={() => setOpenModalCerrarCaja(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-300 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-400 hover:shadow-lg"
              aria-label="Cerrar caja"
            >
              <Lock className="h-4 w-4" />
              Cerrar Caja
            </button>
          ) : (
            <button
              onClick={() => setOpenModalAbrirCaja(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#67afc3] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5a9fb2]"
              aria-label="Abrir caja"
            >
              <Unlock className="h-4 w-4" />
              Abrir Caja
            </button>
          )}
        </div>
      </div>

      {totales && (
        <div className="mt-8 space-y-6">
          {/* Card dominante: Total en Caja */}
          <div className="rounded-2xl border-2 border-[#67afc3]/30 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#67afc3]/10">
                  <Wallet className="h-7 w-7 text-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total en Caja
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    ${formatMoney(totales.totalCaja)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque: Medios de pago */}
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Medios de pago
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {mediosPago.map((medio) => (
                <div
                  key={medio.key}
                  className="rounded-xl border border-slate-200/50 bg-slate-50/50 p-4"
                >
                  <p className="mb-1 text-xs font-medium text-slate-500">
                    {medio.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    ${formatMoney(medio.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resumen del día - Solo mostrar si hay más de una caja o cajas cerradas */}
      {resumenDia &&
        resumenDia.cantidadCajas > 0 &&
        (resumenDia.cantidadCajas > 1 ||
          resumenDia.cajas.some((c) => c.estaCerrada)) && (
          <div className="mt-8 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-amber-700"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                    Resumen del día
                  </h3>
                  <p className="text-xs text-amber-600">
                    {resumenDia.cantidadCajas}{" "}
                    {resumenDia.cantidadCajas === 1 ? "caja" : "cajas"}{" "}
                    registradas hoy
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-900">
                ${formatMoney(resumenDia.totales.totalCaja)}
              </p>
            </div>

            {/* Lista de cajas del día */}
            <div className="space-y-2">
              {resumenDia.cajas.map((caja, idx) => (
                <div
                  key={caja.Id}
                  className={`flex items-center justify-between rounded-xl p-3 ${
                    caja.estaCerrada
                      ? "bg-white/60 border border-slate-200/50"
                      : "bg-amber-100/50 border border-amber-200/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {caja.UsuarioApertura?.NombreCompleto ||
                          caja.UsuarioApertura?.Nombre ||
                          "Usuario"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatearFecha(caja.FechaApertura)}
                        {caja.estaCerrada && caja.FechaCierre && (
                          <span> → {formatearFecha(caja.FechaCierre)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      $
                      {formatMoney(
                        caja.MontoInicial +
                          caja.TotalEntradaEfectivo -
                          caja.TotalSalidaEfectivo
                      )}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        caja.estaCerrada
                          ? "bg-slate-100 text-slate-600"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {caja.estaCerrada ? "Cerrada" : "Abierta"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales consolidados por medio de pago */}
            <div className="mt-4 pt-4 border-t border-amber-200/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-3">
                Totales consolidados del día
              </p>
              <div className="grid gap-2 sm:grid-cols-5">
                <div className="rounded-lg bg-white/60 p-2 text-center">
                  <p className="text-xs text-slate-500">Efectivo</p>
                  <p className="text-sm font-semibold text-slate-800">
                    ${formatMoney(resumenDia.totales.efectivo)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/60 p-2 text-center">
                  <p className="text-xs text-slate-500">Transferencia</p>
                  <p className="text-sm font-semibold text-slate-800">
                    ${formatMoney(resumenDia.totales.transferencia)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/60 p-2 text-center">
                  <p className="text-xs text-slate-500">Tarjeta</p>
                  <p className="text-sm font-semibold text-slate-800">
                    ${formatMoney(resumenDia.totales.tarjeta)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/60 p-2 text-center">
                  <p className="text-xs text-slate-500">Cheque</p>
                  <p className="text-sm font-semibold text-slate-800">
                    ${formatMoney(resumenDia.totales.cheque)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/60 p-2 text-center">
                  <p className="text-xs text-slate-500">Cta. Cte.</p>
                  <p className="text-sm font-semibold text-slate-800">
                    ${formatMoney(resumenDia.totales.cuentaCorriente)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="relative mt-10 grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <section className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 p-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Movimientos
                </h2>
                <p className="text-xs text-slate-500">
                  Registro de ingresos y egresos recientes
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileText className="h-4 w-4" />
                {movimientos.length} movimientos
              </div>
            </div>

            {movimientos.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
                <FileText className="h-10 w-10" />
                <p className="text-sm">No hay movimientos cargados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Descripcion
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((movimiento) => {
                      const esEntrada =
                        movimiento.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA;
                      return (
                        <tr
                          key={movimiento.Id}
                          className="border-t border-slate-100 transition hover:bg-slate-50/70"
                        >
                          <td className="px-4 py-3 text-slate-600">
                            {formatearFecha(movimiento.Fecha)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">
                              {movimiento.Descripcion}
                            </p>
                            {movimiento.Comprobante && (
                              <p className="text-xs text-slate-400">
                                Comprobante #{movimiento.Comprobante.Numero}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                esEntrada
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {esEntrada ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="size-3"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="size-3"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M14.78 5.22a.75.75 0 00-1.06 0L6.5 12.44V6.75a.75.75 0 00-1.5 0v7.5c0 .414.336.75.75.75h7.5a.75.75 0 000-1.5H7.56l7.22-7.22a.75.75 0 000-1.06z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              {esEntrada ? "Entrada" : "Salida"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            <span
                              className={`${
                                esEntrada ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {esEntrada ? "+" : "-"}$
                              {formatMoney(movimiento.Monto)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <section className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-200/70 p-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Gastos</h3>
                <p className="text-xs text-slate-500">
                  Control de egresos diarios
                </p>
              </div>
              {cajaAbierta && (
                <button
                  onClick={() => setOpenModalGasto(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-300 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-400"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              )}
            </div>
            <div className="space-y-3 p-4">
              {gastos.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-6 text-slate-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.798 7.45c.512-.67 1.135-.95 1.702-.95s1.19.28 1.702.95a.75.75 0 001.192-.91C12.637 5.55 11.596 5 10.5 5s-2.137.55-2.894 1.54a.75.75 0 00.192 1.91zM6.75 12a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      No hay gastos registrados
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Registra los gastos diarios de la caja
                    </p>
                  </div>
                  {cajaAbierta && (
                    <button
                      onClick={() => setOpenModalGasto(true)}
                      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-300 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-400"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar gasto
                    </button>
                  )}
                </div>
              ) : (
                gastos.map((gasto) => (
                  <div
                    key={gasto.Id}
                    className="rounded-xl border border-rose-100 bg-rose-50/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {gasto.Descripcion}
                        </p>
                        {gasto.ConceptoGastos && (
                          <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            {gasto.ConceptoGastos.Descripcion}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-rose-600">
                        -${formatMoney(gasto.Monto)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-rose-500">
                      {formatearFecha(gasto.Fecha)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          {cajaActual && (
            <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <TrendingUp className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Ganancia
                </h3>
              </div>
              {cajaActual.FechaCierre ? (
                <>
                  <p className="mt-4 text-3xl font-bold text-slate-900">
                    ${formatMoney(cajaActual.Ganancia)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ganancia del día
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  La ganancia se calcula al cerrar la caja
                </p>
              )}
            </section>
          )}

          {cajaActual?.DetalleCaja && cajaActual.DetalleCaja.length > 0 && (
            <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Detalle por tipo de pago
              </h3>
              <div className="mt-4 space-y-2">
                {cajaActual.DetalleCaja.map((detalle) => (
                  <div
                    key={detalle.Id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-500">
                      {nombreTipoPago(detalle.TipoPago)}
                    </span>
                    <span className="font-semibold text-slate-700">
                      ${formatMoney(Number(detalle.Monto))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
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
              onClick={abrirCaja}
              disabled={isSaving}
              className="rounded-lg bg-[#67afc3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5a9fb2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Abriendo..." : "Abrir Caja"}
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

      <ModalShell
        open={openModalCerrarCaja}
        title="Cerrar Caja"
        onClose={() => setOpenModalCerrarCaja(false)}
        footer={
          <>
            <button
              onClick={() => setOpenModalCerrarCaja(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={cerrarCaja}
              disabled={isSaving}
              className="rounded-lg bg-red-300 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Cerrando..." : "Cerrar Caja"}
            </button>
          </>
        }
      >
        {totales && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Total esperado en caja</p>
              <p className="text-2xl font-semibold text-slate-800">
                ${formatMoney(totales.totalCaja)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Monto real en caja
              </label>
              <input
                type="number"
                value={montoCierre}
                onChange={(e) => setMontoCierre(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                aria-label="Monto real en caja al cerrar"
              />
            </div>
            {totales.totalCaja !== Number(montoCierre) && montoCierre && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Diferencia: $
                {formatMoney(Math.abs(totales.totalCaja - Number(montoCierre)))}
              </div>
            )}
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={openModalGasto}
        title="Agregar Gasto"
        onClose={() => setOpenModalGasto(false)}
        footer={
          <>
            <button
              onClick={() => setOpenModalGasto(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={agregarGasto}
              disabled={isSaving}
              className="rounded-lg bg-red-300 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : "Agregar Gasto"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Concepto
            </label>
            <select
              value={nuevoGasto.conceptoId}
              onChange={(e) =>
                setNuevoGasto({ ...nuevoGasto, conceptoId: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#67afc3] focus:outline-none focus:ring-2 focus:ring-[#67afc3]/20"
            >
              <option value="">Seleccionar</option>
              {conceptosGasto.map((concepto) => (
                <option
                  key={concepto.Id.toString()}
                  value={concepto.Id.toString()}
                >
                  {concepto.Descripcion}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Descripcion
            </label>
            <input
              value={nuevoGasto.descripcion}
              onChange={(e) =>
                setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })
              }
              placeholder="Descripcion del gasto"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#67afc3] focus:outline-none focus:ring-2 focus:ring-[#67afc3]/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Monto
            </label>
            <input
              type="number"
              value={nuevoGasto.monto}
              onChange={(e) =>
                setNuevoGasto({ ...nuevoGasto, monto: e.target.value })
              }
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#67afc3] focus:outline-none focus:ring-2 focus:ring-[#67afc3]/20"
            />
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={openModalDetalle}
        title="Detalle Completo de Caja"
        onClose={() => setOpenModalDetalle(false)}
        size="xl"
        footer={
          <button
            onClick={() => setOpenModalDetalle(false)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        }
      >
        {cajaActual && totales && (
          <div className="space-y-6 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-400">Fecha apertura</p>
                <p className="font-semibold text-slate-700">
                  {formatearFecha(cajaActual.FechaApertura)}
                </p>
              </div>
              {cajaActual.FechaCierre && (
                <div>
                  <p className="text-xs text-slate-400">Fecha cierre</p>
                  <p className="font-semibold text-slate-700">
                    {formatearFecha(cajaActual.FechaCierre)}
                  </p>
                </div>
              )}
            </div>
            {cajaActual.UsuarioApertura && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Usuario apertura</p>
                  <p className="font-semibold text-slate-700">
                    {cajaActual.UsuarioApertura.NombreCompleto ||
                      cajaActual.UsuarioApertura.Nombre}
                  </p>
                </div>
                {cajaActual.UsuarioCierre && (
                  <div>
                    <p className="text-xs text-slate-400">Usuario cierre</p>
                    <p className="font-semibold text-slate-700">
                      {cajaActual.UsuarioCierre.NombreCompleto ||
                        cajaActual.UsuarioCierre.Nombre}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="h-px bg-slate-200/70" />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">
                Resumen por tipo de pago
              </h4>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Efectivo</span>
                  <span className="font-semibold">
                    ${formatMoney(totales.efectivo)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tarjeta</span>
                  <span className="font-semibold">
                    ${formatMoney(totales.tarjeta)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cheque</span>
                  <span className="font-semibold">
                    ${formatMoney(totales.cheque)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cuenta corriente</span>
                  <span className="font-semibold">
                    ${formatMoney(totales.cuentaCorriente)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Transferencia</span>
                  <span className="font-semibold">
                    ${formatMoney(totales.transferencia)}
                  </span>
                </div>
              </div>
            </div>
            {cajaActual.DetalleCaja && cajaActual.DetalleCaja.length > 0 && (
              <>
                <div className="h-px bg-slate-200/70" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">
                    Detalle por tipo de pago
                  </h4>
                  <div className="mt-2 space-y-2">
                    {cajaActual.DetalleCaja.map((detalle) => (
                      <div
                        key={detalle.Id}
                        className="flex justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <span>{nombreTipoPago(detalle.TipoPago)}</span>
                        <span className="font-semibold">
                          ${formatMoney(Number(detalle.Monto))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </ModalShell>
    </div>
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
