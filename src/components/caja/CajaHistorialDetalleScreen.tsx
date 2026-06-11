"use client";

import { useCajaByIdQuery } from "@/hooks/useCaja";
import { Button, Card, CardBody, Chip, Skeleton, Tooltip } from "@heroui/react";
import {
  ArrowLeft,
  ArrowRightLeft,
  Banknote,
  Coins,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Printer,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import React, { useMemo, useRef } from "react";
import { LoadingComponent } from "../loading/loading";
import { TIPO_MOVIMIENTO, TIPO_PAGO } from "@/lib/constants/comprobantes";
import { ReporteCajaImprimible } from "./ReporteCajaImprimible";
import { useReactToPrint } from "react-to-print";
import { useRouter } from "next/navigation";
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

export default function CajaHistorialDetalleScreen({ id }: { id: number }) {
  const router = useRouter();
  const { data: cajaActual, isLoading, isError } = useCajaByIdQuery(id);
  const { configuracion } = useConfiguracion({ enableConfiguracion: true });

  const printContentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: `Cierre_Caja_${cajaActual?.Id || ""}`,
  });

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const [movSearch, setMovSearch] = React.useState("");
  const [movPage, setMovPage] = React.useState(1);
  const movLimit = 10;

  const filteredMovimientos = useMemo(() => {
    if (!cajaActual?.Movimiento) return [];
    return cajaActual.Movimiento.filter((m: any) =>
      m.Descripcion?.toLowerCase().includes(movSearch.toLowerCase()),
    );
  }, [cajaActual?.Movimiento, movSearch]);

  const movPaginationMeta = useMemo(() => {
    const total = filteredMovimientos.length;
    return {
      total,
      page: movPage,
      limit: movLimit,
      totalPages: Math.max(1, Math.ceil(total / movLimit)),
    };
  }, [filteredMovimientos.length, movPage, movLimit]);

  const paginatedMovimientos = useMemo(() => {
    const start = (movPage - 1) * movLimit;
    return filteredMovimientos.slice(start, start + movLimit);
  }, [filteredMovimientos, movPage, movLimit]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Ganancia neta del día = total entradas - total salidas
  const gananciaDelDia = useMemo(
    () =>
      cajaActual
        ? Number(cajaActual.TotalEntradaEfectivo) -
          Number(cajaActual.TotalSalidaEfectivo)
        : 0,
    [cajaActual],
  );

  const renderMovimientoCell = React.useCallback(
    (mov: any, columnKey: React.Key) => {
      switch (columnKey) {
        case "fecha":
          return (
            <div className="flex flex-col">
              <span className="text-small">{formatDate(mov.Fecha)}</span>
              <span className="text-tiny text-default-400">
                {mov.Usuario?.Nombre || "-"}
              </span>
            </div>
          );
        case "descripcion":
          return (
            <div className="flex flex-col">
              <span className="text-small font-medium">{mov.Descripcion}</span>
              {mov.Comprobante && (
                <span className="text-xs text-gray-400">
                  Comp. #{mov.Comprobante.Numero}
                </span>
              )}
            </div>
          );
        case "tipo":
          const isEntradaTipo = mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA;
          return (
            <Chip
              className="capitalize"
              color={isEntradaTipo ? "success" : "danger"}
              size="sm"
              variant="flat"
              startContent={
                isEntradaTipo ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )
              }
            >
              {isEntradaTipo ? "Entrada" : "Salida"}
            </Chip>
          );
        case "monto":
          const isPos = mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA;
          return (
            <span
              className={`font-semibold ${isPos ? "text-success" : "text-danger"}`}
            >
              {isPos ? "+" : "-"} {formatMoney(mov.Monto)}
            </span>
          );
        case "acciones":
          if (!mov.ComprobanteId) return null;
          return (
            <div className="flex items-center justify-center gap-2">
              <Tooltip content="Ver comprobante">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() =>
                    router.push(`/comprobantes/${mov.ComprobanteId}`)
                  }
                >
                  <Eye size={16} className="text-default-500" />
                </Button>
              </Tooltip>
            </div>
          );
        default:
          return null;
      }
    },
    [router],
  );

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <LoadingComponent message="Cargando detalles de caja..." />
      </div>
    );
  }

  if (isError || !cajaActual) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center bg-[#F5F8FD]">
        <p className="text-slate-500 mb-4">
          No se encontró información de la caja.
        </p>
        <Button
          onPress={() => router.back()}
          startContent={<ArrowLeft size={16} />}
        >
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F5F8FD] p-2 sm:p-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="flat"
            className="bg-white hover:bg-slate-100 shadow-sm rounded-xl"
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Historial de Caja
            </h1>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              {cajaActual.UsuarioApertura?.NombreCompleto ||
                cajaActual.UsuarioApertura?.Nombre ||
                "Usuario"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            color="primary"
            variant="flat"
            onPress={() => handlePrint()}
            startContent={<Printer size={18} />}
            className="font-medium flex-1 sm:flex-none"
          >
            Imprimir Reporte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Monto Inicial"
              value={formatMoney(cajaActual.MontoInicial)}
              icon={Wallet}
              colorScheme="blue"
              delay={0.1}
              subtitle={`Abierta: ${formatDate(cajaActual.FechaApertura)}`}
            />
            <StatCard
              title="Entradas (Efectivo)"
              value={formatMoney(cajaActual.TotalEntradaEfectivo)}
              icon={TrendingUp}
              colorScheme="emerald"
              delay={0.2}
              subtitle="Ventas y aportes"
            />
            <StatCard
              title="Salidas (Efectivo)"
              value={formatMoney(cajaActual.TotalSalidaEfectivo)}
              icon={TrendingDown}
              colorScheme="red"
              delay={0.3}
              subtitle="Gastos y retiros"
            />
            <StatCard
              title="Monto Cierre Estimado"
              value={formatMoney(
                Number(cajaActual.MontoInicial) + gananciaDelDia,
              )}
              icon={Coins}
              colorScheme="orange"
              delay={0.4}
              subtitle={
                cajaActual.FechaCierre
                  ? `Cerrada: ${formatDate(cajaActual.FechaCierre)}`
                  : "En curso"
              }
            />
          </div>

          <Card className="shadow-sm border-none bg-white">
            <CardBody className="p-0">
              <GenericTable
                data={paginatedMovimientos}
                columns={movimientosColumns}
                renderCell={renderMovimientoCell}
                emptyText="No hay movimientos registrados en esta caja."
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
              />
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="shadow-sm border-none bg-white">
            <CardBody className="p-5 flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b border-divider pb-3">
                <FileText size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Resumen de la Caja
                </h3>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Banknote size={20} className="text-emerald-500" />
                    </div>
                    <span className="font-medium text-slate-700">
                      Efectivo Total
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatMoney(
                      Number(cajaActual.MontoInicial) + gananciaDelDia,
                    )}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <CreditCard size={20} className="text-blue-500" />
                    </div>
                    <span className="font-medium text-slate-700">Tarjetas</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatMoney(
                      Number(cajaActual.TotalEntradaTarjeta) -
                        Number(cajaActual.TotalSalidaTarjeta),
                    )}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <ArrowRightLeft size={20} className="text-indigo-500" />
                    </div>
                    <span className="font-medium text-slate-700">Transferencias</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatMoney(
                      Number(cajaActual.TotalEntradaTransf) -
                        Number(cajaActual.TotalSalidaTransf),
                    )}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Wallet size={20} className="text-amber-500" />
                    </div>
                    <span className="font-medium text-slate-700">Cheques</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatMoney(
                      Number(cajaActual.TotalEntradaCheque) -
                        Number(cajaActual.TotalSalidaCheque),
                    )}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileText size={20} className="text-rose-500" />
                    </div>
                    <span className="font-medium text-slate-700">Cta. Corriente</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatMoney(
                      Number(cajaActual.TotalEntradaCtaCte) -
                        Number(cajaActual.TotalSalidaCtaCte),
                    )}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <DollarSign size={20} className="text-primary" />
                    </div>
                    <span className="font-medium text-slate-700">
                      Ganancia Ventas
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatMoney(cajaActual.GananciaVentas || 0)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div style={{ display: "none" }}>
        <ReporteCajaImprimible ref={printContentRef} cajaActual={cajaActual} />
      </div>
    </div>
  );
}
