/**
 * Tabla genérica: búsqueda, paginación, ordenamiento, selección masiva.
 * Menú "Más opciones": Exportar CSV/XLS, Imprimir.
 * Usado por GenericCrud.
 * @see docs/ui/crud-tablas-genericas.md
 */
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
import { useState, useRef, Key } from "react";
import {
  Check,
  ChevronDown,
  Columns2,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  Menu,
  Printer,
  RefreshCcw,
  Table as TableIcon,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { PaginationMeta } from "@/hooks/useProductos";

function getPrintPageStyle(orientation?: "portrait" | "landscape"): string {
  const pageSize =
    orientation === "landscape" ? "size: A4 landscape;" : "size: A4 portrait;";
  return `
    @page { margin: 2cm; ${pageSize} }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
    .table-print-source {
      position: static !important; left: auto !important; top: auto !important; z-index: auto !important;
      width: 100% !important; padding: 0 !important; background: white !important;
    }
    .table-print-header {
      margin-bottom: 20px; padding: 16px 20px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-left: 4px solid #67afc3; border-radius: 4px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .table-print-header h1 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.02em; }
    .table-print-header .meta { font-size: 11px; color: #64748b; font-weight: 500; }
    .table-print-source .table-wrapper {
      border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .table-print-source table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .table-print-source thead { display: table-header-group; }
    .table-print-source th {
      background: linear-gradient(180deg, #67afc3 0%, #5a9db0 100%) !important;
      color: white !important; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;
      padding: 10px 12px; border: none; border-bottom: 2px solid #4a8a9a;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .table-print-source th[data-align="right"] { text-align: right; }
    .table-print-source th[data-align="center"] { text-align: center; }
    .table-print-source td {
      padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .table-print-source td[data-align="right"] { text-align: right; }
    .table-print-source td[data-align="center"] { text-align: center; }
    .table-print-source tbody tr:nth-child(even) td { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .table-print-source tbody tr:nth-child(odd) td { background: #ffffff !important; }
    .table-print-source tbody tr { break-inside: avoid; }
    .table-print-source .print-status { filter: grayscale(1); font-weight: 500; }
  `;
}

export interface Column {
  uid: string;
  name: string;
  sortable?: boolean;
  /** Ruta anidada para ordenar (ej: "Precio.PrecioCosto") */
  sortKey?: string;
  align?: "start" | "center" | "end";
  /** Alineación en impresión: right para numéricas, center para Estado/badges */
  printAlign?: "left" | "right" | "center";
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
  limit?: number;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  // Sorting Props
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  onNewClick?: () => void;
  newButtonText?: string;
  onExportCsv?: () => void;
  onExportXls?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onRowClick?: (item: T) => void;
  /** Enter en la fila: abre edición (ej: handleEdit). Escape cierra modales (manejado por HeroUI) */
  onRowKeyDown?: (item: T, key: string) => void;
  // Selección masiva
  enableSelection?: boolean;
  selectionMode?: "manual" | "all_matching";
  selectedKeys?: Set<Key>;
  onSelectionChange?: (keys: Set<string> | "all") => void;
  selectedCount?: number;
  totalCount?: number;
  canScaleToAll?: boolean;
  onScaleToAllMatching?: () => void;
  onBulkDelete?: () => void;
  onClearSelection?: () => void;
  /** Opciones del dropdown "Acciones masivas" (visibles solo con selección) */
  bulkActionsDropdown?: Array<{
    key: string;
    label: string;
    onClick: () => void;
  }>;
  /** Contenido extra al lado de la barra de búsqueda (ej: filtro Bajo stock) */
  extraSearchContent?: React.ReactNode;
  /** Mostrar opción "Todas" en el selector de filas */
  showAllOption?: boolean;
  /** Configuración de impresión */
  printConfig?: {
    title?: string;
    orientation?: "portrait" | "landscape";
    filters?: string;
  };
  /** Modo cards: cuando se provee renderCards, se muestra toggle tabla/cards */
  viewMode?: "table" | "cards";
  onViewModeChange?: (mode: "table" | "cards") => void;
  renderCards?: (item: T) => React.ReactNode;
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
  limit = 10,
  onLimitChange,
  limitOptions = [10, 30, 50, 100],
  showAllOption = true,
  sortDescriptor,
  onSortChange,
  onNewClick,
  newButtonText = "Nuevo",
  onExportCsv,
  onExportXls,
  onRefresh,
  isRefreshing = false,
  onRowClick,
  onRowKeyDown,
  enableSelection = false,
  selectionMode = "manual",
  selectedKeys,
  onSelectionChange,
  selectedCount = 0,
  totalCount = 0,
  canScaleToAll = false,
  onScaleToAllMatching,
  onBulkDelete,
  onClearSelection,
  bulkActionsDropdown,
  extraSearchContent,
  printConfig,
  viewMode = "table",
  onViewModeChange,
  renderCards,
}: GenericTableProps<T>) {
  const tablePrintRef = useRef<HTMLDivElement>(null);

  // Columnas visibles: ocultar "acciones" por defecto del selector (siempre visible en tabla)
  const selectableColumns = columns.filter((c) => c.uid !== "acciones");
  const [visibleUids, setVisibleUids] = useState<Set<string>>(
    () => new Set(columns.map((c) => c.uid)),
  );
  const visibleColumns = columns.filter((c) => visibleUids.has(c.uid));
  const printColumns = visibleColumns.filter((c) => c.uid !== "acciones");

  const NUMERIC_UIDS = new Set([
    "Stock",
    "StockMinimo",
    "Costo",
    "Minorista",
    "Mayorista",
    "CantidadProductos",
  ]);
  const CENTER_UIDS = new Set(["Estado"]);
  const getPrintAlign = (uid: string, col?: Column) =>
    col?.printAlign ??
    (NUMERIC_UIDS.has(uid)
      ? "right"
      : CENTER_UIDS.has(uid)
        ? "center"
        : "left");

  const handlePrint = useReactToPrint({
    contentRef: tablePrintRef,
    documentTitle: printConfig?.title ?? "Listado",
    onBeforePrint: async () => {
      const el = tablePrintRef.current;
      const dateEl = el?.querySelector("[data-print-date]");
      if (dateEl) dateEl.textContent = new Date().toLocaleString("es-AR");
    },
    pageStyle: getPrintPageStyle(printConfig?.orientation),
  });

  const ICON_SIZE = 18;
  const ICON_STROKE = 2;

  return (
    <section className="w-full h-full flex flex-col gap-4 overflow-hidden">
      <div className="rounded-lg flex flex-col gap-4 bg-white flex-1 w-full h-full p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        {/* Barra de herramientas: Búsqueda+Filtro | Botones - grilla 8px */}
        <section className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          {/* Búsqueda - más protagonista: ancho mayor, placeholder claro */}
          <div className="w-full sm:flex-1 sm:min-w-0 order-1 flex items-center gap-2">
            <div className="flex items-center gap-2 w-full min-w-0 sm:max-w-[400px]">
              <div className="flex-1 min-w-0">
                <div className="group flex items-center gap-2 border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50/50 transition-all duration-150 hover:border-[#67afc3] hover:bg-white focus-within:border-[#67afc3] focus-within:ring-2 focus-within:ring-[#67afc3]/35 focus-within:bg-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-slate-500 flex-shrink-0"
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
                    className="outline-none w-full bg-transparent text-slate-800 placeholder:text-slate-500 placeholder:font-normal text-sm"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    aria-label="Buscar en la tabla"
                  />
                </div>
              </div>
            </div>
            {extraSearchContent}
          </div>

          {/* Acciones - a la derecha, grilla 8px */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0 order-2">
            {onNewClick && (
              <button
                onClick={onNewClick}
                className="px-4 h-9 rounded-lg bg-[#67afc3] hover:bg-[#5a9db0] text-white font-medium text-sm shadow-sm transition-all duration-150 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={newButtonText}
              >
                {newButtonText}
              </button>
            )}

            <div
              className="hidden sm:block w-px h-6 bg-slate-200"
              aria-hidden
            />

            <div className="flex items-center gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-[#67afc3] text-slate-700 hover:text-[#67afc3] focus:outline-none focus:ring-2 focus:ring-[#67afc3]/40 transition-all duration-150 flex-shrink-0"
                    title="Exportar, Imprimir"
                    aria-label="Más opciones: Exportar, Imprimir"
                  >
                    <Menu
                      size={ICON_SIZE}
                      strokeWidth={ICON_STROKE}
                      aria-hidden="true"
                    />
                    <span className="hidden md:inline text-sm font-medium">
                      Más opciones
                    </span>
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Más opciones"
                  classNames={{
                    base: "min-w-[200px] p-2 rounded-lg shadow-lg border border-slate-200/80",
                    list: "p-1 gap-0.5",
                  }}
                  items={[
                    ...(onExportCsv
                      ? [
                          {
                            key: "exportar-csv",
                            label: "Exportar como CSV",
                            onPress: onExportCsv,
                            startContent: (
                              <Download size={16} strokeWidth={2} />
                            ),
                          },
                        ]
                      : []),
                    ...(onExportXls
                      ? [
                          {
                            key: "exportar-xls",
                            label: "Exportar como XLS",
                            onPress: onExportXls,
                            startContent: (
                              <FileSpreadsheet size={16} strokeWidth={2} />
                            ),
                          },
                        ]
                      : []),
                    {
                      key: "imprimir",
                      label: "Imprimir",
                      onPress: () => handlePrint(),
                      startContent: <Printer size={16} strokeWidth={2} />,
                    },
                  ].filter(Boolean)}
                >
                  {(item) => (
                    <DropdownItem
                      key={item.key}
                      startContent={item.startContent}
                      onPress={item.onPress}
                      className="rounded-md px-3 py-2 data-[hover=true]:bg-[#67afc3]/10 data-[focus=true]:bg-[#67afc3]/10"
                    >
                      {item.label}
                    </DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>
              {selectableColumns.length > 1 && (
                <Dropdown closeOnSelect={false}>
                  <DropdownTrigger>
                    <button
                      type="button"
                      className="p-2 h-9 w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-[#67afc3] text-slate-700 hover:text-[#67afc3] focus:outline-none focus:ring-2 focus:ring-[#67afc3]/40 transition-all duration-150 flex items-center justify-center flex-shrink-0"
                      title="Columnas visibles"
                      aria-label="Mostrar u ocultar columnas"
                    >
                      <Columns2
                        size={ICON_SIZE}
                        strokeWidth={ICON_STROKE}
                        aria-hidden="true"
                      />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Columnas visibles"
                    classNames={{
                      base: "min-w-[200px] p-2 rounded-lg shadow-lg border border-slate-200/80",
                      list: "p-1 gap-0.5",
                    }}
                  >
                    {selectableColumns.map((col) => (
                      <DropdownItem
                        key={col.uid}
                        textValue={col.name}
                        startContent={
                          visibleUids.has(col.uid) ? (
                            <Check
                              size={16}
                              strokeWidth={2}
                              className="text-[#67afc3] flex-shrink-0"
                            />
                          ) : (
                            <span className="w-4 inline-block" aria-hidden />
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
                        className="rounded-md px-3 py-2 data-[hover=true]:bg-[#67afc3]/10 data-[focus=true]:bg-[#67afc3]/10 data-[selected=true]:bg-[#67afc3]/15"
                      >
                        {col.name}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              {renderCards && onViewModeChange && (
                <div className="flex rounded-lg border border-slate-300 overflow-hidden flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onViewModeChange("table")}
                    className={`p-2 h-9 w-9 flex items-center justify-center transition-colors ${
                      viewMode === "table"
                        ? "bg-[#67afc3] text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    title="Vista tabla"
                    aria-label="Ver como tabla"
                  >
                    <TableIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewModeChange("cards")}
                    className={`p-2 h-9 w-9 flex items-center justify-center transition-colors ${
                      viewMode === "cards"
                        ? "bg-[#67afc3] text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    title="Vista cards"
                    aria-label="Ver como tarjetas"
                  >
                    <LayoutGrid size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                  </button>
                </div>
              )}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-2 h-9 w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-[#67afc3] text-slate-700 hover:text-[#67afc3] focus:outline-none focus:ring-2 focus:ring-[#67afc3]/40 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
                  title="Actualizar datos"
                  aria-label="Actualizar datos de la tabla"
                >
                  <RefreshCcw
                    size={ICON_SIZE}
                    strokeWidth={ICON_STROKE}
                    className={`transition-transform duration-150 ${isRefreshing ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </div>
        </section>

        {enableSelection && selectedCount >= 2 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-xl bg-[#67afc3]/10 border border-[#67afc3]/40 text-sm">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-slate-900">
                {selectionMode === "manual"
                  ? `${selectedCount} elemento${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}`
                  : `${selectedCount} seleccionado${selectedCount !== 1 ? "s" : ""}${totalCount - selectedCount > 0 ? ` (${totalCount - selectedCount} excluido${totalCount - selectedCount !== 1 ? "s" : ""})` : ""}`}
              </span>
              {canScaleToAll && onScaleToAllMatching && (
                <button
                  type="button"
                  onClick={onScaleToAllMatching}
                  className="text-left text-[#67afc3] hover:underline font-medium text-xs"
                >
                  ¿Seleccionar los {totalCount} resultados?
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              {onClearSelection && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="px-3 py-2 rounded-lg text-[#67afc3] hover:bg-[#67afc3]/15 font-medium transition-colors duration-150"
                >
                  Deseleccionar todo
                </button>
              )}
              {bulkActionsDropdown && bulkActionsDropdown.length > 0 && (
                <Dropdown>
                  <DropdownTrigger>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg font-medium transition-all duration-150 flex items-center gap-2 bg-[#67afc3] hover:bg-[#5a9db0] text-white focus:outline-none focus:ring-2 focus:ring-[#67afc3]/40"
                    >
                      Acciones masivas
                      <ChevronDown size={16} strokeWidth={2} />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Acciones masivas"
                    classNames={{
                      base: "min-w-[180px] p-2 rounded-lg shadow-lg border border-slate-200/80",
                      list: "p-1 gap-0.5",
                    }}
                  >
                    {bulkActionsDropdown.map((item) => (
                      <DropdownItem
                        key={item.key}
                        onPress={item.onClick}
                        textValue={item.label}
                        className="rounded-md px-3 py-2 data-[hover=true]:bg-[#67afc3]/10"
                      >
                        {item.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              {onBulkDelete && (
                <button
                  type="button"
                  onClick={onBulkDelete}
                  className="px-3 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white font-medium transition-all duration-150"
                >
                  Eliminar seleccionados
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table/Cards + Pagination */}
        <div className="w-full overflow-hidden flex-1 flex flex-col h-full rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="flex-1 min-h-0 overflow-auto overflow-x-auto">
            {viewMode === "cards" && renderCards ? (
              isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-slate-200 animate-pulse" />
                  ))}
                </div>
              ) : isError ? (
                <div className="text-danger flex justify-center py-12" role="alert">
                  Error al cargar datos
                </div>
              ) : data.length === 0 ? (
                <div className="text-slate-600 text-center py-12" role="status">
                  {emptyText}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                  {data.map((item) => (
                    <div key={String(item.Id)}>{renderCards(item)}</div>
                  ))}
                </div>
              )
            ) : (
            <Table
              aria-label="Tabla de datos"
              sortDescriptor={sortDescriptor}
              onSortChange={onSortChange}
              selectionMode={enableSelection && !isLoading ? "multiple" : "none"}
              {...(enableSelection &&
                !isLoading && {
                  selectedKeys: new Set(
                    Array.from(selectedKeys ?? []).map((k) => String(k)),
                  ) as any,
                  onSelectionChange: (keys: unknown) => {
                    if (onSelectionChange) {
                      if (keys === "all") {
                        onSelectionChange("all");
                      } else {
                        const raw =
                          keys instanceof Set
                            ? keys
                            : new Set((keys as Iterable<Key>) ?? []);
                        onSelectionChange(
                          new Set(Array.from(raw).map((k) => String(k))),
                        );
                      }
                    }
                  },
                })}
              className="bg-white rounded-lg border-none"
              classNames={{
                wrapper: "bg-white h-full shadow-none rounded-xl border-none sm:p-4 p-2",
                th: "bg-[#67afc3] text-white text-[13px] font-semibold border-b border-slate-200/60",
                base: "bg-transparent h-full shadow-none rounded-xl border-none",
                td: "border-b border-slate-200/80 text-slate-800",
                tr: "group transition-all duration-200 data-[hover=true]:bg-slate-50 data-[hover=true]:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] data-[hover=true]:relative data-[hover=true]:z-10 data-[selected=true]:bg-[#67afc3]/15 data-[selected=true]:[&>td]:border-[#67afc3]/20",
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
                      className="text-slate-600 text-center py-8"
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

                  // Fila normal con datos - hover/focus más visibles
                  return (
                    <TableRow
                      key={String(item.Id)}
                      className="transition-colors duration-150 focus-within:bg-slate-50/80"
                      tabIndex={0}
                      aria-label={`Fila ${item.Id}`}
                      onClick={onRowClick ? () => onRowClick(item) : undefined}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && onRowKeyDown) {
                          e.preventDefault();
                          onRowKeyDown(item, "Enter");
                        }
                      }}
                      style={
                        onRowClick || onRowKeyDown
                          ? { cursor: "pointer" }
                          : undefined
                      }
                    >
                      {(columnKey) => (
                        <TableCell
                          className=""
                          onClick={
                            columnKey === "acciones"
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                        >
                          {renderCell(item, columnKey)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-200/80 bg-slate-50/50 rounded-b-xl print:hidden">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                {/* Conteo de registros - alineado a la izquierda */}
                <span className="text-slate-700 font-medium text-sm min-w-[160px]">
                  {`${data.length} de ${paginationMeta.total} registros`}
                </span>

                {/* Paginación centrada */}
                <div className="flex-1 flex justify-center">
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
                  />
                </div>

                {/* Selector de filas por página - alineado a la derecha */}
                {onLimitChange && (
                  <div className="flex justify-end min-w-[140px]">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <span>Filas:</span>
                      <select
                        value={limit}
                        onChange={(e) => {
                          const v = e.target.value;
                          onLimitChange(v === "all" ? 9999 : Number(v));
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#67afc3] focus:outline-none focus:ring-2 focus:ring-[#67afc3]/35 transition-all duration-150"
                        aria-label="Cantidad de filas por página"
                      >
                        {limitOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                        {showAllOption && <option value={9999}>Todas</option>}
                      </select>
                    </label>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabla de impresión dedicada: oculta en pantalla, visible al imprimir */}
      <div
        ref={tablePrintRef}
        className="table-print-source w-[210mm] min-w-0 bg-white"
        style={{ width: "210mm" }}
        aria-hidden="true"
      >
        <div className="table-print-header">
          <h1>{printConfig?.title ?? "Listado"}</h1>
          <div className="meta">
            <span data-print-date="">—</span>
            {printConfig?.filters && ` • ${printConfig.filters}`}
          </div>
        </div>
        {printColumns.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {printColumns.map((col) => (
                      <th
                        key={col.uid}
                        data-align={getPrintAlign(col.uid, col)}
                      >
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!isLoading && !isError && data.length > 0 ? (
                    data.map((item, idx) => (
                      <tr key={String(item.Id)}>
                        {printColumns.map((col) => (
                          <td
                            key={col.uid}
                            data-align={getPrintAlign(col.uid, col)}
                            className={
                              col.uid === "Estado" ? "print-status" : ""
                            }
                          >
                            {renderCell(item, col.uid)}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={printColumns.length}
                        style={{
                          textAlign: "center",
                          padding: "16px",
                          color: "#64748b",
                        }}
                      >
                        {isLoading ? "Cargando..." : emptyText}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p style={{ color: "#64748b", fontSize: "11px" }}>
            Sin columnas para imprimir
          </p>
        )}
      </div>
    </section>
  );
}
