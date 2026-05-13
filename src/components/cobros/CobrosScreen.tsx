"use client";

import React, { useState, useMemo, Key } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Chip } from "@heroui/react";
import { Clock, DollarSign } from "lucide-react";
import { TIPO_COMPROBANTE_VENTA_LABELS } from "@/lib/constants/comprobantes";
import { CobrarModal } from "./CobrarModal";
import GenericTable, { Column } from "@/components/shared/GenericTable";
import { useConfiguracion } from "@/hooks/useConfiguracion";

interface ComprobantePendiente {
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
}

// GenericTable requiere T extends { Id: number | string }
type ComprobantePendienteRow = ComprobantePendiente & { Id: number };

const columns: Column[] = [
  { uid: "comprobante", name: "Comprobante" },
  { uid: "cliente", name: "Cliente" },
  { uid: "fecha", name: "Fecha" },
  { uid: "total", name: "Total", align: "end" },
  { uid: "acciones", name: "" },
];

async function fetchCobros(page: number): Promise<{
  data: ComprobantePendiente[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const res = await fetch(`/api/cobros?page=${page}&limit=20`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al cargar cobros pendientes");
  return res.json();
}

export function CobrosScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedComprobante, setSelectedComprobante] =
    useState<ComprobantePendienteRow | null>(null);

  const { configuracion } = useConfiguracion({ enableConfiguracion: true });
  const cobroDiferidoActivo = !!configuracion?.puestoCajaSeparado;

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["cobros-pendientes", page],
    queryFn: () => fetchCobros(page),
    enabled: cobroDiferidoActivo,
    refetchInterval: cobroDiferidoActivo ? 5000 : false,
    refetchIntervalInBackground: false,
  });

  const pagination = data?.pagination;

  // Map → agrega Id (mayúscula) requerido por GenericTable
  const rows: ComprobantePendienteRow[] = useMemo(
    () => (data?.data ?? []).map((c) => ({ ...c, Id: c.id })),
    [data],
  );

  // Filtro client-side (la API no soporta ?q=)
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => {
      const cliente = c.cliente
        ? `${c.cliente.nombre} ${c.cliente.apellido}`.toLowerCase()
        : "consumidor final";
      const tipo = (
        TIPO_COMPROBANTE_VENTA_LABELS[c.tipoComprobante] ?? ""
      ).toLowerCase();
      return (
        cliente.includes(q) ||
        tipo.includes(q) ||
        c.numero.toString().includes(q)
      );
    });
  }, [rows, search]);

  const paginationMeta = pagination ?? {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const renderCell = (
    item: ComprobantePendienteRow,
    columnKey: Key,
  ): React.ReactNode => {
    const tipoLabel =
      TIPO_COMPROBANTE_VENTA_LABELS[item.tipoComprobante] ?? "Factura";
    const clienteNombre = item.cliente
      ? `${item.cliente.nombre} ${item.cliente.apellido}`.trim()
      : "Consumidor Final";
    const fecha = new Date(item.fecha);

    switch (String(columnKey)) {
      case "comprobante":
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Clock size={13} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{tipoLabel}</p>
              <p className="text-[10px] text-slate-400">
                #{item.numero.toString().padStart(8, "0")}
              </p>
            </div>
          </div>
        );
      case "cliente":
        return (
          <p className="text-xs text-slate-600 truncate">{clienteNombre}</p>
        );
      case "fecha":
        return (
          <p className="text-xs text-slate-500">
            {fecha.toLocaleDateString("es-AR")}{" "}
            <span className="text-slate-400">
              {fecha.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
        );
      case "total":
        return (
          <p className="text-sm font-bold text-slate-900 text-right">
            $
            {item.total.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}
          </p>
        );
      case "acciones":
        return (
          <Button
            size="sm"
            className="bg-[#67afc3] hover:bg-[#5a9eb1] text-white font-bold rounded-xl text-xs h-8 gap-1"
            onPress={() => setSelectedComprobante(item)}
            startContent={<DollarSign size={12} />}
          >
            Cobrar
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Chip de total pendiente alineado a la derecha */}
      {pagination && pagination.total > 0 && (
        <div className="flex justify-end">
          <Chip
            size="sm"
            className="bg-amber-50 text-amber-600 border border-amber-200 font-semibold"
          >
            {pagination.total} pendiente{pagination.total !== 1 ? "s" : ""}
          </Chip>
        </div>
      )}

      {/* Tabla genérica */}
      <GenericTable
        data={filteredRows}
        columns={columns}
        renderCell={renderCell}
        isLoading={isLoading}
        isError={isError}
        emptyText="No hay cobros pendientes. Los comprobantes en modo diferido aparecerán aquí automáticamente."
        search={search}
        onSearchChange={(val: string) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Buscar por tipo, número o cliente..."
        page={page}
        onPageChange={setPage}
        paginationMeta={paginationMeta}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        printConfig={{ title: "Cobros pendientes" }}
      />

      {/* Modal de cobro */}
      {selectedComprobante && (
        <CobrarModal
          isOpen={!!selectedComprobante}
          onClose={() => setSelectedComprobante(null)}
          comprobante={selectedComprobante}
        />
      )}
    </div>
  );
}
