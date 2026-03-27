import { useCaja } from "@/hooks/useCaja";
import { useGastos } from "@/hooks/useGastos";
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
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import {
  Eye,
  FileText,
  Lock,
  Plus,
  TrendingDown,
  TrendingUp,
  Unlock,
  Pencil,
  Trash2,
  DollarSign,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Wallet,
  Coins,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { LoadingComponent } from "../loading/loading";
import { handleNumberInput } from "@/lib/input/number";
import {
  TIPO_MOVIMIENTO,
  TIPO_PAGO,
  TIPO_PAGO_LABELS,
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

const gastosColumns: Column[] = [
  { uid: "descripcion", name: "Descripción", sortable: false },
  { uid: "concepto", name: "Concepto", sortable: false },
  { uid: "formaPago", name: "Forma de Pago", sortable: false },
  { uid: "fecha", name: "Fecha", sortable: false },
  {
    uid: "monto",
    name: "Monto",
    sortable: false,
    align: "end",
    printAlign: "right",
  },
  { uid: "acciones", name: "Acciones", sortable: false, align: "center" },
];

export default function CajaActual() {
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

  const {
    conceptosGasto,
    agregarGasto,
    editarGasto,
    eliminarGasto,
    agregarConceptoGasto,
    isAddingGasto,
    isEditingGasto,
    isDeletingGasto,
    isAddingConcepto,
  } = useGastos({ enableConceptos: true });

  const { configuracion } = useConfiguracion({
    enableConfiguracion: true,
  });

  const [montoInicial, setMontoInicial] = useState("0,00");
  const {
    isOpen: isAbrirOpen,
    onOpen: onAbrirOpen,
    onOpenChange: onAbrirChange,
  } = useDisclosure();

  // Gastos
  const {
    isOpen: isGastoOpen,
    onOpen: onGastoOpen,
    onOpenChange: onGastoChange,
  } = useDisclosure();
  const [nuevoGasto, setNuevoGasto] = useState<{
    conceptoId: string;
    descripcion: string;
    pagos: { tipoPago: number; monto: string }[];
  }>({
    conceptoId: "",
    descripcion: "",
    pagos: [],
  });
  const [editingGastoId, setEditingGastoId] = useState<number | null>(null);

  // Nuevo concepto
  const {
    isOpen: isConceptoOpen,
    onOpen: onConceptoOpen,
    onOpenChange: onConceptoChange,
  } = useDisclosure();
  const [nuevoConcepto, setNuevoConcepto] = useState("");

  // Cerrar caja
  const {
    isOpen: isCerrarOpen,
    onOpen: onCerrarOpen,
    onOpenChange: onCerrarChange,
  } = useDisclosure();
  const [montoCierre, setMontoCierre] = useState("");

  // Eliminar Gasto Confirmation
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteChange,
  } = useDisclosure();
  const [gastoToDelete, setGastoToDelete] = useState<number | null>(null);

  const handleAgregarConcepto = async () => {
    if (!nuevoConcepto) return;
    try {
      await agregarConceptoGasto(nuevoConcepto);
      onConceptoChange();
      setNuevoConcepto("");
      addToast({ title: "Concepto creado", color: "success" });
    } catch (err) {
      addToast({
        title: "Error",
        description: "No se pudo crear el concepto",
        color: "danger",
      });
    }
  };

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
  const gastos = cajaActual?.Gasto || [];

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

  // Gastos: búsqueda y paginación local
  const [gastoSearch, setGastoSearch] = useState("");
  const [gastoPage, setGastoPage] = useState(1);
  const GASTO_LIMIT = 10;

  const filteredGastos = useMemo(() => {
    if (!gastoSearch.trim()) return gastos;
    const q = gastoSearch.toLowerCase();
    return gastos.filter(
      (g: any) =>
        g.Descripcion?.toLowerCase().includes(q) ||
        g.ConceptoGastos?.Descripcion?.toLowerCase().includes(q),
    );
  }, [gastos, gastoSearch]);

  const paginatedGastos = useMemo(() => {
    const start = (gastoPage - 1) * GASTO_LIMIT;
    return filteredGastos.slice(start, start + GASTO_LIMIT);
  }, [filteredGastos, gastoPage]);

  const gastoPaginationMeta = useMemo(
    () => ({
      total: filteredGastos.length,
      page: gastoPage,
      limit: GASTO_LIMIT,
      totalPages: Math.max(1, Math.ceil(filteredGastos.length / GASTO_LIMIT)),
    }),
    [filteredGastos.length, gastoPage],
  );

  const handleAbrirCaja = async () => {
    const monto = parseFloat(montoInicial.replace(",", "."));
    if (!montoInicial || isNaN(monto) || monto < 0) return;
    try {
      await abrirCaja(monto);
      onAbrirChange();
      setMontoInicial("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleAgregarGasto = async () => {
    try {
      const pagosFormatted = nuevoGasto.pagos.map((p) => ({
        tipoPago: p.tipoPago,
        monto: parseFloat(p.monto.replace(",", ".")),
      }));

      if (editingGastoId) {
        await editarGasto({
          id: editingGastoId,
          conceptoId: Number(nuevoGasto.conceptoId),
          descripcion: nuevoGasto.descripcion,
          pagos: pagosFormatted,
        });
        addToast({ title: "Gasto actualizado", color: "success" });
      } else {
        await agregarGasto({
          conceptoId: Number(nuevoGasto.conceptoId),
          descripcion: nuevoGasto.descripcion,
          pagos: pagosFormatted,
        });
        addToast({ title: "Gasto registrado", color: "success" });
      }

      onGastoChange();
      setNuevoGasto({ conceptoId: "", descripcion: "", pagos: [] });
      setEditingGastoId(null);
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: editingGastoId
          ? "No se pudo actualizar el gasto"
          : "No se pudo registrar el gasto",
        color: "danger",
      });
    }
  };

  const prepareEditGasto = (gasto: any) => {
    setEditingGastoId(gasto.Id);

    // Mapeamos los pagos si existen
    const pagos =
      gasto.FormaPago?.map((fp: any) => ({
        tipoPago: fp.TipoPago,
        // Convertimos el monto a string y reemplazamos punto por coma para el input
        monto: fp.Monto.toString().replace(".", ","),
      })) || [];

    setNuevoGasto({
      conceptoId: String(gasto.ConceptoGastoId),
      descripcion: gasto.Descripcion,
      pagos: pagos,
    });
    onGastoOpen();
  };

  const handleEliminarGasto = async () => {
    if (!gastoToDelete) return;
    try {
      await eliminarGasto(gastoToDelete);
      addToast({ title: "Gasto eliminado", color: "success" });
      onDeleteChange();
      setGastoToDelete(null);
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: "No se pudo eliminar el gasto",
        color: "danger",
      });
    }
  };

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

  const renderGastoCell = useCallback(
    (gasto: any, columnKey: React.Key) => {
      switch (columnKey) {
        case "descripcion":
          return (
            <span className="text-sm font-medium text-gray-800">
              {gasto.Descripcion}
            </span>
          );
        case "concepto":
          return (
            <Chip size="sm" variant="flat" color="danger" className="text-xs">
              {gasto.ConceptoGastos?.Descripcion || "Gasto"}
            </Chip>
          );
        case "formaPago":
          return (
            <div className="flex flex-wrap gap-1">
              {gasto.FormaPago?.map((p: any) => (
                <Chip key={p.Id} size="sm" variant="flat" className="text-xs">
                  {TIPO_PAGO_LABELS[p.TipoPago]}
                </Chip>
              ))}
            </div>
          );
        case "fecha":
          return formatDate(gasto.Fecha);
        case "monto":
          return (
            <span className="font-semibold text-danger">
              -{formatMoney(gasto.Monto)}
            </span>
          );
        case "acciones":
          return (
            <div className="flex gap-1 justify-center">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="warning"
                onPress={() => prepareEditGasto(gasto)}
              >
                <Pencil size={16} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => {
                  setGastoToDelete(gasto.Id);
                  onDeleteOpen();
                }}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          );
        default:
          return null;
      }
    },
    [prepareEditGasto],
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
      <div className="flex justify-center items-center h-full min-h-[400px]">
        {/* <Spinner size="lg" /> */}
        <LoadingComponent message="Cargando caja..." />
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
      <div className="flex flex-col items-center justify-center gap-6 h-full min-h-[500px] text-gray-500">
        <Lock className="w-16 h-16 text-gray-300" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            La caja está cerrada
          </h2>
          <p className="text-sm">
            Debes abrir la caja para comenzar a registrar operaciones.
          </p>
        </div>
        <Button
          color="primary"
          endContent={<Unlock className="w-4 h-4" />}
          onPress={onAbrirOpen}
        >
          Abrir Caja
        </Button>

        <Modal isOpen={isAbrirOpen} onOpenChange={onAbrirChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Apertura de Caja</ModalHeader>
                <ModalBody>
                  <Input
                    label="Monto Inicial"
                    placeholder="0.00"
                    type="text"
                    value={montoInicial}
                    onValueChange={(val) =>
                      handleNumberInput(val, setMontoInicial)
                    }
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">$</span>
                      </div>
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Ingrese el dinero en efectivo disponible al inicio del
                    turno.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" color="danger" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleAbrirCaja}
                    isLoading={isOpening}
                  >
                    Abrir Caja
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
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
    <div className="flex flex-col gap-6">
      {/* ... Entradas/Salidas/Tables code preserved ... */}

      {/* Entradas del dia */}
      <h1 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp size={20} className="text-green-500" />
        Entradas del dia
      </h1>
      <div className="flex flex-row sm:flex-nowrap flex-wrap gap-4">
        <StatCard
          title="Efectivo"
          value={formatMoney(cajaActual.TotalEntradaEfectivo)}
          subtitle="Entradas del dia"
          icon={Banknote}
          colorScheme="white"
          iconColor="#14c187"
          delay={0.1}
          progressPercent={75}
        />

        <StatCard
          title="Tarjeta"
          value={formatMoney(cajaActual.TotalEntradaTarjeta)}
          subtitle="Entradas del dia"
          icon={CreditCard}
          colorScheme="white"
          iconColor="#2b7fff"
          delay={0.1}
          progressPercent={75}
        />

        <StatCard
          title="Transferencia"
          value={formatMoney(cajaActual.TotalEntradaTransf)}
          subtitle="Entradas del dia"
          icon={ArrowRightLeft}
          colorScheme="white"
          iconColor="#ad46ff"
          delay={0.1}
          progressPercent={75}
        />

        <StatCard
          title="Cheque"
          value={formatMoney(cajaActual.TotalEntradaCheque)}
          subtitle="Entradas del dia"
          icon={Wallet}
          colorScheme="white"
          iconColor="#7dbbcc"
          delay={0.1}
          progressPercent={75}
        />

        <StatCard
          title="Cuenta Corriente"
          value={formatMoney(cajaActual.TotalEntradaCtaCte)}
          subtitle="Entradas del dia"
          icon={Wallet}
          colorScheme="white"
          iconColor="#ff6900"
          delay={0.1}
          progressPercent={75}
        />
      </div>

      {/* Salidas del dia */}
      <h1 className="text-lg font-semibold flex items-center gap-2">
        <TrendingDown size={20} className="text-red-500" />
        Salidas del dia
      </h1>
      <div className="flex flex-row gap-4 sm:flex-nowrap flex-wrap">
        <StatCard
          title="Efectivo"
          value={formatMoney(cajaActual.TotalSalidaEfectivo)}
          subtitle="Salidas del dia"
          icon={Banknote}
          colorScheme="white"
          iconColor="#14c187"
          delay={0.1}
          progressPercent={75}
        />

        <StatCard
          title="Tarjeta"
          value={formatMoney(cajaActual.TotalSalidaTarjeta)}
          subtitle="Salidas del dia"
          icon={CreditCard}
          colorScheme="white"
          iconColor="#2b7fff"
          delay={0.1}
          progressPercent={75}
        />

        <StatCard
          title="Transferencia"
          value={formatMoney(cajaActual.TotalSalidaTransf)}
          subtitle="Salidas del dia"
          icon={ArrowRightLeft}
          colorScheme="white"
          iconColor="#ad46ff"
          delay={0.1}
          progressPercent={75}
        />

        <StatCard
          title="Cheque"
          value={formatMoney(cajaActual.TotalSalidaCheque)}
          subtitle="Salidas del dia"
          icon={Wallet}
          colorScheme="white"
          iconColor="#7dbbcc"
          delay={0.1}
          progressPercent={75}
        />

        <StatCard
          title="Cuenta Corriente"
          value={formatMoney(cajaActual.TotalSalidaCtaCte)}
          subtitle="Salidas del dia"
          icon={Wallet}
          colorScheme="white"
          iconColor="#ff6900"
          delay={0.1}
          progressPercent={75}
        />
      </div>

      {/* Movements Table Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp size={20} className="text-[#69b0c3]" />
          Movimientos
        </h1>
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
        extraSearchContent={
          <Button
            size="sm"
            onPress={onCerrarOpen}
            className="bg-[#69b0c3] text-white border border-[#69b0c3] font-bold px-4 h-9 rounded-xl gap-2 hover:bg-[#69b0c3]/80 hover:border-[#69b0c3] transition-all"
            startContent={<Lock size={15} strokeWidth={2.5} />}
          >
            Cerrar Caja
          </Button>
        }
      />

      {/* Gastos Table Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown size={20} className="text-[#69b0c3]" />
          Gastos
        </h1>
      </div>
      <GenericTable
        data={paginatedGastos}
        columns={gastosColumns}
        isLoading={false}
        isError={false}
        search={gastoSearch}
        onSearchChange={(val) => {
          setGastoSearch(val);
          setGastoPage(1);
        }}
        searchPlaceholder="Buscar gasto..."
        page={gastoPage}
        onPageChange={setGastoPage}
        paginationMeta={gastoPaginationMeta}
        isRefreshing={isFetching}
        onRefresh={refetch}
        renderCell={renderGastoCell}
        emptyText="No hay gastos registrados."
        printConfig={{ title: "Gastos de Caja" }}
        onNewClick={() => {
          setEditingGastoId(null);
          setNuevoGasto({ conceptoId: "", descripcion: "", pagos: [] });
          onGastoOpen();
        }}
        newButtonText="Nuevo Gasto"
      />

      {/* Modal Nuevo Gasto */}
      <Modal isOpen={isGastoOpen} onOpenChange={onGastoChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingGastoId ? "Editar Gasto" : "Registrar Gasto"}
              </ModalHeader>
              <ModalBody>
                <div className="flex gap-2 items-end">
                  <Select
                    label="Concepto"
                    placeholder="Seleccione un concepto"
                    selectedKeys={
                      nuevoGasto.conceptoId ? [nuevoGasto.conceptoId] : []
                    }
                    onChange={(e) =>
                      setNuevoGasto({
                        ...nuevoGasto,
                        conceptoId: e.target.value,
                      })
                    }
                    className="flex-1"
                  >
                    {conceptosGasto?.map((c) => (
                      <SelectItem key={c.Id.toString()}>
                        {c.Descripcion}
                      </SelectItem>
                    ))}
                  </Select>
                  <Button
                    isIconOnly
                    color="primary"
                    variant="flat"
                    onPress={onConceptoOpen}
                  >
                    <Plus size={20} />
                  </Button>
                </div>
                <Input
                  label="Descripción"
                  placeholder="Detalle del gasto"
                  value={nuevoGasto.descripcion}
                  onValueChange={(val) =>
                    setNuevoGasto({ ...nuevoGasto, descripcion: val })
                  }
                />

                <div className="border p-4 rounded-xl border-gray-200 bg-gray-50 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600">
                      Formas de Pago
                    </span>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      startContent={<Plus size={16} />}
                      onPress={() => {
                        const usedTypes = new Set(
                          nuevoGasto.pagos.map((p) => p.tipoPago),
                        );
                        const allTypes = Object.values(TIPO_PAGO);
                        const nextType = allTypes.find(
                          (t) => !usedTypes.has(t),
                        );

                        if (nextType) {
                          setNuevoGasto({
                            ...nuevoGasto,
                            pagos: [
                              ...nuevoGasto.pagos,
                              { tipoPago: nextType, monto: "" },
                            ],
                          });
                        }
                      }}
                      isDisabled={
                        nuevoGasto.pagos.length >= Object.keys(TIPO_PAGO).length
                      }
                    >
                      Agregar Pago
                    </Button>
                  </div>

                  {nuevoGasto.pagos.map((pago, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Select
                        label="Tipo"
                        className="w-1/3"
                        size="sm"
                        selectedKeys={[pago.tipoPago.toString()]}
                        onChange={(e) => {
                          const newPagos = [...nuevoGasto.pagos];
                          newPagos[index].tipoPago = Number(e.target.value);
                          setNuevoGasto({ ...nuevoGasto, pagos: newPagos });
                        }}
                      >
                        {Object.entries(TIPO_PAGO_LABELS).map(
                          ([key, label]) => {
                            const value = Number(key);
                            const isSelected = nuevoGasto.pagos.some(
                              (p) => p.tipoPago === value,
                            );
                            const isCurrentValue = pago.tipoPago === value;

                            return (
                              <SelectItem
                                key={key}
                                isDisabled={isSelected && !isCurrentValue}
                              >
                                {label}
                              </SelectItem>
                            );
                          },
                        )}
                      </Select>
                      <Input
                        label="Monto"
                        size="sm"
                        placeholder="0.00"
                        value={pago.monto}
                        onValueChange={(val) => {
                          const newPagos = [...nuevoGasto.pagos];
                          handleNumberInput(val, (v) => {
                            newPagos[index].monto = v;
                            setNuevoGasto({ ...nuevoGasto, pagos: newPagos });
                          });
                        }}
                        className="flex-1"
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => {
                          const newPagos = nuevoGasto.pagos.filter(
                            (_, i) => i !== index,
                          );
                          setNuevoGasto({ ...nuevoGasto, pagos: newPagos });
                        }}
                      >
                        <TrendingDown size={16} />
                      </Button>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg text-primary">
                      {formatMoney(
                        nuevoGasto.pagos.reduce(
                          (acc, p) =>
                            acc + (parseFloat(p.monto.replace(",", ".")) || 0),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" color="danger" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleAgregarGasto}
                  isLoading={isAddingGasto || isEditingGasto}
                  isDisabled={
                    nuevoGasto.pagos.length === 0 ||
                    !nuevoGasto.conceptoId ||
                    !nuevoGasto.descripcion ||
                    nuevoGasto.pagos.some(
                      (p) =>
                        !p.monto || parseFloat(p.monto.replace(",", ".")) <= 0,
                    )
                  }
                >
                  {editingGastoId ? "Actualizar" : "Guardar"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Nuevo Concepto */}
      <Modal isOpen={isConceptoOpen} onOpenChange={onConceptoChange} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Nuevo Concepto de Gasto</ModalHeader>
              <ModalBody>
                <Input
                  label="Descripción"
                  placeholder="Ej: Limpieza, Insumos..."
                  value={nuevoConcepto}
                  onValueChange={setNuevoConcepto}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleAgregarConcepto}
                  isLoading={isAddingConcepto}
                >
                  Guardar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteChange} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Eliminar Gasto</ModalHeader>
              <ModalBody>
                <p>¿Estás seguro de que deseas eliminar este gasto?</p>
                <p className="text-xs text-gray-500">
                  Esta acción revertirá los movimientos en la caja.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  onPress={handleEliminarGasto}
                  isLoading={isDeletingGasto}
                >
                  Eliminar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Cerrar Caja */}
      <Modal
        isOpen={isCerrarOpen}
        onOpenChange={onCerrarChange}
        backdrop="opaque"
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-md",
          base: "font-sans bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white/60 max-w-md",
          header: "border-b border-slate-100/60 pb-4 pt-6 px-6",
          body: "py-5 px-6",
          footer: "border-t border-slate-100/60 py-4 px-6",
          closeButton: "hover:bg-slate-100 text-slate-400 mt-2 mr-2",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              {/* ─── Header ──────────────────────────────────────────── */}
              <ModalHeader className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-linear-to-br from-rose-50 to-rose-100 border border-rose-200 text-rose-500">
                  <Lock size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-slate-800 leading-none">Cierre de Caja</span>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" })}
                  </p>
                </div>
              </ModalHeader>

              {/* ─── Body ────────────────────────────────────────────── */}
              <ModalBody>
                <div className="space-y-4">

                  {/* Métricas del día */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Monto Inicial */}
                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-500 shrink-0">
                        <Coins size={15} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">Apertura</p>
                        <p className="text-sm font-extrabold text-slate-700 truncate">
                          {formatMoney(cajaActual?.MontoInicial || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Efectivo Neto */}
                    <div className="flex items-center gap-3 p-3.5 bg-[#67afc3]/5 border border-[#67afc3]/15 rounded-2xl">
                      <div className="p-2 rounded-xl bg-[#67afc3]/15 text-[#67afc3] shrink-0">
                        <Banknote size={15} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">Efect. neto</p>
                        <p className="text-sm font-extrabold text-[#67afc3] truncate">
                          {formatMoney(
                            (cajaActual?.TotalEntradaEfectivo || 0) -
                              (cajaActual?.TotalSalidaEfectivo || 0),
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ganancia destacada */}
                  <div className="relative overflow-hidden rounded-2xl p-4 bg-linear-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest">Ganancia del día</p>
                        <p className="text-3xl font-black text-white leading-tight mt-0.5">
                          {formatMoney(cajaActual?.Ganancia || 0)}
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/20">
                        <CheckCircle2 size={24} className="text-white" strokeWidth={2} />
                      </div>
                    </div>
                  </div>

                  {/* Input dinero físico */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-0.5">Conteo de caja</p>
                    <Input
                      label="Dinero físico en el cajón"
                      placeholder="0,00"
                      variant="bordered"
                      value={montoCierre}
                      onValueChange={(val) =>
                        handleNumberInput(val, setMontoCierre)
                      }
                      classNames={{
                        label:
                          "text-slate-500 font-bold uppercase text-[10px] tracking-widest",
                        inputWrapper:
                          "h-13 border-slate-200 bg-slate-50/50 hover:border-[#67afc3]/60 focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20 transition-all rounded-xl",
                        input: "text-xl text-slate-700 font-black",
                      }}
                      startContent={
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 mr-1 shrink-0">
                          <DollarSign size={15} />
                        </div>
                      }
                    />
                  </div>

                  {/* Advertencia */}
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      Contá el dinero físico en el cajón antes de confirmar. El sistema registrará cualquier diferencia.
                    </p>
                  </div>
                </div>
              </ModalBody>

              {/* ─── Footer ──────────────────────────────────────────── */}
              <ModalFooter>
                <Button
                  variant="light"
                  className="font-bold text-slate-500"
                  onPress={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  onPress={handleCerrarCaja}
                  isLoading={isClosing}
                  className="bg-linear-to-r from-rose-500 to-rose-600 text-white font-bold px-6 rounded-xl shadow-md shadow-rose-500/20"
                  startContent={
                    !isClosing && <Lock size={15} strokeWidth={2.5} />
                  }
                >
                  Confirmar Cierre
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>


      {/* Ticket Detail Modal */}
      <Modal
        isOpen={isTicketOpen}
        onOpenChange={onTicketChange}
        size="2xl"
        scrollBehavior="inside"
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
