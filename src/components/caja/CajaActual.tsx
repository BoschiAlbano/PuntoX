import { useCaja } from "@/hooks/useCaja";
import { ModalAbrirCaja } from "@/components/caja/ModalAbrirCaja";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  addToast,
  Checkbox,
  Tooltip,
} from "@heroui/react";
import {
  Eye,
  FileText,
  Lock,
  TrendingDown,
  TrendingUp,
  Unlock,
  DollarSign,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Wallet,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileCheck,
  FileX,
  Clock,
  Calendar,
} from "lucide-react";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { LoadingComponent } from "../loading/loading";
import { handleNumberInput } from "@/lib/input/number";
import {
  TIPO_MOVIMIENTO,
  TIPO_COMPROBANTE_VENTA,
  TIPO_COMPROBANTE_VENTA_LABELS,
} from "@/lib/constants/comprobantes";
import { parseArcaObservations } from "@/lib/constants/arca-errors";
import { ReporteCajaImprimible } from "./ReporteCajaImprimible";
import { useReactToPrint } from "react-to-print";
import { useRouter } from "next/navigation";
import StatCard from "../dashboard/StatCard";
import GenericTable, { Column } from "@/components/shared/GenericTable";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { modalMotionProps } from "@/lib/motionConfig";

const movimientosColumns: Column[] = [
  { uid: "fecha", name: "Fecha", sortable: false },
  { uid: "descripcion", name: "Descripción", sortable: false },
  { uid: "facturaElectronica", name: "FE", sortable: false, align: "center" },
  { uid: "tipo", name: "Tipo", sortable: false, align: "center" },
  {
    uid: "monto",
    name: "Monto",
    sortable: false,
    align: "end",
    printAlign: "right",
  },
  { uid: "acciones", name: "Acciones", sortable: false, align: "center" },
];

