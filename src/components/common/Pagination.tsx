"use client";

import { Button, Select, SelectItem } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      onLimitChange(Number(newLimit));
      // Resetear a página 1 cuando cambia el límite
      onPageChange(1);
    }
  };

  if (total === 0) {
    return null;
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
      {/* Información de resultados */}
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-medium">{startItem}</span> a{" "}
        <span className="font-medium">{endItem}</span> de{" "}
        <span className="font-medium">{total}</span> resultados
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Selector de items por página */}
        {showLimitSelector && onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mostrar:</span>
            <Select
              size="sm"
              selectedKeys={[limit.toString()]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleLimitChange(selected);
              }}
              className="w-20"
              aria-label="Items por página"
            >
              <SelectItem key="10" value="10">
                10
              </SelectItem>
              <SelectItem key="20" value="20">
                20
              </SelectItem>
              <SelectItem key="50" value="50">
                50
              </SelectItem>
              <SelectItem key="100" value="100">
                100
              </SelectItem>
            </Select>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="flat"
            isDisabled={!hasPreviousPage}
            onPress={handlePrevious}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </Button>

          {/* Información de página */}
          <div className="px-3 py-1 text-sm text-gray-700">
            Página <span className="font-medium">{page}</span> de{" "}
            <span className="font-medium">{totalPages}</span>
          </div>

          <Button
            size="sm"
            variant="flat"
            isDisabled={!hasNextPage}
            onPress={handleNext}
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

