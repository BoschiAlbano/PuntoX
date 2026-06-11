"use client";

import React, { useState, useCallback } from "react";
import GenericTable, { Column } from "@/components/shared/GenericTable";
import { useCajasQuery, CajasFilters } from "@/hooks/useCajasQuery";
import { Caja } from "@/hooks/useCaja";
import { Chip, Select, SelectItem, Input, Button, Tooltip } from "@heroui/react";
import { CalendarDays, X, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

const columns: Column[] = [
  { uid: "status", name: "Estado", sortable: false, align: "center" },
  { uid: "apertura", name: "Apertura", sortable: false },
  { uid: "cierre", name: "Cierre", sortable: false },
  { uid: "montoInicial", name: "Monto Inicial", sortable: false, align: "end" },
  { uid: "montoCierre", name: "Monto Cierre", sortable: false, align: "end" },
  { uid: "ganancia", name: "Ganancia", sortable: false, align: "end" },
  { uid: "acciones", name: "Acciones", sortable: false, align: "center" },
];

const formatMoney = (amount: number | null) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ESTADO_OPTIONS = [
  { key: "todas", label: "Todas" },
  { key: "abierta", label: "Abiertas" },
  { key: "cerrada", label: "Cerradas" },
];

export default function Cajas() {
  const [filters, setFilters] = useState<CajasFilters>({
    page: 1,
    limit: 10,
    estado: "todas",
  });

  const router = useRouter();

  const { data, isLoading, isError, refetch, isFetching } =
    useCajasQuery(filters);

  const hasDateFilter = !!(filters.fechaDesde || filters.fechaHasta);

  const handleSearchChange = (val: string) => {
    setFilters((prev) => ({ ...prev, q: val, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const renderCell = useCallback((item: Caja, columnKey: React.Key) => {
    switch (columnKey) {
      case "status": {
        const isOpen = !item.FechaCierre;
        return (
          <Chip
            className="capitalize"
            color={isOpen ? "success" : "danger"}
            size="sm"
            variant="flat"
          >
            {isOpen ? "Abierta" : "Cerrada"}
          </Chip>
        );
      }
      case "apertura":
        return (
          <div className="flex flex-col">
            <span className="text-bold text-small">
              {formatDate(item.FechaApertura)}
            </span>
            <span className="text-tiny text-default-400">
              {item.UsuarioApertura?.NombreCompleto ||
                item.UsuarioApertura?.Nombre ||
                "-"}
            </span>
          </div>
        );
      case "cierre":
        if (!item.FechaCierre) return "-";
        return (
          <div className="flex flex-col">
            <span className="text-bold text-small">
              {formatDate(item.FechaCierre)}
            </span>
            <span className="text-tiny text-default-400">
              {item.UsuarioCierre?.NombreCompleto ||
                item.UsuarioCierre?.Nombre ||
                "-"}
            </span>
          </div>
        );
      case "montoInicial":
        return formatMoney(item.MontoInicial);
      case "montoCierre":
        return formatMoney(item.MontoCierre);
      case "ganancia": {
        const ganancia = item.GananciaVentas || 0;
        return (
          <span className={ganancia >= 0 ? "text-success" : "text-danger"}>
            {formatMoney(ganancia)}
          </span>
        );
      }
      case "acciones":
        return (
          <div className="flex items-center justify-center">
            <Tooltip content="Ver detalle de caja">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => router.push(`/caja/historial/${item.Id}`)}
              >
                <Eye size={18} className="text-default-500" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  }, []);

  const filterControls = (
    <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
      {/* Estado — fila completa en mobile */}
      <Select
        className="col-span-2 sm:w-[130px]"
        selectedKeys={[filters.estado || "todas"]}
        onSelectionChange={(keys) => {
          const val = Array.from(keys)[0] as string;
          setFilters((prev) => ({ ...prev, estado: val as any, page: 1 }));
        }}
        classNames={{
          trigger: "bg-white border border-slate-200 shadow-none h-9 min-h-9",
          label: "text-[11px]",
        }}
        size="sm"
      >
        {ESTADO_OPTIONS.map((opt) => (
          <SelectItem key={opt.key}>{opt.label}</SelectItem>
        ))}
      </Select>

      {/* Desde — mitad en mobile */}
      <Input
        type="date"
        className="sm:w-[150px]"
        value={filters.fechaDesde || ""}
        startContent={<CalendarDays size={13} className="text-slate-400 shrink-0" />}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, fechaDesde: e.target.value, page: 1 }))
        }
        classNames={{
          inputWrapper: "bg-white border border-slate-200 shadow-none h-9 min-h-9 px-3 rounded-lg",
        }}
        size="sm"
        aria-label="Desde"
      />

      {/* Hasta — mitad en mobile (+ botón limpiar cuando hay filtro activo) */}
      <div className="flex items-center gap-2">
        <Input
          type="date"
          className="flex-1 sm:w-[150px]"
          value={filters.fechaHasta || ""}
          startContent={<CalendarDays size={13} className="text-slate-400 shrink-0" />}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, fechaHasta: e.target.value, page: 1 }))
          }
          classNames={{
            inputWrapper: "bg-white border border-slate-200 shadow-none h-9 min-h-9 px-3 rounded-lg",
          }}
          size="sm"
          aria-label="Hasta"
        />
        {hasDateFilter && (
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={() =>
              setFilters((prev) => ({
                ...prev,
                fechaDesde: undefined,
                fechaHasta: undefined,
                page: 1,
              }))
            }
            className="h-9 w-9 text-slate-500 bg-white border border-slate-200 shrink-0"
            aria-label="Limpiar fechas"
          >
            <X size={14} />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full flex-1 flex flex-col">
      <GenericTable
        data={data?.data || []}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        search={filters.q || ""}
        onSearchChange={handleSearchChange}
        page={filters.page || 1}
        onPageChange={handlePageChange}
        paginationMeta={
          data?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 }
        }
        isRefreshing={isFetching}
        onRefresh={refetch}
        renderCell={renderCell}
        emptyText="No se encontraron cajas con los filtros seleccionados"
        searchPlaceholder="Buscar por usuario..."
        extraRightContent={filterControls}
        defaultVisibleUidsMobile={["status", "apertura", "cierre"]}
      />
    </div>
  );
}
