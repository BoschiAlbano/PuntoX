"use client";

import { Button, Select, SelectItem } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
}

export default function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
}: PaginationProps) {
  const { page, limit, total, totalPages, hasNextPage, hasPreviousPage } = pagination;

  const handlePrevious = () => {
    if (hasPreviousPage) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (hasNextPage) {
      onPageChange(page + 1);
    }
  };

  const handleLimitChange = (newLimit: string) => {
    if (onLimitChange) {
      const limitNum = Number(newLimit);
      onLimitChange(limitNum);
      // Resetear a página 1 cuando cambia el límite
      onPageChange(1);
    }
  };

  // Memoizar el valor seleccionado para evitar problemas de sincronización
  const selectedLimit = useMemo(() => new Set([limit.toString()]), [limit]);

  if (total === 0) {
    return null;
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
      {/* Información de resultados */}
      <div className="text-sm text-gray-700">
        Mostrando <span className="font-semibold text-gray-900">{startItem}</span> a{" "}
        <span className="font-semibold text-gray-900">{endItem}</span> de{" "}
        <span className="font-semibold text-gray-900">{total}</span>{" "}
        {total === 1 ? "resultado" : "resultados"}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-3">
        {/* Selector de items por página */}
        {showLimitSelector && onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">Mostrar:</span>
            <Select
              size="sm"
              selectedKeys={selectedLimit}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) {
                  handleLimitChange(selected);
                }
              }}
              className="w-24"
              aria-label="Items por página"
              variant="bordered"
            >
              <SelectItem key="10">
                10
              </SelectItem>
              <SelectItem key="20">
                20
              </SelectItem>
              <SelectItem key="50">
                50
              </SelectItem>
              <SelectItem key="100">
                100
              </SelectItem>
            </Select>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex items-center gap-1 bg-white rounded-md border border-gray-200 p-1">
          <Button
            size="sm"
            variant="light"
            isDisabled={!hasPreviousPage}
            onPress={handlePrevious}
            aria-label="Página anterior"
            className="min-w-8 h-8"
          >
            <ChevronLeft size={18} />
          </Button>

          {/* Información de página */}
          <div className="px-4 py-1 text-sm text-gray-700 whitespace-nowrap">
            Página <span className="font-semibold text-gray-900">{page}</span> de{" "}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>

          <Button
            size="sm"
            variant="light"
            isDisabled={!hasNextPage}
            onPress={handleNext}
            aria-label="Página siguiente"
            className="min-w-8 h-8"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

