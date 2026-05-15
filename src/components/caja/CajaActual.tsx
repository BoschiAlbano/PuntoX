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
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  addToast,
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
} from "lucide-react";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { LoadingComponent } from "../loading/loading";
import { handleNumberInput } from "@/lib/input/number";
import {
  TIPO_MOVIMIENTO,
  TIPO_PAGO,
} from "@/lib/constants/comprobantes";
import { useReactToPrint } from "react-to-print";
import { TicketImpresion } from "../ventas/TicketImpresion";
import StatCard from "../dashboard/StatCard";
import GenericTable, { Column } from "@/components/shared/GenericTable";
import { useConfiguracion } from "@/hooks/useConfiguracion";

const movimientosColumns: Column[] = [
  { uid: "fecha", name: "Fecha", sortable: false },
  { uid: "descripcion", name: "Descripción", sortable: false },
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

  const { configuracion } = useConfiguracion({
    enableConfiguracion: true,
  });

  const {
    isOpen: _isAbrirOpen,
    onOpenChange: _onAbrirChange,
  } = useDisclosure();
  const isAbrirOpen = propIsAbrirOpen ?? _isAbrirOpen;
  const onAbrirChange = propOnAbrirChange ?? _onAbrirChange;

  // Notificar al padre cuando cambia el estado de la caja
  useEffect(() => {
    onCajaStatusChange?.(!!isCajaAbierta);
  }, [isCajaAbierta, onCajaStatusChange]);

  // Cerrar caja — controlado desde el padre si se pasan props
  const {
    isOpen: _isCerrarOpen,
    onOpenChange: _onCerrarChange,
  } = useDisclosure();
  const isCerrarOpen = propIsCerrarOpen ?? _isCerrarOpen;
  const onCerrarChange = propOnCerrarChange ?? _onCerrarChange;
  const [montoCierre, setMontoCierre] = useState("");

  // Detalle Comprobante Modal
  const {
    isOpen: isTicketOpen,
    onOpen: onTicketOpen,
    onOpenChange: onTicketChange,
  } = useDisclosure();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);

  // Ticket Printing logic - Moved up to avoid hook order issues
  const ticketRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: "Ticket de Venta",
  });

  const movimientos = cajaActual?.Movimiento || [];

  // Movimientos: búsqueda y paginación local
  const [movSearch, setMovSearch] = useState("");
  const [movPage, setMovPage] = useState(1);
  const MOV_LIMIT = 10;

  const filteredMovimientos = useMemo(() => {
    if (!movSearch.trim()) return movimientos;
    const q = movSearch.toLowerCase();
    return movimientos.filter(
      (m: any) =>
        m.Descripcion?.toLowerCase().includes(q) ||
        m.Comprobante?.Numero?.toString().includes(q),
    );
  }, [movimientos, movSearch]);

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

  const handleViewTicket = async (comprobanteId: number) => {
    setIsLoadingTicket(true);
    setSelectedTicket(null);
    onTicketOpen();
    try {
      if (fetchDetalleComprobante) {
        const data = await fetchDetalleComprobante(comprobanteId);
        setSelectedTicket(data);
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      addToast({
        title: "Error",
        description: "No se pudo obtener el detalle del comprobante",
        color: "danger",
      });
    } finally {
      setIsLoadingTicket(false);
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
                <span className="text-xs text-gray-400">
                  Comp. #{mov.Comprobante.Numero}
                </span>
              )}
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
    const monto = parseFloat(montoCierre.replace(",", "."));
    if (!montoCierre || isNaN(monto) || monto < 0) {
      addToast({
        title: "Error",
        description: "Debe ingresar un monto válido",
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
      <div className="flex flex-col items-center justify-center gap-6 h-full min-h-[400px] sm:min-h-[500px] text-gray-500 px-4">
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

        <ModalAbrirCaja open={isAbrirOpen} onClose={onAbrirChange} />
      </div>
    );
  }

  const getTipoComprobanteLabel = (tipo: number) => {
    switch (tipo) {
      case 1:
        return "Factura A"; // TIPO_COMPROBANTE_VENTA.FACTURA_A
      case 2:
        return "Factura B"; // TIPO_COMPROBANTE_VENTA.FACTURA_B
      case 3:
        return "Factura C"; // TIPO_COMPROBANTE_VENTA.FACTURA_C
      case 4:
        return "Presupuesto";
      case 5:
        return "Remito";
      case 6:
        return "Nota de Crédito";
      default:
        return "Comprobante";
    }
  };

  const handlePrintTicket = () => {
    if (!selectedTicket) return;
    handlePrint();
  };

  // Prepare data for printing
  const ticketData = selectedTicket
    ? {
        items: selectedTicket.DetalleComprobante.map((d: any) => ({
          ...d,
          subtotal: Number(d.SubTotal),
          cantidad: Number(d.Cantidad),
          Iva: { Porcentaje: Number(d.Iva) },
        })),
        cliente:
          selectedTicket.cliente ||
          selectedTicket.Comprobante_Factura?.Persona_Cliente?.Persona,
        subtotal: Number(selectedTicket.SubTotal),
        descuento: Number(selectedTicket.Descuento),
        total: Number(selectedTicket.Total),
        fecha: selectedTicket.Fecha,
        numeroComprobante: selectedTicket.Numero,
        tipoComprobante: getTipoComprobanteLabel(
          selectedTicket.TipoComprobante,
        ),
        formasPago: selectedTicket.FormaPago.map((fp: any) => ({
          tipoPago: fp.TipoPago,
          monto: Number(fp.Monto),
        })),
        pie: configuracion?.observacionPieFactura || "",
      }
    : null;

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Entradas del dia */}
      <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
        <TrendingUp size={18} className="text-green-500" />
        Entradas del día
      </h2>
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
        isRefreshing={isFetching}
        onRefresh={refetch}
        renderCell={renderMovCell}
        emptyText="No hay movimientos registrados."
        printConfig={{ title: "Movimientos de Caja" }}
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
          closeButton:
            "hover:bg-slate-100 text-slate-400 mt-2 mr-2 rounded-xl",
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
                    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#67afc3] to-[#4899b0] shadow-lg shadow-[#67afc3]/25">
                      <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
                      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                            Ganancia neta del día
                          </p>
                          <p
                            className={`text-[2rem] font-black leading-tight mt-1 ${
                              gananciaDelDia >= 0
                                ? "text-white"
                                : "text-rose-200"
                            }`}
                          >
                            {formatMoney(gananciaDelDia)}
                          </p>
                          <p className="text-[10px] text-white/60 mt-1">
                            Efect. esperado:{" "}
                            <span className="font-bold text-white/90">
                              {formatMoney(efectivoEsperado)}
                            </span>
                          </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/20 shrink-0">
                          <DollarSign
                            size={26}
                            className="text-white"
                            strokeWidth={2}
                          />
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
                <ModalFooter className="gap-2">
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

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={isTicketOpen}
        onOpenChange={onTicketChange}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm z-[999]",
          wrapper: "z-[1000]",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-row justify-between items-center pr-10">
                <span className="text-xl">
                  {selectedTicket
                    ? `Comprobante #${selectedTicket.Numero.toString().padStart(8, "0")}`
                    : "Detalle"}
                </span>
                {selectedTicket && (
                  <Chip
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="capitalize"
                  >
                    {getTipoComprobanteLabel(selectedTicket.TipoComprobante)}
                  </Chip>
                )}
              </ModalHeader>
              <ModalBody>
                {isLoadingTicket ? (
                  <div className="flex justify-center py-10">
                    <LoadingComponent message="Cargando comprobante..." />
                  </div>
                ) : selectedTicket ? (
                  <div className="flex flex-col gap-6">
                    {/* Header Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cliente Info */}
                      <Card className="bg-gray-50 shadow-none border border-gray-200">
                        <CardBody className="py-3 px-4 flex flex-col gap-1">
                          <span className="text-xs text-gray-500 uppercase font-semibold">
                            Cliente
                          </span>
                          <span className="font-medium text-lg">
                            {selectedTicket?.cliente?.Nombre
                              ? `${selectedTicket?.cliente?.Nombre} ${selectedTicket?.cliente?.Apellido || ""}`
                              : "Consumidor Final"}
                          </span>
                          {selectedTicket?.cliente?.Dni && (
                            <span className="text-sm text-gray-600">
                              DNI/CUIT: {selectedTicket.cliente.Dni}
                            </span>
                          )}
                          {selectedTicket?.cliente?.Direccion && (
                            <span className="text-sm text-gray-400">
                              {selectedTicket.cliente.Direccion}
                            </span>
                          )}
                        </CardBody>
                      </Card>

                      {/* Info General */}
                      <Card className="bg-gray-50 shadow-none border border-gray-200">
                        <CardBody className="py-3 px-4 flex flex-col gap-1">
                          <span className="text-xs text-gray-500 uppercase font-semibold">
                            Detalles
                          </span>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Fecha:
                            </span>
                            <span className="font-medium">
                              {formatDate(selectedTicket.Fecha)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Total:
                            </span>
                            <span className="font-bold text-xl text-primary">
                              {formatMoney(selectedTicket.Total)}
                            </span>
                          </div>
                        </CardBody>
                      </Card>
                    </div>

                    {/* Items Table */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
                        <FileText size={18} />
                        Ítems del comprobante
                      </h4>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <Table
                          aria-label="Items del comprobante"
                          removeWrapper
                          classNames={{
                            th: "bg-gray-100 text-gray-600 text-xs",
                            td: "text-sm",
                          }}
                        >
                          <TableHeader>
                            <TableColumn>CANT</TableColumn>
                            <TableColumn>DESCRIPCIÓN</TableColumn>
                            <TableColumn align="end">P. UNITARIO</TableColumn>
                            <TableColumn align="end">SUBTOTAL</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {selectedTicket.DetalleComprobante.map(
                              (item: any) => (
                                <TableRow key={item.Id}>
                                  <TableCell className="font-medium">
                                    {item.Cantidad}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span>{item.Descripcion}</span>
                                      {item.Codigo && (
                                        <span className="text-xs text-gray-400">
                                          SKU: {item.Codigo}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {formatMoney(item.Precio)}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {formatMoney(item.SubTotal)}
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Pagos */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
                        <TrendingUp size={18} />
                        Pagos registrados
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTicket.FormaPago.map((fp: any) => (
                          <div
                            key={fp.Id}
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-3 shadow-sm"
                          >
                            <span className="text-xs font-semibold uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {Object.keys(TIPO_PAGO).find(
                                (key) =>
                                  TIPO_PAGO[key as keyof typeof TIPO_PAGO] ===
                                  fp.TipoPago,
                              ) || "OTRO"}
                            </span>
                            <span className="font-bold text-gray-800">
                              {formatMoney(fp.Monto)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">
                    No se encontró información del comprobante.
                  </p>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-between">
                <Button color="danger" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
                {selectedTicket && (
                  <Button
                    color="primary"
                    startContent={<FileText size={18} />}
                    onPress={handlePrintTicket}
                  >
                    Imprimir Ticket
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Hidden Ticket Component for Printing */}
      <div style={{ display: "none" }}>
        <TicketImpresion ref={ticketRef} datosVenta={ticketData} />
      </div>
    </div>
  );
}
