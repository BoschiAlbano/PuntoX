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
import { useState, useRef, Key, useEffect } from "react";
import {
  Check,
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
      border-left: 4px solid var(--crud-accent); border-radius: 4px;
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
      background: linear-gradient(180deg, var(--crud-accent) 0%, var(--crud-accent-hover) 100%) !important;
      color: white !important; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;
      padding: 10px 12px; border: none; border-bottom: 2px solid var(--crud-accent-print-dark);
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
  /** Exportar todos los datos visibles como CSV */
  onExportCsv?: () => void;
  /** Exportar todos los datos visibles como XLS */
  onExportXls?: () => void;
  /** Exportar solo los ítems seleccionados como CSV */
  onExportCsvSelected?: () => void;
  /** Exportar solo los ítems seleccionados como XLS */
  onExportXlsSelected?: () => void;
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
  /** Ítems seleccionados actuales (para imprimir/exportar seleccionados) */
  selectedItems?: T[];
  onBulkDelete?: () => void;
  onClearSelection?: () => void;
  /** Opciones del dropdown "Más opciones" visibles cuando hay selección */
  bulkActionsDropdown?: Array<{
    key: string;
    label: string;
    onClick: () => void;
  }>;
  /** Contenido extra al lado de la barra de búsqueda (ej: filtro Bajo stock) */
  extraSearchContent?: React.ReactNode;
  /** Contenido extra en el lado derecho de la barra de herramientas (ej: filtros de fecha) */
  extraRightContent?: React.ReactNode;
  /** Mostrar opción "Todas" en el selector de filas */
  showAllOption?: boolean;
  /** Configuración de impresión */
  printConfig?: {
    title?: string;
    orientation?: "portrait" | "landscape";
    filters?: string;
  };
  /** Columnas opcionales forzadas por defecto en modo celular */
  defaultVisibleUidsMobile?: string[];
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
  onExportCsvSelected,
  onExportXlsSelected,
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
  selectedItems,
  onBulkDelete,
  onClearSelection,
  bulkActionsDropdown,
  extraSearchContent,
  extraRightContent,
  printConfig,
  defaultVisibleUidsMobile,
  viewMode = "table",
  onViewModeChange,
  renderCards,
}: GenericTableProps<T>) {
  const tablePrintRef = useRef<HTMLDivElement>(null);

  // Columnas visibles: ocultar "acciones" por defecto del selector (siempre visible en tabla)
  const selectableColumns = columns.filter((c) => c.uid !== "acciones");
  const [visibleUids, setVisibleUids] = useState<Set<string>>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      if (defaultVisibleUidsMobile && defaultVisibleUidsMobile.length > 0) {
        return new Set(defaultVisibleUidsMobile);
      }
      const defaultDesc =
        columns.find((c) => c.uid.toLowerCase() === "descripcion") ||
        columns.find((c) => c.uid !== "acciones" && c.uid !== "Id");
      const initial = new Set<string>();
      if (defaultDesc) initial.add(defaultDesc.uid);
      if (columns.some((c) => c.uid === "acciones")) initial.add("acciones");
      return initial.size > 0 ? initial : new Set(columns.map((c) => c.uid));
    }
    return new Set(columns.map((c) => c.uid));
  });
  const visibleColumns = columns.filter((c) => visibleUids.has(c.uid));
  const printColumns = visibleColumns.filter((c) => c.uid !== "acciones");

  // Cuando se agreguen columnas dinámicas (ej. listas de precios cargadas async),
  // añadirlas a visibleUids solo en desktop. En mobile se respeta defaultVisibleUidsMobile.
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    if (isMobile) return;
    setVisibleUids((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const col of columns) {
        if (!next.has(col.uid)) {
          next.add(col.uid);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [columns]);

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

  // items a imprimir: si hay selección activa, solo los seleccionados
  const printData =
    selectedCount > 0 && selectedItems && selectedItems.length > 0
      ? selectedItems
      : data;

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
    <section className="w-full flex flex-col gap-4 flex-1">
      <div className="rounded-lg flex flex-col gap-4 bg-[#F5F8FD] w-full flex-1">
        {/* Barra de herramientas: Búsqueda+Filtro | Botones - grilla 8px */}
        <section className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-2 sm:p-4 rounded-xl bg-[#F5F8FD]">
          {/* Búsqueda - más protagonista: ancho mayor, placeholder claro */}
          <div className="w-full sm:flex-1 sm:min-w-0 order-1 flex flex-row flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0 sm:max-w-[400px]">
              <div className="flex-1 min-w-0">
                <div className="group flex items-center gap-2 border border-slate-300 rounded-lg px-3 sm:px-4 h-10 sm:h-9 bg-white transition-all duration-150 hover:border-[var(--crud-accent)] hover:bg-white focus-within:border-[var(--crud-accent)] focus-within:ring-2 focus-within:ring-[var(--crud-accent)]/35 focus-within:bg-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-slate-500 shrink-0"
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
          <div className="flex items-center gap-2 sm:gap-3 sm:flex-shrink-0 order-2 sm:order-3 w-full sm:w-auto">
            {onNewClick && (
              <button
                onClick={onNewClick}
                className="flex-1 sm:flex-none px-4 h-10 sm:h-9 rounded-lg bg-[var(--crud-accent)] hover:bg-[var(--crud-accent-hover)] text-white font-medium text-sm shadow-sm transition-all duration-150 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
                aria-label={newButtonText}
              >
                {newButtonText}
              </button>
            )}

            <div
              className="hidden sm:block w-px h-6 bg-slate-200 shrink-0"
              aria-hidden
            />

            <div className="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start">
              <Dropdown>
                <DropdownTrigger>
                  {/* Wrapper relativo para el badge de selección */}
                  <div className="relative inline-flex flex-shrink-0">
                    <button
                      type="button"
                      className="flex items-center justify-center sm:justify-start gap-2 px-3 w-auto h-10 sm:h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-[var(--crud-accent)] text-slate-700 hover:text-[var(--crud-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--crud-accent)]/40 transition-all duration-150"
                      title={
                        selectedCount > 0
                          ? `Más opciones (${selectedCount} seleccionados)`
                          : "Exportar, Imprimir"
                      }
                      aria-label={
                        selectedCount > 0
                          ? `Más opciones: ${selectedCount} seleccionados`
                          : "Más opciones: Exportar, Imprimir"
                      }
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
                    {/* Badge de selección activa */}
                    {selectedCount > 0 && (
                      <span
                        className="pointer-events-none absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[var(--crud-accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm ring-2 ring-white"
                        aria-hidden="true"
                      >
                        {selectedCount > 99 ? "99+" : selectedCount}
                      </span>
                    )}
                  </div>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Más opciones"
                  classNames={{
                    base: "min-w-[220px] p-2 rounded-lg shadow-lg border border-slate-200/80",
                    list: "p-1 gap-0.5",
                  }}
                  items={(() => {
                    // Build a flat array of menu item descriptors
                    type MenuItem = {
                      key: string;
                      label: string;
                      icon?: React.ReactNode;
                      className?: string;
                      onPress?: () => void;
                      isSeparator?: boolean;
                      textValue?: string;
                    };
                    const items: MenuItem[] = [];

                    // ── Exportar / Imprimir (always visible, smart) ──
                    const csvPressHandler =
                      selectedCount > 0 && onExportCsvSelected
                        ? onExportCsvSelected
                        : onExportCsv;
                    if (csvPressHandler) {
                      items.push({
                        key: "exportar-csv",
                        label:
                          selectedCount > 0
                            ? `Exportar CSV (${selectedCount} sel.)`
                            : "Exportar como CSV",
                        icon: <Download size={16} strokeWidth={2} />,
                        className:
                          "rounded-md px-3 py-2 data-[hover=true]:bg-[var(--crud-accent)]/10 data-[focus=true]:bg-[var(--crud-accent)]/10",
                        onPress: csvPressHandler,
                      });
                    }
                    const xlsPressHandler =
                      selectedCount > 0 && onExportXlsSelected
                        ? onExportXlsSelected
                        : onExportXls;
                    if (xlsPressHandler) {
                      items.push({
                        key: "exportar-xls",
                        label:
                          selectedCount > 0
                            ? `Exportar XLS (${selectedCount} sel.)`
                            : "Exportar como XLS",
                        icon: <FileSpreadsheet size={16} strokeWidth={2} />,
                        className:
                          "rounded-md px-3 py-2 data-[hover=true]:bg-[var(--crud-accent)]/10 data-[focus=true]:bg-[var(--crud-accent)]/10",
                        onPress: () => handlePrint(),
                      });
                    }
                    items.push({
                      key: "imprimir",
                      label:
                        selectedCount > 0
                          ? `Imprimir (${selectedCount} sel.)`
                          : "Imprimir",
                      icon: <Printer size={16} strokeWidth={2} />,
                      className:
                        "rounded-md px-3 py-2 data-[hover=true]:bg-[var(--crud-accent)]/10 data-[focus=true]:bg-[var(--crud-accent)]/10",
                      onPress: () => handlePrint(),
                    });

                    // ── Bulk actions (only when items are selected) ──
                    if (
                      selectedCount > 0 &&
                      bulkActionsDropdown &&
                      bulkActionsDropdown.length > 0
                    ) {
                      items.push({
                        key: "sep-bulk",
                        label: " ",
                        textValue: "separador",
                        isSeparator: true,
                        className:
                          "h-px bg-slate-200 rounded-none my-1 p-0 data-[hover=true]:bg-slate-200",
                      });
                      bulkActionsDropdown.forEach((a) => {
                        items.push({
                          key: a.key,
                          label: a.label,
                          className:
                            "rounded-md px-3 py-2 data-[hover=true]:bg-[var(--crud-accent)]/10",
                          onPress: a.onClick,
                        });
                      });
                    }

                    if (selectedCount > 0 && onBulkDelete) {
                      items.push({
                        key: "sep-delete",
                        label: " ",
                        textValue: "separador",
                        isSeparator: true,
                        className:
                          "h-px bg-slate-200 rounded-none my-1 p-0 data-[hover=true]:bg-slate-200",
                      });
                      items.push({
                        key: "eliminar-sel",
                        label: `Eliminar ${selectedCount} seleccionado${selectedCount !== 1 ? "s" : ""}`,
                        className:
                          "rounded-md px-3 py-2 text-red-600 data-[hover=true]:bg-red-50 data-[focus=true]:bg-red-50 font-medium",
                        onPress: onBulkDelete,
                      });
                    }

                    if (selectedCount > 0 && onClearSelection) {
                      items.push({
                        key: "sep-clear",
                        label: " ",
                        textValue: "separador",
                        isSeparator: true,
                        className:
                          "h-px bg-slate-200 rounded-none my-1 p-0 data-[hover=true]:bg-slate-200",
                      });
                      items.push({
                        key: "deseleccionar",
                        label: "Deseleccionar todo",
                        className:
                          "rounded-md px-3 py-2 text-slate-600 data-[hover=true]:bg-slate-100 data-[focus=true]:bg-slate-100",
                        onPress: onClearSelection,
                      });
                    }

                    return items;
                  })()}
                >
                  {(item) => (
                    <DropdownItem
                      key={item.key}
                      isReadOnly={item.isSeparator}
                      startContent={!item.isSeparator ? item.icon : undefined}
                      onPress={!item.isSeparator ? item.onPress : undefined}
                      textValue={item.textValue ?? item.label}
                      className={item.className ?? ""}
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
                      className="p-2 h-10 w-10 sm:h-9 sm:w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-[var(--crud-accent)] text-slate-700 hover:text-[var(--crud-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--crud-accent)]/40 transition-all duration-150 flex items-center justify-center flex-shrink-0"
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
                              className="text-[var(--crud-accent)] flex-shrink-0"
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
                        className="rounded-md px-3 py-2 data-[hover=true]:bg-[var(--crud-accent)]/10 data-[focus=true]:bg-[var(--crud-accent)]/10 data-[selected=true]:bg-[var(--crud-accent)]/15"
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
                    className={`p-2 h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center transition-colors ${
                      viewMode === "table"
                        ? "bg-[var(--crud-accent)] text-white"
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
                    className={`p-2 h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center transition-colors ${
                      viewMode === "cards"
                        ? "bg-[var(--crud-accent)] text-white"
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
                  className="p-2 h-10 w-10 sm:h-9 sm:w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-[var(--crud-accent)] text-slate-700 hover:text-[var(--crud-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--crud-accent)]/40 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
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
          {/* Filtros extra — fila propia en mobile (order-3), entre search y botones en desktop (sm:order-2) */}
          {extraRightContent && (
            <div className="order-3 sm:order-2 sm:flex-shrink-0 w-full sm:w-auto">
              {extraRightContent}
            </div>
          )}
        </section>

        {/* Barra de selección masiva eliminada — acciones movidas al menú "Más opciones" */}

        {/* Table/Cards + Pagination */}
          <div className="w-full flex flex-col rounded-xl bg-[#F5F8FD] flex-1">
          <div className="overflow-x-auto flex-1">
            {viewMode === "cards" && renderCards ? (
              isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-slate-200 animate-pulse"
                    />
                  ))}
                </div>
              ) : isError ? (
                <div
                  className="text-danger flex justify-center py-12"
                  role="alert"
                >
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
              // @ts-ignore
              <Table
                aria-label="Tabla de datos"
                sortDescriptor={sortDescriptor}
                onSortChange={onSortChange}
                selectionMode={
                  enableSelection && !isLoading ? "multiple" : "none"
                }
                {...(enableSelection &&
                  !isLoading && {
                    selectedKeys: new Set(
                      Array.from(selectedKeys ?? []).map((k) => String(k)),
                    ) as unknown as Set<Key>,
                    onSelectionChange: (keys: unknown) => {
                      if (!onSelectionChange) return;
                      if (keys === "all") {
                        onSelectionChange(
                          new Set(data.map((d) => String(d.Id))),
                        );
                      } else {
                        const raw =
                          keys instanceof Set
                            ? keys
                            : new Set((keys as Iterable<Key>) ?? []);
                        onSelectionChange(
                          new Set(Array.from(raw).map((k) => String(k))),
                        );
                      }
                    },
                    // Disable row-click selection: only the checkbox should trigger it
                    onRowAction: () => {},
                  })}
                className="bg-[#F5F8FD] rounded-lg border-none"
                classNames={{
                  wrapper:
                    "bg-[#F5F8FD] shadow-none rounded-xl border-none sm:p-4 p-1",
                  th: "bg-[var(--crud-accent)] text-white text-[11px] sm:text-[13px] font-semibold border-b border-slate-200/60 px-2 sm:px-4",
                  base: "bg-transparent shadow-none rounded-xl border-none",
                  td: "border-b border-slate-200/80 text-slate-800 text-[12px] sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2.5",
                  tr: "group transition-all duration-200 data-[hover=true]:bg-[#FFF3EA] data-[hover=true]:relative data-[hover=true]:z-10 data-[selected=true]:bg-[var(--crud-accent)]/15",
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

                    return (
                      <TableRow
                        key={String(item.Id)}
                        className="transition-colors duration-150 focus-within:bg-slate-50/80"
                        tabIndex={0}
                        aria-label={`Fila ${item.Id}`}
                        onClick={
                          onRowClick ? () => onRowClick(item) : undefined
                        }
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-2 sm:p-4 bg-[#F5F8FD] rounded-b-xl print:hidden">
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
                <span className="text-[var(--crud-accent)]/90 w-full sm:text-start text-center sm:pl-2 pl-0 text-sm sm:absolute relative bottom-0 flex flex-col sm:items-start items-center">
                  {/* {`${paginationMeta.limit} de ${paginationMeta.total} registros totales`} */}
                  <Skeleton className="rounded-medium w-[120px] h-4 opacity-50 ">
                    <div className="h-4 w-[120px] rounded-medium bg-default-200" />
                  </Skeleton>
                </span>
              </section>
            ) : !isLoading && !isError ? (
              <>
                <span className="text-slate-700 font-medium text-xs sm:text-sm">
                  {`${data.length} de ${paginationMeta.total} registros`}
                </span>
                <div className="flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  {onLimitChange && (
                    <label className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 w-full sm:w-auto">
                      <span className="whitespace-nowrap">Filas:</span>
                      <select
                        value={limit}
                        onChange={(e) => {
                          const v = e.target.value;
                          onLimitChange(v === "all" ? 9999 : Number(v));
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-2 sm:px-3 h-9 text-xs sm:text-sm text-slate-800 focus:border-[var(--crud-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--crud-accent)]/35 transition-all duration-150"
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
                  )}
                  <Pagination
                    showControls
                    page={page}
                    total={paginationMeta.totalPages}
                    onChange={onPageChange}
                    size="sm"
                    classNames={{
                      base: "w-full flex justify-center sm:w-auto",
                      cursor: "bg-[var(--crud-accent)]/90 text-white shadow-none",
                      item: "bg-transparent shadow-none cursor-pointer text-xs sm:text-sm",
                      next: "cursor-pointer",
                      prev: "cursor-pointer",
                      wrapper: "gap-0.5 sm:gap-1",
                    }}
                  />
                </div>
              </>
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
                  {!isLoading && !isError && printData.length > 0 ? (
                    printData.map((item) => (
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
