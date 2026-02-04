"use client";

import React, { useState, useCallback } from "react";
import GenericTable, { Column } from "@/components/shared/GenericTable";
import { useCajasQuery, CajasFilters } from "@/hooks/useCajasQuery";
import { Caja } from "@/hooks/useCaja";
import { Chip } from "@heroui/react";

const columns: Column[] = [
  { uid: "status", name: "Estado", sortable: false, align: "center" },
  { uid: "apertura", name: "Apertura", sortable: false },
  { uid: "cierre", name: "Cierre", sortable: false },
  { uid: "montoInicial", name: "Monto Inicial", sortable: false, align: "end" },
  { uid: "montoCierre", name: "Monto Cierre", sortable: false, align: "end" },
  { uid: "ganancia", name: "Ganancia", sortable: false, align: "end" },
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

export default function Cajas() {
  const [filters, setFilters] = useState<CajasFilters>({
    page: 1,
    limit: 10,
    estado: "todas",
    q: "",
  });

  const { data, isLoading, isError, refetch, isFetching } =
    useCajasQuery(filters);

  const handleSearchChange = (val: string) => {
    setFilters((prev) => ({ ...prev, q: val, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const renderCell = useCallback((item: Caja, columnKey: React.Key) => {
    switch (columnKey) {
      case "status":
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
      case "ganancia":
        return (
          <span className={item.Ganancia >= 0 ? "text-success" : "text-danger"}>
            {formatMoney(item.Ganancia)}
          </span>
        );
      default:
        return null;
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <div className="flex flex-wrap gap-4 items-end bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mr-auto">Cajas</h1>

        {/* Filters */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Estado</label>
          <select
            className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#67afc3] outline-none bg-white min-w-[150px]"
            value={filters.estado || "todas"}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                estado: e.target.value as any,
                page: 1,
              }))
            }
          >
            <option value="todas">Todas</option>
            <option value="abierta">Abiertas</option>
            <option value="cerrada">Cerradas</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Desde</label>
          <input
            type="date"
            className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#67afc3] outline-none bg-white"
            value={filters.fechaDesde || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                fechaDesde: e.target.value,
                page: 1,
              }))
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Hasta</label>
          <input
            type="date"
            className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#67afc3] outline-none bg-white"
            value={filters.fechaHasta || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                fechaHasta: e.target.value,
                page: 1,
              }))
            }
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
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
        />
      </div>
    </div>
  );
}
