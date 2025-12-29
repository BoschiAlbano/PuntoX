"use client";

import { useEffect, useState } from "react";
import { usePagePermission } from "@/lib/permissions/usePagePermission";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import {
  DollarSign,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  Plus,
  Lock,
  Unlock,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Banknote,
  Building2,
  ArrowLeftRight,
  Eye,
  RefreshCw,
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

export default function CajaPage() {
  // Verificar permisos de acceso a esta página
  const { tieneAcceso, isLoading: isLoadingPermisos } = usePagePermission();
  
  const [cajaActual, setCajaActual] = useState<Caja | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [conceptosGasto, setConceptosGasto] = useState<ConceptoGasto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const cargarDatos = async () => {
    // No hacer peticiones si no tiene acceso
    if (!tieneAcceso) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Cargar caja actual y conceptos de gastos en paralelo
      const [cajaRes, conceptosRes] = await Promise.all([
        fetch("/api/caja?soloAbierta=true", { cache: "no-store" }),
        fetch("/api/conceptos-gastos", { cache: "no-store" }),
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
        const errorMessage = typeof errorData?.error === "string" 
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
          const errorMessage = typeof errorData?.error === "string" 
            ? errorData.error 
            : errorData?.error?.message || "No se pudieron cargar los conceptos de gastos";
          addToast({
            title: "Error",
            description: errorMessage,
            color: "warning",
          });
        }
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

  // Calcular totales
  const totales = cajaActual
    ? {
        efectivo:
          cajaActual.MontoInicial +
          cajaActual.TotalEntradaEfectivo -
          cajaActual.TotalSalidaEfectivo,
        tarjeta:
          cajaActual.TotalEntradaTarjeta - cajaActual.TotalSalidaTarjeta,
        cheque:
          cajaActual.TotalEntradaCheque - cajaActual.TotalSalidaCheque,
        cuentaCorriente:
          cajaActual.TotalEntradaCtaCte - cajaActual.TotalSalidaCtaCte,
        transferencia:
          cajaActual.TotalEntradaTransf - cajaActual.TotalSalidaTransf,
        totalEntradas:
          cajaActual.TotalEntradaEfectivo +
          cajaActual.TotalEntradaTarjeta +
          cajaActual.TotalEntradaCheque +
          cajaActual.TotalEntradaCtaCte +
          cajaActual.TotalEntradaTransf,
        totalSalidas:
          cajaActual.TotalSalidaEfectivo +
          cajaActual.TotalSalidaTarjeta +
          cajaActual.TotalSalidaCheque +
          cajaActual.TotalSalidaCtaCte +
          cajaActual.TotalSalidaTransf,
        totalCaja:
          cajaActual.MontoInicial +
          cajaActual.TotalEntradaEfectivo -
          cajaActual.TotalSalidaEfectivo +
          cajaActual.TotalEntradaTarjeta -
          cajaActual.TotalSalidaTarjeta +
          cajaActual.TotalEntradaCheque -
          cajaActual.TotalSalidaCheque +
          cajaActual.TotalEntradaCtaCte -
          cajaActual.TotalSalidaCtaCte +
          cajaActual.TotalEntradaTransf -
          cajaActual.TotalSalidaTransf,
      }
    : null;

  const cajaAbierta = cajaActual && !cajaActual.FechaCierre;

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
        description: error instanceof Error ? error.message : "No se pudo abrir la caja",
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
        description: error instanceof Error ? error.message : "No se pudo cerrar la caja",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Agregar gasto
  const agregarGasto = async () => {
    if (!nuevoGasto.conceptoId || !nuevoGasto.descripcion || !nuevoGasto.monto) {
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
        description: `Gasto de $${Number(nuevoGasto.monto).toFixed(2)} registrado`,
        color: "success",
      });

      setOpenModalGasto(false);
      setNuevoGasto({ conceptoId: "", descripcion: "", monto: "" });
      await cargarDatos();
    } catch (error) {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar el gasto",
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

  // Obtener nombre del tipo de pago (función no usada actualmente, pero puede ser útil en el futuro)
  // const nombreTipoPago = (tipo: number) => {
  //   switch (tipo) {
  //     case TIPO_PAGO.EFECTIVO:
  //       return "Efectivo";
  //     case TIPO_PAGO.TARJETA:
  //       return "Tarjeta";
  //     case TIPO_PAGO.CHEQUE:
  //       return "Cheque";
  //     case TIPO_PAGO.CUENTA_CORRIENTE:
  //       return "Cuenta Corriente";
  //     case TIPO_PAGO.TRANSFERENCIA:
  //       return "Transferencia";
  //     default:
  //       return "Desconocido";
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch justify-center">
      {/* Header con gradiente al estilo del proyecto */}
      <section className="w-full relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-500 to-[#90c472] text-white shadow-xl mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="relative p-4 md:p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Chip variant="flat" className="bg-white/10 text-white">
                Caja
              </Chip>
              <h1 className="text-3xl md:text-[32px] font-bold">
                Gestión de Caja
              </h1>
              <p className="text-white max-w-3xl">
                Administra la caja, movimientos financieros y gastos del día
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="flat"
                className="bg-white/10 text-white hover:bg-white/20"
                onPress={() => cargarDatos()}
                startContent={<RefreshCw className="w-4 h-4" />}
              >
                Actualizar
              </Button>
              {cajaAbierta && (
                <Button
                  color="danger"
                  onPress={() => setOpenModalCerrarCaja(true)}
                  startContent={<Lock className="w-4 h-4" />}
                >
                  Cerrar Caja
                </Button>
              )}
              {!cajaAbierta && (
                <Button
                  color="success"
                  className="bg-white text-green-600 hover:bg-white/90"
                  onPress={() => setOpenModalAbrirCaja(true)}
                  startContent={<Unlock className="w-4 h-4" />}
                >
                  Abrir Caja
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Estado de caja */}
      <Card className="mb-6 shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {cajaAbierta ? (
                <Unlock className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
                </h2>
                {cajaActual && (
                  <p className="text-sm opacity-90">
                    {cajaAbierta
                      ? `Abierta el ${formatearFecha(cajaActual.FechaApertura)}`
                      : `Cerrada el ${formatearFecha(cajaActual.FechaCierre!)}`}
                  </p>
                )}
              </div>
            </div>
            <Chip
              color={cajaAbierta ? "success" : "default"}
              variant="flat"
              size="lg"
            >
              {cajaAbierta ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Abierta
                </div>
              ) : (
                "Cerrada"
              )}
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          {cajaActual && totales && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">
                    Total en Caja
                  </span>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-700">
                  ${totales.totalCaja.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Inicial: ${cajaActual.MontoInicial.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">
                    Total Entradas
                  </span>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  ${totales.totalEntradas.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {movimientos.filter(
                    (m) => m.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA
                  ).length}{" "}
                  movimientos
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-700">
                    Total Salidas
                  </span>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-700">
                  ${totales.totalSalidas.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {gastos.length} gastos registrados
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Totales por tipo de pago */}
        <div className="lg:col-span-2 space-y-6">
          {/* Totales por tipo de pago */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Totales por Tipo de Pago
              </h2>
            </CardHeader>
            <CardBody>
              {totales && (
                <div className="space-y-4">
                  {/* Efectivo */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Banknote className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Efectivo</p>
                        <p className="text-xs text-gray-500">
                          Entradas: ${totales.efectivo.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-700">
                        ${totales.efectivo.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Tarjeta */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Tarjeta</p>
                        <p className="text-xs text-gray-500">
                          Entradas: ${totales.tarjeta.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-700">
                        ${totales.tarjeta.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Cheque */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Cheque</p>
                        <p className="text-xs text-gray-500">
                          Entradas: ${totales.cheque.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-700">
                        ${totales.cheque.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Cuenta Corriente */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-white border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Cuenta Corriente</p>
                        <p className="text-xs text-gray-500">
                          Entradas: ${totales.cuentaCorriente.toLocaleString(
                            "es-AR",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-700">
                        ${totales.cuentaCorriente.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Transferencia */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-white border border-cyan-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <ArrowLeftRight className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Transferencia</p>
                        <p className="text-xs text-gray-500">
                          Entradas: ${totales.transferencia.toLocaleString(
                            "es-AR",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-700">
                        ${totales.transferencia.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Movimientos recientes */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                Movimientos Recientes
              </h2>
              <Button
                size="sm"
                variant="flat"
                onPress={() => setOpenModalDetalle(true)}
              >
                <Eye className="w-4 h-4" />
                Ver Detalle
              </Button>
            </CardHeader>
            <CardBody>
              {movimientos.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowLeftRight className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">
                    No hay movimientos registrados
                  </p>
                </div>
              ) : (
                <Table aria-label="Movimientos">
                  <TableHeader>
                    <TableColumn>FECHA</TableColumn>
                    <TableColumn>DESCRIPCIÓN</TableColumn>
                    <TableColumn>TIPO</TableColumn>
                    <TableColumn>MONTO</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((movimiento) => (
                      <TableRow key={movimiento.Id}>
                        <TableCell>
                          {formatearFecha(movimiento.Fecha)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{movimiento.Descripcion}</p>
                            {movimiento.Comprobante && (
                              <p className="text-xs text-gray-500">
                                Comprobante #{movimiento.Comprobante.Numero}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={
                              movimiento.TipoMovimiento ===
                              TIPO_MOVIMIENTO.ENTRADA
                                ? "success"
                                : "danger"
                            }
                            variant="flat"
                            size="sm"
                          >
                            {movimiento.TipoMovimiento ===
                            TIPO_MOVIMIENTO.ENTRADA ? (
                              <div className="flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                Entrada
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <ArrowDownLeft className="w-3 h-3" />
                                Salida
                              </div>
                            )}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold ${
                              movimiento.TipoMovimiento ===
                              TIPO_MOVIMIENTO.ENTRADA
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {movimiento.TipoMovimiento ===
                            TIPO_MOVIMIENTO.ENTRADA
                              ? "+"
                              : "-"}
                            ${movimiento.Monto.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Columna derecha: Gastos y acciones rápidas */}
        <div className="space-y-6">
          {/* Gastos */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Gastos
              </h2>
              {cajaAbierta && (
                <Button
                  size="sm"
                  color="danger"
                  onPress={() => setOpenModalGasto(true)}
                  startContent={<Plus className="w-4 h-4" />}
                >
                  Agregar
                </Button>
              )}
            </CardHeader>
            <CardBody>
              {gastos.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingDown className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No hay gastos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gastos.map((gasto) => (
                    <div
                      key={gasto.Id}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-medium text-sm">{gasto.Descripcion}</p>
                          {gasto.ConceptoGastos && (
                            <Chip size="sm" variant="flat" color="danger" className="mt-1">
                              {gasto.ConceptoGastos.Descripcion}
                            </Chip>
                          )}
                        </div>
                        <span className="font-bold text-red-600">
                          -${gasto.Monto.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatearFecha(gasto.Fecha)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Resumen de ganancia */}
          {cajaActual && (
            <Card className="shadow-md border-2 border-success-200">
              <CardHeader className="bg-gradient-to-r from-success-500 to-success-600 text-white">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Ganancia
                </h2>
              </CardHeader>
              <CardBody>
                <div className="text-center">
                  <p className="text-4xl font-bold text-success-700 mb-2">
                    ${cajaActual.Ganancia.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Ganancia del día
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Abrir Caja */}
      <Modal
        isOpen={openModalAbrirCaja}
        onClose={() => setOpenModalAbrirCaja(false)}
      >
        <ModalContent>
          <ModalHeader>Abrir Caja</ModalHeader>
          <ModalBody>
            <Input
              type="number"
              label="Monto Inicial"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
              startContent="$"
              placeholder="0.00"
            />
            <p className="text-sm text-gray-500">
              Ingrese el monto inicial con el que se abrirá la caja
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setOpenModalAbrirCaja(false)}
            >
              Cancelar
            </Button>
            <Button color="success" onPress={abrirCaja} isLoading={isSaving}>
              Abrir Caja
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Cerrar Caja */}
      <Modal
        isOpen={openModalCerrarCaja}
        onClose={() => setOpenModalCerrarCaja(false)}
      >
        <ModalContent>
          <ModalHeader>Cerrar Caja</ModalHeader>
          <ModalBody>
            {totales && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">
                    Total esperado en caja:
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    ${totales.totalCaja.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <Input
                  type="number"
                  label="Monto Real en Caja"
                  value={montoCierre}
                  onChange={(e) => setMontoCierre(e.target.value)}
                  startContent="$"
                  placeholder="0.00"
                />
                {totales.totalCaja !== Number(montoCierre) && montoCierre && (
                  <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-sm text-warning-700">
                      Diferencia: $
                      {Math.abs(
                        totales.totalCaja - Number(montoCierre)
                      ).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setOpenModalCerrarCaja(false)}
            >
              Cancelar
            </Button>
            <Button color="danger" onPress={cerrarCaja} isLoading={isSaving}>
              Cerrar Caja
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Agregar Gasto */}
      <Modal
        isOpen={openModalGasto}
        onClose={() => setOpenModalGasto(false)}
      >
        <ModalContent>
          <ModalHeader>Agregar Gasto</ModalHeader>
          <ModalBody className="space-y-4">
            <Select
              label="Concepto"
              selectedKeys={
                nuevoGasto.conceptoId ? [nuevoGasto.conceptoId] : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setNuevoGasto({ ...nuevoGasto, conceptoId: selected });
              }}
            >
              {conceptosGasto.map((concepto) => (
                <SelectItem key={concepto.Id.toString()}>
                  {concepto.Descripcion}
                </SelectItem>
              ))}
            </Select>
            <Input
              label="Descripción"
              value={nuevoGasto.descripcion}
              onChange={(e) =>
                setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })
              }
              placeholder="Descripción del gasto"
            />
            <Input
              type="number"
              label="Monto"
              value={nuevoGasto.monto}
              onChange={(e) =>
                setNuevoGasto({ ...nuevoGasto, monto: e.target.value })
              }
              startContent="$"
              placeholder="0.00"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setOpenModalGasto(false)}
            >
              Cancelar
            </Button>
            <Button color="danger" onPress={agregarGasto} isLoading={isSaving}>
              Agregar Gasto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Detalle Completo */}
      <Modal
        isOpen={openModalDetalle}
        onClose={() => setOpenModalDetalle(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Detalle Completo de Caja</ModalHeader>
          <ModalBody>
            {cajaActual && totales && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Fecha Apertura</p>
                    <p className="font-semibold">
                      {formatearFecha(cajaActual.FechaApertura)}
                    </p>
                  </div>
                  {cajaActual.FechaCierre && (
                    <div>
                      <p className="text-sm text-gray-500">Fecha Cierre</p>
                      <p className="font-semibold">
                        {formatearFecha(cajaActual.FechaCierre)}
                      </p>
                    </div>
                  )}
                </div>
                <Divider />
                <div>
                  <h3 className="font-semibold mb-3">Resumen por Tipo de Pago</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Efectivo:</span>
                      <span className="font-semibold">
                        ${totales.efectivo.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tarjeta:</span>
                      <span className="font-semibold">
                        ${totales.tarjeta.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cheque:</span>
                      <span className="font-semibold">
                        ${totales.cheque.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cuenta Corriente:</span>
                      <span className="font-semibold">
                        ${totales.cuentaCorriente.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transferencia:</span>
                      <span className="font-semibold">
                        ${totales.transferencia.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setOpenModalDetalle(false)}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

