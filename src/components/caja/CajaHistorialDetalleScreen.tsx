"use client";

import { useCajaByIdQuery } from "@/hooks/useCaja";
import { Button, Card, CardBody, Chip, Tooltip } from "@heroui/react";
import {
  ArrowLeft,
  Eye,
  FileText,
  Printer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React, { useMemo, useRef } from "react";
import { LoadingComponent } from "../loading/loading";
import { TIPO_MOVIMIENTO } from "@/lib/constants/comprobantes";
import { ReporteCajaImprimible } from "./ReporteCajaImprimible";
import { useReactToPrint } from "react-to-print";
import { useRouter } from "next/navigation";
import GenericTable, { Column } from "@/components/shared/GenericTable";
import CajaResumenCompartido from "@/components/caja/CajaResumenCompartido";

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

  const movimientosConGastos = useMemo(() => {
    const movs = (cajaActual?.Movimiento || []).map((m: any) => ({ ...m, _esGasto: false }));
    const gas = (cajaActual?.Gasto || []).map((g: any) => ({
      Id: `gasto-${g.Id}`,
      Fecha: g.Fecha,
      Descripcion: g.Descripcion,
      Monto: g.Monto,
      TipoMovimiento: 2,
      _esGasto: true,
      _gasto: g,
      Comprobante: null,
      ComprobanteId: null,
    }));
    return [...movs, ...gas].sort(
      (a: any, b: any) =>
        new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime(),
    );
  }, [cajaActual?.Movimiento, cajaActual?.Gasto]);

  const filteredMovimientos = useMemo(() => {
    if (!movimientosConGastos.length) return [];
    const q = movSearch.toLowerCase().trim();
    if (!q) return movimientosConGastos;
    return movimientosConGastos.filter(
      (m: any) =>
        m.Descripcion?.toLowerCase().includes(q) ||
        m._gasto?.ConceptoGastos?.Descripcion?.toLowerCase().includes(q) ||
        m.Comprobante?.Numero?.toString().includes(q),
    );
  }, [movimientosConGastos, movSearch]);

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

  const handleViewGasto = (gastoId: number) => {
    router.push(`/caja/gastos/${gastoId}`);
  };

  const renderMovimientoCell = React.useCallback(
    (mov: any, columnKey: React.Key) => {
      switch (columnKey) {
        case "fecha":
          return (
            <div className="flex flex-col">
              <span className="text-small">{formatDate(mov.Fecha)}</span>
              {!mov._esGasto && (
                <span className="text-tiny text-default-400">
                  {mov.Usuario?.Nombre || "-"}
                </span>
              )}
            </div>
          );
        case "descripcion":
          return (
            <div className="flex flex-col">
              <span className="text-small font-medium">{mov.Descripcion}</span>
              {mov._esGasto ? null : mov.Comprobante ? (
                <span className="text-xs text-gray-400">
                  Comp. #{mov.Comprobante.Numero}
                </span>
              ) : null}
            </div>
          );
        case "tipo":
          const isEntradaTipo = mov._esGasto ? false : mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA;
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
          const isPos = mov._esGasto ? false : mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA;
          return (
            <span
              className={`font-semibold ${isPos ? "text-success" : "text-danger"}`}
            >
              {isPos ? "+" : "-"} {formatMoney(mov.Monto)}
            </span>
          );
        case "acciones":
          if (mov._esGasto) {
            return (
              <div className="flex items-center justify-center gap-2">
                <Tooltip content="Ver detalle del gasto">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleViewGasto(mov._gasto.Id)}
                  >
                    <Eye size={16} className="text-default-500" />
                  </Button>
                </Tooltip>
              </div>
            );
          }
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
    [router, handleViewGasto],
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

      <CajaResumenCompartido cajaActual={cajaActual} isLoading={isLoading}>
        <Card className="shadow-sm border-none bg-white rounded-2xl">
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
      </CajaResumenCompartido>

      <div style={{ display: "none" }}>
        <ReporteCajaImprimible ref={printContentRef} cajaActual={cajaActual} />
      </div>
    </div>
  );
}
