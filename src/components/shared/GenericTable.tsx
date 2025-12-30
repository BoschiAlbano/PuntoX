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
import { useEffect, useState, Key } from "react";
import { RefreshCw } from "lucide-react";
import { PaginationMeta } from "@/hooks/useProductos"; // Reutilizamos interface o la movemos a types compartidos

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

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  return (
    <section className="w-full h-full flex flex-col gap-4 overflow-hidden px-2">
      <div className="rounded-lg flex flex-col gap-4 items-center">
        {/* Header & Search */}
        <section className="w-full flex items-center justify-end gap-2">
          {/* Boton nuevo */}
          {onNewClick && (
            <button
              onClick={onNewClick}
              className="bg-[#67afc3] text-white px-4 py-1 rounded-lg hover:bg-[#529aa6] transition-colors"
            >
              {newButtonText}
            </button>
          )}
          {/* Botón de actualizar */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-[#67afc3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar datos"
            >
              <RefreshCw
                size={18}
                className={`text-gray-600 transition-transform ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          )}
          {/* Search */}
          <div className="group flex items-center gap-2 border border-gray-300 rounded-xl p-1 transition-all focus-within:border-[#67afc3] focus-within:ring-[#67afc3]">
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="outline-none px-2 bg-transparent"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5 text-gray-500 transition-colors group-focus-within:text-[#67afc3]"
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
        <Table
          aria-label="Tabla de datos"
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.align || "start"}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={data}
            emptyContent={
              isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : isError ? (
                <div className="text-danger flex justify-center py-4">
                  Error al cargar datos
                </div>
              ) : (
                emptyText
              )
            }
          >
            {(item) => (
              <TableRow key={item.Id}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="rounded-lg flex flex-col items-center">
        {!isLoading && !isError && (
          <Pagination
            showControls
            page={page}
            total={paginationMeta.totalPages}
            onChange={onPageChange}
            classNames={{
              cursor: "bg-[#67afc3] text-white shadow-lg",
              item: "bg-transparent shadow-none",
            }}
          />
        )}
      </div>
    </section>
  );
}
