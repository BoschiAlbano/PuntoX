import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  SortDescriptor,
} from "@heroui/react";
import { useState, useEffect, Key } from "react";
import { RefreshCw } from "lucide-react";
import { PaginationMeta } from "@/hooks/useProductos"; // Reutilizamos interface o la movemos a types compartidos
import { useDebounce } from "@/hooks/useDebounce";

export interface Column {
  uid: string;
  name: string;
  sortable?: boolean;
  align?: "start" | "center" | "end";
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column[];
  renderCell: (item: T, columnKey: Key) => React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  emptyText?: string;
  // Search Props
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  // Pagination Props
  page: number;
  onPageChange: (page: number) => void;
  paginationMeta: PaginationMeta;
  // Sorting Props
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  onNewClick?: () => void;
  newButtonText?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  totalItems?: number;
}

export default function GenericTable<T extends { Id: number | string }>({
  data,
  columns,
  renderCell,
  isLoading,
  isError,
  emptyText = "No hay registros",
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  page,
  onPageChange,
  paginationMeta,
  sortDescriptor,
  onSortChange,
  onNewClick,
  newButtonText = "Nuevo",
  onRefresh,
  isRefreshing = false,
  totalItems,
}: GenericTableProps<T>) {
  const [searchInput, setSearchInput] = useState(search);

  // Debounce de búsqueda (400ms para reducir llamadas)
  const debouncedSearch = useDebounce(searchInput, 400);

  // Actualizar búsqueda cuando el valor debounced cambia
  useEffect(() => {
    if (debouncedSearch !== search) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, search, onSearchChange]);

  return (
    <section className="w-full h-full flex flex-col gap-4 overflow-hidden">
      <div className="rounded-lg flex flex-col gap-4 items-center bg-white/50 backdrop-blur-sm ">
        {/* Header & Search */}
        <section className="w-full flex items-center justify-end gap-2">
          {/* Boton nuevo con efecto lift */}
          {onNewClick && (
            <button
              onClick={onNewClick}
              className="bg-[#67afc3]/90 text-white px-5 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer text-[16px]"
              aria-label={newButtonText}
            >
              {newButtonText}
            </button>
          )}
          {/* Botón de actualizar */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              title="Actualizar datos"
              aria-label="Actualizar datos de la tabla"
            >
              <RefreshCw
                size={18}
                className={`text-gray-600 transition-transform ${
                  isRefreshing ? "animate-spin" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          )}
          {/* Search */}
          <div className="group flex items-center gap-2 border-2 border-gray-300 rounded-xl p-1.5 bg-white transition-all duration-300 hover:border-[#67afc3]">
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="outline-none px-2 bg-transparent text-gray-700 placeholder:text-gray-400"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Buscar en la tabla"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5 text-gray-500 transition-all duration-300 group-hover:text-[#67afc3] group-hover:scale-105 group-active:scale-95 group-focus:outline-none group-focus:ring-2 group-focus:ring-[#67afc3] group-focus:ring-offset-2"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </section>

        {/* Table */}
        <div className="w-full overflow-hidden border border-gray-200/50 overflow-x-auto">
          <Table
            aria-label="Tabla de datos"
            sortDescriptor={sortDescriptor}
            onSortChange={onSortChange}
            className="bg-white rounded-lg border-none"
            classNames={{
              wrapper: "bg-white min-w-full",
              th: "bg-[#67afc3]/90 text-white transition-colors duration-200 text-[13px] font-medium",
            }}
            // style={{ contain: "layout style paint" }} // Optimización de rendering
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.uid}
                  align={column.align || "start"}
                  allowsSorting={column.sortable}
                  aria-label={`Columna ${column.name}, ${
                    column.sortable ? "ordenable" : "no ordenable"
                  }`}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={
                isLoading
                  ? Array.from({ length: 5 }).map(
                      (_, i) => ({ Id: `skeleton-${i}` } as T)
                    )
                  : data
              }
              emptyContent={
                isError ? (
                  <div
                    className="text-danger flex justify-center py-4"
                    role="alert"
                    aria-live="polite"
                  >
                    Error al cargar datos
                  </div>
                ) : (
                  <div
                    className="text-gray-500 text-center py-8"
                    role="status"
                    aria-live="polite"
                  >
                    {emptyText}
                  </div>
                )
              }
            >
              {(item) => {
                // Si es un skeleton (durante loading)
                if (
                  isLoading &&
                  typeof item.Id === "string" &&
                  item.Id.startsWith("skeleton-")
                ) {
                  return (
                    <TableRow key={item.Id} className="animate-pulse">
                      {columns.map((column) => (
                        <TableCell
                          key={column.uid}
                          className="border-b border-gray-100"
                        >
                          <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md bg-size-[200%_100%] animate-shimmer" />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                }

                // Fila normal con datos
                return (
                  <TableRow
                    key={item.Id}
                    className="transition-all duration-200 hover:bg-linear-to-r hover:from-blue-50 hover:to-sky-50 cursor-pointer rounded-lg"
                    tabIndex={0}
                    aria-label={`Fila ${item.Id}`}
                  >
                    {(columnKey) => (
                      <TableCell className="">
                        {renderCell(item, columnKey)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="rounded-lg flex flex-col items-center py-2">
        {!isLoading && !isError && (
          <Pagination
            showControls
            page={page}
            total={paginationMeta.totalPages}
            onChange={onPageChange}
            classNames={{
              cursor: "bg-[#67afc3] text-white shadow-none ",
              item: "bg-transparent shadow-none ",
            }}
            aria-label="Paginación de la tabla"
          />
        )}
      </div>
    </section>
  );
}