export default function CajaActual({
  isCerrarOpen: propIsCerrarOpen,
  onCerrarChange: propOnCerrarChange,
  isAbrirOpen: propIsAbrirOpen,
  onAbrirChange: propOnAbrirChange,
  onCajaStatusChange,
}: {
  isCerrarOpen?: boolean;
  onCerrarChange?: () => void;
  isAbrirOpen?: boolean;
  onAbrirChange?: () => void;
  onCajaStatusChange?: (isAbierta: boolean) => void;
}) {
  const {
    cajaActual,
    isLoading,
    isFetching,
    isOpening,
    isClosing,
    abrirCaja,
    cerrarCaja,
    refetch,
    isCajaAbierta,
    fetchDetalleComprobante, // We need to add this to hook
  } = useCaja({
    enableCaja: true,
    enableResumen: true,
  });

  const { configuracion, fiscal } = useConfiguracion({
    enableConfiguracion: true,
    enableFiscal: true,
  });

  const { isOpen: _isAbrirOpen, onOpenChange: _onAbrirChange } =
    useDisclosure();
  const isAbrirOpen = propIsAbrirOpen ?? _isAbrirOpen;
  const onAbrirChange = propOnAbrirChange ?? _onAbrirChange;

  // Notificar al padre cuando cambia el estado de la caja
  useEffect(() => {
    onCajaStatusChange?.(!!isCajaAbierta);
  }, [isCajaAbierta, onCajaStatusChange]);

  // Cerrar caja — controlado desde el padre si se pasan props
  const { isOpen: _isCerrarOpen, onOpenChange: _onCerrarChange } =
    useDisclosure();
  const isCerrarOpen = propIsCerrarOpen ?? _isCerrarOpen;
  const onCerrarChange = propOnCerrarChange ?? _onCerrarChange;
  const [montoCierre, setMontoCierre] = useState("");

  // Detalle Comprobante via navigation
  const router = useRouter();

  const reporteCajaRef = React.useRef<HTMLDivElement>(null);
  const handlePrintReporteCaja = useReactToPrint({
    contentRef: reporteCajaRef,
    documentTitle: "Reporte de Caja",
  });

  const movimientos = cajaActual?.Movimiento || [];

  // Movimientos: búsqueda y paginación local
  const [movSearch, setMovSearch] = useState("");
  const [movPage, setMovPage] = useState(1);
  const [filtroPendientes, setFiltroPendientes] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isReprocesando, setIsReprocesando] = useState(false);
  const {
    isOpen: isFechaBulkOpen,
    onOpen: onFechaBulkOpen,
    onOpenChange: onFechaBulkOpenChange,
  } = useDisclosure();
  const [fechaBulk, setFechaBulk] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const MOV_LIMIT = 10;

  const filteredMovimientos = useMemo(() => {
    let result = movimientos;

    if (filtroPendientes) {
      result = result.filter((m: any) => {
        if (!m.ComprobanteId || !m.Comprobante) return false;
        const tiposAfip = [
          TIPO_COMPROBANTE_VENTA.FACTURA_A,
          TIPO_COMPROBANTE_VENTA.FACTURA_B,
          TIPO_COMPROBANTE_VENTA.FACTURA_C,
        ];
        if (!tiposAfip.includes(m.Comprobante.TipoComprobante)) return false;

        // Pendiente si no tiene FacturaElectronica o si no está AUTORIZADO
        if (!m.Comprobante.FacturaElectronica) return true;
        return m.Comprobante.FacturaElectronica.Estado !== "AUTORIZADO";
      });
    }

    if (!movSearch.trim()) return result;
    const q = movSearch.toLowerCase();
    return result.filter(
      (m: any) =>
        m.Descripcion?.toLowerCase().includes(q) ||
        m.Comprobante?.Numero?.toString().includes(q),
    );
  }, [movimientos, movSearch, filtroPendientes]);

  const paginatedMovimientos = useMemo(() => {
    const start = (movPage - 1) * MOV_LIMIT;
    return filteredMovimientos.slice(start, start + MOV_LIMIT);
  }, [filteredMovimientos, movPage]);

  const movPaginationMeta = useMemo(
    () => ({
      total: filteredMovimientos.length,
      page: movPage,
      limit: MOV_LIMIT,
      totalPages: Math.max(
        1,
        Math.ceil(filteredMovimientos.length / MOV_LIMIT),
      ),
    }),
    [filteredMovimientos.length, movPage],
  );

  // Cálculos para el cierre de caja
  const totalEntradasDia = useMemo(() => {
    if (!cajaActual) return 0;
    return (
      Number(cajaActual.TotalEntradaEfectivo || 0) +
      Number(cajaActual.TotalEntradaTarjeta || 0) +
      Number(cajaActual.TotalEntradaTransf || 0) +
      Number(cajaActual.TotalEntradaCheque || 0) +
      Number(cajaActual.TotalEntradaCtaCte || 0)
    );
  }, [cajaActual]);

  const totalSalidasDia = useMemo(() => {
    if (!cajaActual) return 0;
    return (
      Number(cajaActual.TotalSalidaEfectivo || 0) +
      Number(cajaActual.TotalSalidaTarjeta || 0) +
      Number(cajaActual.TotalSalidaTransf || 0) +
      Number(cajaActual.TotalSalidaCheque || 0) +
      Number(cajaActual.TotalSalidaCtaCte || 0)
    );
  }, [cajaActual]);

  // Ganancia neta del día = total entradas - total salidas
  const gananciaDelDia = useMemo(
    () => totalEntradasDia - totalSalidasDia,
    [totalEntradasDia, totalSalidasDia],
  );

  // Efectivo esperado en el cajón = apertura + entradas efectivo - salidas efectivo
  const efectivoEsperado = useMemo(() => {
    if (!cajaActual) return 0;
    return (
      Number(cajaActual.MontoInicial || 0) +
      Number(cajaActual.TotalEntradaEfectivo || 0) -
      Number(cajaActual.TotalSalidaEfectivo || 0)
    );
  }, [cajaActual]);

  const handleViewTicket = (comprobanteId: number) => {
    router.push(`/comprobantes/${comprobanteId}`);
  };

  // Validar si una fecha está dentro del rango permitido por ARCA (N±5 días)
  const isDateInArcaRange = (dateToCheck: string): boolean => {
    try {
      const datePart = dateToCheck.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      const targetDate = new Date(Date.UTC(year, month - 1, day));

      const today = new Date();
      const todayUTC = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
        ),
      );

      const diffTime = Math.abs(targetDate.getTime() - todayUTC.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays <= 5;
    } catch {
      return false;
    }
  };

  // Calcular rango de fechas válidas
  const getArcaDateRange = (): { min: string; max: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - 5);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 5);

    return {
      min: minDate.toISOString().split("T")[0],
      max: maxDate.toISOString().split("T")[0],
    };
  };

  // Contar comprobantes que estarían fuera de rango con la fecha elegida
  const countComprobantesFueraDeRango = (fechaPropuesta: string): number => {
    if (!isDateInArcaRange(fechaPropuesta)) return selectedKeys.size;

    return Array.from(selectedKeys)
      .map((key) => {
        const mov = movimientos.find((m) => String(m.Id) === key);
        return mov?.Comprobante?.Fecha;
      })
      .filter((fecha) => fecha && !isDateInArcaRange(fecha)).length;
  };

  const handleBulkEmitirArca = () => {
    if (selectedKeys.size === 0) return;
    onFechaBulkOpen();
  };

  const handleConfirmBulkEmitirArca = async () => {
    if (selectedKeys.size === 0) return;

    // Validar que la fecha está dentro del rango de ARCA
    if (!isDateInArcaRange(fechaBulk)) {
      const range = getArcaDateRange();
      addToast({
        title: "Fecha fuera de rango permitido",
        description: `ARCA solo permite facturas entre ${range.min} y ${range.max}. La fecha ${fechaBulk} está fuera de rango.`,
        color: "warning",
      });
      return;
    }

    // Convertir selectedKeys a ComprobanteIds
    const comprobantesIds = Array.from(selectedKeys)
      .map((key) => {
        const mov = movimientos.find((m) => String(m.Id) === key);
        return mov?.ComprobanteId;
      })
      .filter(Boolean);

    if (comprobantesIds.length === 0) return;

    setIsReprocesando(true);

    try {
      const response = await fetch(
        "/api/facturacion/electronica/bulk-reprocesar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comprobantesIds, fecha: fechaBulk }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar en lote");
      }

      addToast({
        title: "Proceso completado",
        description: `Se emitieron ${data.resumen.exitosos} de ${data.resumen.total}. Fallidos: ${data.resumen.fallidos}`,
        color: data.resumen.fallidos > 0 ? "warning" : "success",
      });

      setSelectedKeys(new Set());
      refetch();
    } catch (err: any) {
      addToast({ title: "Error", description: err.message, color: "danger" });
    } finally {
      setIsReprocesando(false);
      onFechaBulkOpenChange();
    }
  };

  const renderMovCell = useCallback(
    (mov: any, columnKey: React.Key) => {
      switch (columnKey) {
        case "fecha":
          return formatDate(mov.Fecha);
        case "descripcion":
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{mov.Descripcion}</span>
              {mov.Comprobante && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {TIPO_COMPROBANTE_VENTA_LABELS[
                      mov.Comprobante.TipoComprobante
                    ] || "Comprobante"}
                  </span>
                  <span className="text-xs text-gray-400">
                    #{mov.Comprobante.Numero?.toString().padStart(8, "0")}
                  </span>
                </div>
              )}
            </div>
          );
        case "facturaElectronica":
          if (!mov.Comprobante) return <span className="text-gray-300">-</span>;

          const tiposAfip = [
            TIPO_COMPROBANTE_VENTA.FACTURA_A,
            TIPO_COMPROBANTE_VENTA.FACTURA_B,
            TIPO_COMPROBANTE_VENTA.FACTURA_C,
          ];
          const esTipoAfip = tiposAfip.includes(
            mov.Comprobante.TipoComprobante,
          );

          if (!esTipoAfip) {
            return (
              <span className="text-[10px] text-gray-400 font-medium">
                No aplica
              </span>
            );
          }

          const estado = mov.Comprobante.FacturaElectronica?.Estado;
          const fechaComprobanteEstaFueraDeRango =
            mov.Comprobante.Fecha && !isDateInArcaRange(mov.Comprobante.Fecha);

          if (estado === "AUTORIZADO") {
            return (
              <div
                className="flex items-center justify-center gap-1"
                title="Factura electrónica autorizada por ARCA"
              >
                <FileCheck size={14} className="text-green-500" />
                <span className="text-[10px] font-bold text-green-600">OK</span>
              </div>
            );
          }

          if (estado === "RECHAZADO") {
            const obs = mov.Comprobante.FacturaElectronica?.Observaciones;
            const errorFiltrado = obs
              ? parseArcaObservations(obs)
              : "Sin detalle de error";
            return (
              <Tooltip
                content={
                  <div className="max-w-xs p-2">
                    <p className="font-bold text-red-400 text-xs mb-1">
                      Error ARCA:
                    </p>
                    <p className="text-xs text-white leading-relaxed">
                      {errorFiltrado}
                    </p>
                  </div>
                }
                placement="top"
                classNames={{
                  content: "bg-slate-800 text-white border border-slate-600",
                }}
              >
                <div className="flex items-center justify-center gap-1 cursor-help">
                  <FileX size={14} className="text-red-500" />
                  <span className="text-[10px] font-bold text-red-600">
                    Error
                  </span>
                </div>
              </Tooltip>
            );
          }

          if (estado === "PENDIENTE") {
            return (
              <div
                className="flex items-center justify-center gap-1"
                title="Factura electrónica pendiente de envío"
              >
                <Clock size={14} className="text-yellow-500" />
                <span className="text-[10px] font-bold text-yellow-600">
                  Pend.
                </span>
              </div>
            );
          }

          // Sin FE emitida — mostrar alerta si la fecha está fuera de rango
          if (fechaComprobanteEstaFueraDeRango) {
            const range = getArcaDateRange();
            return (
              <Tooltip
                content={
                  <div className="max-w-xs p-2">
                    <p className="font-bold text-orange-400 text-xs mb-1">
                      Fecha fuera de rango ARCA
                    </p>
                    <p className="text-xs text-white leading-relaxed">
                      Este comprobante tiene fecha {mov.Comprobante.Fecha}. ARCA
                      solo permite facturas entre {range.min} y {range.max}.
                      Deberás cambiar la fecha del comprobante antes de poder
                      facturarlo electrónicamente.
                    </p>
                  </div>
                }
                placement="top"
                classNames={{
                  content: "bg-slate-800 text-white border border-slate-600",
                }}
              >
                <div className="flex items-center justify-center gap-1 cursor-help">
                  <AlertTriangle size={14} className="text-orange-500" />
                  <span className="text-[10px] font-bold text-orange-600">
                    Fuera rango
                  </span>
                </div>
              </Tooltip>
            );
          }

          return (
            <div
              className="flex items-center justify-center"
              title="Sin factura electrónica emitida"
            >
              <span className="text-[10px] text-gray-400 font-medium">
                No emitida
              </span>
            </div>
          );
        case "tipo":
          return (
            <Chip
              size="sm"
              variant="flat"
              color={
                mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA
                  ? "success"
                  : "danger"
              }
            >
              {mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA
                ? "Entrada"
                : "Salida"}
            </Chip>
          );
        case "monto":
          return (
            <span
              className={`font-semibold ${mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA ? "text-success" : "text-danger"}`}
            >
              {mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA ? "+" : "-"}
              {formatMoney(mov.Monto)}
            </span>
          );
        case "acciones":
          return mov.ComprobanteId ? (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => handleViewTicket(mov.ComprobanteId)}
            >
              <Eye size={18} className="text-gray-500" />
            </Button>
          ) : (
            <span className="text-gray-300">-</span>
          );
        default:
          return null;
      }
    },
    [handleViewTicket],
  );

  const formatMoney = (val: number) =>
    val.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    });

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pb-4">
        {/* Entradas del día — skeleton */}
        <Skeleton className="h-6 w-52 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="rounded-xl h-28" />
          ))}
        </div>

        {/* Salidas del día — skeleton */}
        <Skeleton className="h-6 w-48 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="rounded-xl h-28" />
          ))}
        </div>

        {/* Movimientos — skeleton de tabla */}
        <Skeleton className="h-6 w-40 rounded-lg" />
        <GenericTable
          data={[]}
          columns={movimientosColumns}
          isLoading={true}
          isError={false}
          search=""
          onSearchChange={() => {}}
          page={1}
          onPageChange={() => {}}
          paginationMeta={{ total: 0, page: 1, limit: 10, totalPages: 1 }}
          renderCell={() => null}
        />
      </div>
    );
  }

  const handleCerrarCaja = async () => {
    // Si el usuario no escribe nada, asumimos el valor del placeholder (0)
    const valorFinal = montoCierre.trim() === "" ? "0" : montoCierre;
    const monto = parseFloat(valorFinal.replace(",", "."));

    if (isNaN(monto) || monto < 0) {
      addToast({
        title: "Error",
        description: "Debe ingresar un monto numérico válido mayor o igual a 0",
        color: "danger",
      });
      return;
    }

    try {
      await cerrarCaja(monto);
      onCerrarChange();
      setMontoCierre("");
      addToast({
        title: "Caja cerrada",
        description: "La caja se cerró exitosamente",
        color: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: "No se pudo cerrar la caja",
        color: "danger",
      });
    }
  };

  // Caja Cerrada State
  if (!isCajaAbierta || !cajaActual) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-gray-500 px-4">
        <div className="p-6 rounded-full bg-gray-50 border border-gray-200">
          <Lock className="w-10 h-10 sm:w-16 sm:h-16 text-gray-300" />
        </div>
        <div className="text-center max-w-xs">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
            La caja está cerrada
          </h2>
          <p className="text-sm mt-1">
            Debés abrir la caja para comenzar a registrar operaciones.
          </p>
        </div>
        <Button
          onPress={() => onAbrirChange()}
          className="bg-[#0F2233] text-white font-semibold px-5 h-10 rounded-xl gap-2 hover:bg-[#0F2233]/80 transition-all shadow-sm text-sm"
          startContent={<Unlock size={15} strokeWidth={2.5} />}
        >
          Abrir Caja
        </Button>

        <ModalAbrirCaja open={isAbrirOpen} onClose={onAbrirChange} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Entradas del dia */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <TrendingUp size={18} className="text-green-500" />
          Entradas del día
        </h2>
        <div className="flex gap-2">
          <Button
            onPress={() => handlePrintReporteCaja()}
            variant="flat"
            className="h-9 px-4 rounded-xl text-sm"
            startContent={<Printer size={14} />}
          >
            Reporte
          </Button>
          <Button
            onPress={() => onCerrarChange()}
            className="bg-[#0F2233] text-white font-semibold px-4 h-9 rounded-xl gap-2 hover:bg-[#0F2233]/80 transition-all shadow-sm text-sm"
            startContent={<Lock size={14} strokeWidth={2.5} />}
          >
            Cerrar Caja
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Efectivo"
          value={formatMoney(cajaActual.TotalEntradaEfectivo)}
          icon={Banknote}
          colorScheme="green"
          chartType="bar"
          delay={0.05}
        />

        <StatCard
          title="Tarjeta"
          value={formatMoney(cajaActual.TotalEntradaTarjeta)}
          icon={CreditCard}
          colorScheme="green"
          chartType="bar"
          delay={0.1}
        />

        <StatCard
          title="Transferencia"
          value={formatMoney(cajaActual.TotalEntradaTransf)}
          icon={ArrowRightLeft}
          colorScheme="green"
          chartType="bar"
          delay={0.15}
        />

        <StatCard
          title="Cheque"
          value={formatMoney(cajaActual.TotalEntradaCheque)}
          icon={Wallet}
          colorScheme="green"
          chartType="bar"
          delay={0.2}
        />

        <StatCard
          title="Cta. Corriente"
          value={formatMoney(cajaActual.TotalEntradaCtaCte)}
          icon={Wallet}
          colorScheme="green"
          chartType="bar"
          delay={0.25}
        />
      </div>

      {/* Salidas del dia */}
      <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
        <TrendingDown size={18} className="text-red-500" />
        Salidas del día
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Efectivo"
          value={formatMoney(cajaActual.TotalSalidaEfectivo)}
          icon={Banknote}
          colorScheme="red"
          chartType="line"
          delay={0.05}
        />

        <StatCard
          title="Tarjeta"
          value={formatMoney(cajaActual.TotalSalidaTarjeta)}
          icon={CreditCard}
          colorScheme="red"
          chartType="line"
          delay={0.1}
        />

        <StatCard
          title="Transferencia"
          value={formatMoney(cajaActual.TotalSalidaTransf)}
          icon={ArrowRightLeft}
          colorScheme="red"
          chartType="line"
          delay={0.15}
        />

        <StatCard
          title="Cheque"
          value={formatMoney(cajaActual.TotalSalidaCheque)}
          icon={Wallet}
          colorScheme="red"
          chartType="line"
          delay={0.2}
        />

        <StatCard
          title="Cta. Corriente"
          value={formatMoney(cajaActual.TotalSalidaCtaCte)}
          icon={Wallet}
          colorScheme="red"
          chartType="line"
          delay={0.25}
        />
      </div>

      {/* Movements Table Section */}
      <div className="flex flex-col gap-2">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <TrendingUp size={18} className="text-[#69b0c3]" />
          Movimientos
        </h2>
      </div>
      <GenericTable
        data={paginatedMovimientos}
        columns={movimientosColumns}
        isLoading={false}
        isError={false}
        search={movSearch}
        onSearchChange={(val) => {
          setMovSearch(val);
          setMovPage(1);
        }}
        searchPlaceholder="Buscar movimiento..."
        page={movPage}
        onPageChange={setMovPage}
        paginationMeta={movPaginationMeta}
        isRefreshing={isFetching || isReprocesando}
        onRefresh={refetch}
        renderCell={renderMovCell}
        emptyText="No hay movimientos registrados."
        printConfig={{ title: "Movimientos de Caja" }}
        enableSelection={true}
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => {
          if (keys === "all") {
            setSelectedKeys(
              new Set(filteredMovimientos.map((m) => String(m.Id))),
            );
          } else {
            setSelectedKeys(keys as Set<string>);
          }
        }}
        selectedCount={selectedKeys.size}
        onClearSelection={() => setSelectedKeys(new Set())}
        bulkActionsDropdown={
          fiscal?.afipHabilitado && !isReprocesando
            ? [
                {
                  key: "emitir-arca",
                  label: "Emitir Facturas Electrónicas",
                  onClick: () => handleBulkEmitirArca(),
                },
              ]
            : undefined
        }
        extraSearchContent={
          <Button
            size="sm"
            variant={filtroPendientes ? "solid" : "flat"}
            color={filtroPendientes ? "warning" : "default"}
            onPress={() => {
              setFiltroPendientes(!filtroPendientes);
              setMovPage(1);
              setSelectedKeys(new Set());
            }}
            startContent={<AlertTriangle size={14} />}
            className="h-8 px-3 rounded-lg text-xs font-semibold"
          >
            {filtroPendientes ? "Mostrando: Sin FE" : "Filtrar sin FE"}
          </Button>
        }
      />

      {/* Modal Cerrar Caja */}
      <Modal
        isOpen={isCerrarOpen}
        onOpenChange={onCerrarChange}
        backdrop="opaque"
        placement="center"
        classNames={{
          backdrop: "bg-slate-900/50 backdrop-blur-md z-[999]",
          wrapper: "z-[1000]",
          base: "font-sans bg-white rounded-[24px] shadow-2xl border border-slate-100 max-w-md",
          header: "border-b border-slate-100 pb-4 pt-5 px-6",
          body: "py-5 px-6",
          footer: "border-t border-slate-100 py-4 px-6",
          closeButton: "hover:bg-slate-100 text-slate-400 mt-2 mr-2 rounded-xl",
        }}
      >
        <ModalContent>
          {(onClose) => {
            const montoIngresado =
              parseFloat(montoCierre.replace(",", ".")) || 0;
            const diferencia = montoCierre.trim()
              ? montoIngresado - efectivoEsperado
              : null;

            return (
              <>
                {/* ─── Header ──────────────────────────────────────────── */}
                <ModalHeader className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#67afc3]/10 border border-[#67afc3]/20 text-[#67afc3] shrink-0">
                    <Lock size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-lg font-extrabold text-slate-800 leading-none">
                      Cierre de Caja
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 capitalize">
                      {new Date().toLocaleDateString("es-AR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </ModalHeader>

                {/* ─── Body ────────────────────────────────────────────── */}
                <ModalBody>
                  <div className="space-y-4">
                    {/* Resumen del día — 3 tarjetas */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Coins
                            size={12}
                            className="text-slate-400"
                            strokeWidth={2}
                          />
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Apertura
                          </p>
                        </div>
                        <p className="text-sm font-extrabold text-slate-700 truncate">
                          {formatMoney(cajaActual?.MontoInicial || 0)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <TrendingUp
                            size={12}
                            className="text-emerald-500"
                            strokeWidth={2}
                          />
                          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                            Entradas
                          </p>
                        </div>
                        <p className="text-sm font-extrabold text-emerald-600 truncate">
                          {formatMoney(totalEntradasDia)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <TrendingDown
                            size={12}
                            className="text-rose-400"
                            strokeWidth={2}
                          />
                          <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">
                            Salidas
                          </p>
                        </div>
                        <p className="text-sm font-extrabold text-rose-500 truncate">
                          {formatMoney(totalSalidasDia)}
                        </p>
                      </div>
                    </div>

                    {/* Ganancia del día destacada */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#67afc3] to-[#4899b0] shadow-lg shadow-[#67afc3]/25">
                        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                          <div>
                            <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                              Balance Neto Total
                            </p>
                            <p
                              className={`text-2xl font-black leading-tight mt-1 ${
                                gananciaDelDia >= 0
                                  ? "text-white"
                                  : "text-rose-200"
                              }`}
                            >
                              {formatMoney(gananciaDelDia)}
                            </p>
                          </div>
                          <p className="text-[10px] text-white/60 mt-2">
                            Efect. esperado:{" "}
                            <span className="font-bold text-white/90">
                              {formatMoney(efectivoEsperado)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
                        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                          <div>
                            <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                              Ganancia de Ventas
                            </p>
                            <p
                              className={`text-2xl font-black leading-tight mt-1 ${
                                (cajaActual?.GananciaVentas || 0) >= 0
                                  ? "text-white"
                                  : "text-rose-200"
                              }`}
                            >
                              {formatMoney(cajaActual?.GananciaVentas || 0)}
                            </p>
                          </div>
                          <p className="text-[10px] text-white/60 mt-2 leading-tight">
                            Precio de venta deducido del costo de compra
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Input dinero físico */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Conteo de caja
                      </p>
                      <Input
                        autoFocus
                        placeholder="0,00"
                        variant="bordered"
                        size="lg"
                        value={montoCierre}
                        onValueChange={(val) =>
                          handleNumberInput(val, setMontoCierre)
                        }
                        classNames={{
                          label: "text-slate-500 font-semibold text-xs",
                          inputWrapper:
                            "h-16 border-2 border-slate-200 bg-white hover:border-[#67afc3]/50 focus-within:!border-[#67afc3] focus-within:ring-2 focus-within:ring-[#67afc3]/15 transition-all rounded-xl",
                          input: "text-2xl text-slate-800 font-black pl-1",
                        }}
                        startContent={
                          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#67afc3]/10 border border-[#67afc3]/20 text-[#67afc3] mr-1 shrink-0">
                            <DollarSign size={17} strokeWidth={2.5} />
                          </div>
                        }
                      />

                      {/* Indicador de diferencia en tiempo real */}
                      {diferencia !== null && (
                        <div
                          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            diferencia === 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : diferencia > 0
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {diferencia === 0 ? (
                            <CheckCircle2 size={15} strokeWidth={2.5} />
                          ) : (
                            <AlertTriangle size={15} strokeWidth={2.5} />
                          )}
                          <span>
                            Diferencia:{" "}
                            <span className="font-black">
                              {diferencia >= 0 ? "+" : ""}
                              {formatMoney(diferencia)}
                            </span>
                            {diferencia < 0 && " — falta dinero en el cajón"}
                            {diferencia > 0 && " — hay dinero de más"}
                            {diferencia === 0 && " — cuadra perfecto"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Advertencia */}
                  </div>
                </ModalBody>

                {/* ─── Footer ──────────────────────────────────────────── */}
                <ModalFooter className="gap-2 flex-wrap">
                  <div className="flex w-full gap-2 mb-2">
                    <Button
                      onPress={() => handlePrintReporteCaja()}
                      className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 rounded-xl shadow-md transition-all"
                      startContent={<FileText size={15} strokeWidth={2.5} />}
                    >
                      Imprimir Reporte
                    </Button>
                  </div>
                  <Button
                    variant="flat"
                    className="font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                    onPress={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onPress={handleCerrarCaja}
                    isLoading={isClosing}
                    className="flex-1 bg-[#67afc3] hover:bg-[#4899b0] text-white font-bold px-6 rounded-xl shadow-md shadow-[#67afc3]/30 transition-all"
                    startContent={
                      !isClosing && <Lock size={15} strokeWidth={2.5} />
                    }
                  >
                    Confirmar Cierre
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>

      {/* Hidden Ticket Component for Printing */}
      <div style={{ display: "none" }}>
        <div ref={reporteCajaRef}>
          {cajaActual && (
            <ReporteCajaImprimible
              cajaActual={cajaActual as any}
              nombreEmpresa={
                configuracion?.nombreFantasia || configuracion?.razonSocial
              }
            />
          )}
        </div>
      </div>

      {/* Modal Fecha Emisión Masiva */}
      <Modal
        isOpen={isFechaBulkOpen}
        onOpenChange={onFechaBulkOpenChange}
        placement="center"
        backdrop="opaque"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Calendar size={18} className="text-[#67afc3]" />
            <span>Fecha de Emisión Masiva</span>
          </ModalHeader>
          <ModalBody className="gap-4">
            {isReprocesando ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Spinner size="lg" color="current" classNames={{ circle1: "border-b-[#67afc3]" }} />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Procesando comprobantes...
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Enviando {selectedKeys.size} comprobante(s) a ARCA con fecha{" "}
                    {fechaBulk}. Esto puede tomar unos segundos.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Se aplicará esta fecha a los{" "}
                  <strong>{selectedKeys.size}</strong> comprobante(s)
                  seleccionado(s) antes de enviarlos a ARCA.
                </p>

                {/* Rango permitido por ARCA */}
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs font-bold text-blue-700 mb-1">
                    ℹ️ Rango permitido por ARCA:
                  </p>
                  <p className="text-sm text-blue-600">
                    {getArcaDateRange().min} a {getArcaDateRange().max} (±5 días
                    desde hoy)
                  </p>
                </div>

                <Input
                  type="date"
                  label="Fecha de emisión"
                  value={fechaBulk}
                  onValueChange={setFechaBulk}
                  min={getArcaDateRange().min}
                  max={getArcaDateRange().max}
                  variant="bordered"
                  classNames={{
                    label: "font-semibold text-slate-600",
                    inputWrapper:
                      "border-2 hover:border-[#67afc3]/50 focus-within:!border-[#67afc3]",
                  }}
                />

                {/* Advertencia si está fuera de rango */}
                {!isDateInArcaRange(fechaBulk) && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-red-600 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-red-700">
                        Fecha fuera de rango ARCA
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">
                        ARCA rechazará todos los comprobantes con esta fecha.
                        Selecciona una fecha entre {getArcaDateRange().min} y{" "}
                        {getArcaDateRange().max}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Información de comprobantes fuera de rango */}
                {isDateInArcaRange(fechaBulk) &&
                  countComprobantesFueraDeRango(fechaBulk) > 0 && (
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex gap-2">
                      <AlertTriangle
                        size={16}
                        className="text-yellow-600 flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-yellow-700">
                          Comprobantes con fechas antiguas detectados
                        </p>
                        <p className="text-xs text-yellow-600 mt-0.5">
                          {countComprobantesFueraDeRango(fechaBulk)} de los{" "}
                          {selectedKeys.size} comprobante(s) tienen fechas fuera
                          del rango de ±5 días. ARCA los rechazará. Considera
                          cambiar la fecha de esos comprobantes primero.
                        </p>
                      </div>
                    </div>
                  )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            {isReprocesando ? (
              <Button
                variant="flat"
                isDisabled
                className="font-semibold text-slate-400"
              >
                Cancelar
              </Button>
            ) : (
              <Button
                variant="flat"
                onPress={onFechaBulkOpenChange}
                className="font-semibold text-slate-600"
              >
                Cancelar
              </Button>
            )}
            <Button
              onPress={handleConfirmBulkEmitirArca}
              isLoading={isReprocesando}
              isDisabled={!isDateInArcaRange(fechaBulk) || isReprocesando}
              className="font-semibold bg-[#67afc3] hover:bg-[#4899b0] text-white disabled:opacity-50"
            >
              {isReprocesando ? "Procesando..." : `Emitir ${selectedKeys.size} comprobante(s)`}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
