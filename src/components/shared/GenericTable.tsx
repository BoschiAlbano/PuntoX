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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useState, useEffect, useRef, Key } from "react";
import { Check, Columns2, Download, Menu, Printer, RefreshCcw, Upload } from "lucide-react";
import { useReactToPrint } from "react-to-print";
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
  onImportClick?: () => void;
  onExportClick?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
  onImportClick,
  onExportClick,
  onRefresh,
  isRefreshing = false,
}: GenericTableProps<T>) {
  const [searchInput, setSearchInput] = useState(search);
  const tablePrintRef = useRef<HTMLDivElement>(null);

  // Columnas visibles: ocultar "acciones" por defecto del selector (siempre visible en tabla)
  const selectableColumns = columns.filter((c) => c.uid !== "acciones");
  const [visibleUids, setVisibleUids] = useState<Set<string>>(() =>
    new Set(columns.map((c) => c.uid)),
  );
  const visibleColumns = columns.filter((c) => visibleUids.has(c.uid));

  const handlePrint = useReactToPrint({
    contentRef: tablePrintRef,
    documentTitle: "Listado",
  });

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
      <div className="rounded-lg flex flex-col gap-4 bg-white/50 backdrop-blur-sm flex-1 w-full h-full px-4">
        {/* Barra de herramientas: Búsqueda+Filtro | Botones */}
        <section className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 sm:px-4 px-1 py-2 rounded-lg bg-white/80 border border-gray-200/60">
          {/* Búsqueda + Filtro - alineados a la izquierda */}
          <div className="w-full sm:flex-initial order-1">
            <div className="flex items-center gap-2 w-full sm:w-[280px] min-w-0">
              <div className="flex-1 min-w-0">
                <div className="group flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white transition-all duration-200 hover:border-[#67afc3] focus-within:border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-gray-400 flex-shrink-0"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="outline-none w-full bg-transparent text-gray-700 placeholder:text-gray-400 text-sm"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    aria-label="Buscar en la tabla"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Acciones - a la derecha */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0 order-2">
            {/* Grupo: Nuevo (acción principal) */}
            {onNewClick && (
              <button
                onClick={onNewClick}
                className="px-4 h-9 rounded-lg bg-[#67afc3] hover:bg-[#5a9db0] text-white font-medium text-sm shadow-sm transition-all duration-200 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={newButtonText}
              >
                {newButtonText}
              </button>
            )}

            {/* Separador visual entre Nuevo y Importar/Exportar */}
            <div
              className="hidden sm:block w-px h-6 bg-gray-200"
              aria-hidden
            />

            {/* Grupo: Más opciones, Columnas, Actualizar (mismo espaciado) */}
            <div className="flex items-center gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <button
                    type="button"
                    className="p-2 h-9 w-9 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-[#67afc3] text-gray-600 hover:text-[#67afc3] transition-all duration-200 flex items-center justify-center flex-shrink-0"
                    title="Más opciones"
                    aria-label="Más opciones (Importar, Exportar, Imprimir)"
                  >
                    <Menu size={18} aria-hidden="true" />
                  </button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Más opciones">
                  <DropdownItem
                    key="importar"
                    startContent={<Upload size={16} />}
                    onPress={onImportClick ?? (() => {})}
                  >
                    Importar
                  </DropdownItem>
                  <DropdownItem
                    key="exportar"
                    startContent={<Download size={16} />}
                    onPress={onExportClick ?? (() => {})}
                  >
                    Exportar
                  </DropdownItem>
                  <DropdownItem
                    key="imprimir"
                    startContent={<Printer size={16} />}
                    onPress={handlePrint}
                  >
                    Imprimir
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              {selectableColumns.length > 1 && (
                <Dropdown closeOnSelect={false}>
                  <DropdownTrigger>
                    <button
                      type="button"
                      className="p-2 h-9 w-9 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-[#67afc3] text-gray-600 hover:text-[#67afc3] transition-all duration-200 flex items-center justify-center flex-shrink-0"
                      title="Columnas visibles"
                      aria-label="Mostrar u ocultar columnas"
                    >
                      <Columns2 size={18} aria-hidden="true" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Columnas visibles"
                    className="min-w-[200px] p-2"
                    classNames={{ list: "p-2 gap-0.5" }}
                  >
                    {selectableColumns.map((col) => (
                      <DropdownItem
                        key={col.uid}
                        textValue={col.name}
                        startContent={
                          visibleUids.has(col.uid) ? (
                            <Check size={14} className="text-[#67afc3] flex-shrink-0" />
                          ) : (
                            <span className="w-3.5 inline-block" aria-hidden />
                          )
                        }
                        onPress={() => {
                          setVisibleUids((prev) => {
                            const next = new Set(prev);
                            if (next.has(col.uid)) {
                              if (next.size <= 1) return prev;
                              next.delete(col.uid);
                            } else {
                              next.add(col.uid);
                            }
                            return next;
                          });
                        }}
                        className="rounded-md"
                      >
                        {col.name}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-2 h-9 w-9 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-[#67afc3] text-gray-600 hover:text-[#67afc3] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
                  title="Actualizar datos"
                  aria-label="Actualizar datos de la tabla"
                >
                  <RefreshCcw
                    size={18}
                    className={`transition-transform ${isRefreshing ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Table + Pagination en mismo contenedor (ref para impresión) */}
        <div
          ref={tablePrintRef}
          className="w-full overflow-hidden flex-1 flex flex-col h-full shadow-md rounded-xl border border-gray-200/60 bg-white print:shadow-none print:border print:border-gray-300"
        >
        <div className="flex-1 min-h-0 overflow-auto overflow-x-auto">
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
            <TableHeader columns={visibleColumns}>
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
                      {visibleColumns.map((column, idx) => (
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
          {/* Pagination - agrupada con la tabla */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-t border-gray-200/60 bg-gray-50/50 rounded-b-xl">
        {isLoading ? (
          <div className="flex items-center gap-2">
              <Skeleton className="rounded-medium w-9 h-9 opacity-50">
                <div className="h-9 w-9 rounded-medium bg-default-200" />
              </Skeleton>
              <Skeleton className="rounded-medium w-9 h-9 opacity-50">
                <div className="h-9 w-9 rounded-medium bg-default-200" />
              </Skeleton>
              <Skeleton className="rounded-medium w-[100px] h-4 opacity-50" />
            </div>
        ) : !isLoading && !isError ? (
          <>
            <span className="text-[#67afc3]/90 text-sm">
              {`${data.length} de ${paginationMeta.total} registros`}
            </span>
            <Pagination
              showControls
              page={page}
              total={paginationMeta.totalPages}
              onChange={onPageChange}
              size="md"
              classNames={{
                cursor: "bg-[#67afc3]/90 text-white shadow-none ",
                item: "bg-transparent shadow-none cursor-pointer text-sm sm:text-md",
                next: "cursor-pointer",
                prev: "cursor-pointer",
                wrapper: "gap-1",
              }}
              aria-label="Paginación de la tabla"
            />
          </>
        ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
