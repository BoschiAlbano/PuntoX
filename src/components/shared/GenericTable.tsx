import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  SortDescriptor,
  Skeleton,
} from "@heroui/react";
import { useState, useEffect, Key } from "react";
import { RefreshCcw } from "lucide-react";
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
      <div className="rounded-lg flex flex-col gap-4 bg-white/50 backdrop-blur-sm flex-1 w-full h-full">
        {/* Header & Search */}
        <section className="w-full flex items-center sm:justify-end justify-start gap-2 sm:px-4 px-1">
          {/* Boton nuevo con efecto lift */}
          {onNewClick && (
            <button
              onClick={onNewClick}
              className=" px-4 h-[36px] rounded-lg border border-gray-300 bg-[#67afc3]/90 hover:bg-[#67afc3] hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-white cursor-pointer"
              aria-label={newButtonText}
            >
              {newButtonText}
            </button>
          )}

          {/* Search */}
          <div className=" group flex justify-between gap-2 border-2 border-gray-300 rounded-xl p-1.5 bg-white transition-all duration-300 hover:border-[#67afc3] relative sm:w-auto w-[200px]">
            <input
              type="text"
              placeholder={`${searchPlaceholder}`}
              className="outline-none pl-2 w-full bg-transparent text-gray-700 placeholder:text-gray-400 truncate"
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

          {/* Botón de actualizar */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-gray-300 bg-[#67afc3]/90 hover:bg-[#67afc3] hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Actualizar datos"
              aria-label="Actualizar datos de la tabla"
            >
              <RefreshCcw
                size={18}
                className={`text-white transition-transform ${
                  isRefreshing ? "animate-spin" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          )}
        </section>

        {/* Table */}
        <div className="w-full overflow-hidden overflow-x-auto flex-1 flex flex-col h-full">
          <Table
            aria-label="Tabla de datos"
            sortDescriptor={sortDescriptor}
            onSortChange={onSortChange}
            className="bg-white rounded-lg border-none"
            classNames={{
              wrapper:
                "bg-white h-full shadow-none rounded-xl border-none sm:p-4 p-1",
              th: "bg-[#67afc3]/90 text-white transition-colors duration-200 text-[13px] font-medium hover:!text-white hover:[&_*]:!text-white group",
              base: "bg-transparent h-full shadow-none rounded-xl border-none",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.uid}
                  align={column.align || "center"}
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
                      (_, i) => ({ Id: `skeleton-${i}` }) as T,
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
                    <TableRow key={item.Id}>
                      {columns.map((column, idx) => (
                        <TableCell key={column.uid} className="">
                          {column.uid === "acciones" ? (
                            <div className="opacity-50 flex gap-2 w-full justify-center items-center">
                              <Skeleton className="rounded-lg">
                                <div className="h-8 w-8 rounded-lg bg-default-200" />
                              </Skeleton>
                              <Skeleton className="rounded-lg">
                                <div className="h-8 w-8 rounded-lg bg-default-200" />
                              </Skeleton>
                            </div>
                          ) : column.uid === "Estado" ? (
                            <Skeleton className="rounded-full w-20">
                              <div className="h-6 w-20 rounded-full bg-default-200" />
                            </Skeleton>
                          ) : (
                            <Skeleton
                              className={`rounded-lg ${
                                idx === 0
                                  ? "w-16"
                                  : idx === 1
                                    ? "w-full"
                                    : "w-24"
                              }`}
                            >
                              <div className="h-4 rounded-lg bg-default-200" />
                            </Skeleton>
                          )}
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
        {isLoading ? (
          <section className="relative w-full flex flex-col sm:gap-0 gap-2 items-center">
            <div className="flex gap-2">
              <Skeleton className="rounded-medium w-9 h-9 opacity-50">
                <div className="h-9 w-9 rounded-medium bg-default-200" />
              </Skeleton>
              <Skeleton className="rounded-medium w-9 h-9 opacity-50">
                <div className="h-9 w-9 rounded-medium bg-default-200" />
              </Skeleton>
              <Skeleton className="rounded-medium w-9 h-9 opacity-50">
                <div className="h-9 w-9 rounded-medium bg-default-200" />
              </Skeleton>
            </div>
            <span className="text-[#67afc3]/90 w-full sm:text-start text-center sm:pl-2 pl-0 text-sm sm:absolute relative bottom-0 flex flex-col sm:items-start items-center">
              {/* {`${paginationMeta.limit} de ${paginationMeta.total} registros totales`} */}
              <Skeleton className="rounded-medium w-[120px] h-4 opacity-50 ">
                <div className="h-4 w-[120px] rounded-medium bg-default-200" />
              </Skeleton>
            </span>
          </section>
        ) : !isLoading && !isError ? (
          <section className="relative w-full flex flex-col sm:gap-0 gap-2 items-center">
            <Pagination
              showControls
              page={page}
              total={paginationMeta.totalPages}
              onChange={onPageChange}
              size={window.innerWidth < 640 ? "sm" : "md"}
              classNames={{
                cursor: "bg-[#67afc3]/90 text-white shadow-none ",
                item: "bg-transparent shadow-none cursor-pointer text-sm sm:text-md",
                next: "cursor-pointer",
                prev: "cursor-pointer",
                wrapper: "gap-1",
              }}
              aria-label="Paginación de la tabla"
            />
            <span className="text-[#67afc3]/90 w-full sm:text-start text-center pl-2 text-sm sm:absolute relative  bottom-0">
              {`${data.length} de ${paginationMeta.total} registros totales`}
            </span>
          </section>
        ) : null}
      </div>
    </section>
  );
}
