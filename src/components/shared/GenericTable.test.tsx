/**
 * Tests para el componente GenericTable.
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import GenericTable, { Column } from "./GenericTable";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return { ...actual, addToast: vi.fn() };
});

vi.mock("react-to-print", () => ({
  useReactToPrint: () => vi.fn(),
}));

vi.mock("lucide-react", () => ({
  Check: () => <span data-testid="icon-check" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  Columns2: () => <span data-testid="icon-columns" />,
  Download: () => <span data-testid="icon-download" />,
  FileSpreadsheet: () => <span data-testid="icon-file-spreadsheet" />,
  Menu: () => <span data-testid="icon-menu" />,
  Printer: () => <span data-testid="icon-printer" />,
  RefreshCcw: () => <span data-testid="icon-refresh" />,
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: vi.fn((val: string) => val),
}));

vi.mock("@/hooks/useProductos", () => ({
  PaginationMeta: {},
}));

describe("GenericTable", () => {
  const mockColumns: Column[] = [
    { uid: "id", name: "ID" },
    { uid: "name", name: "Nombre" },
  ];

  const mockData = [
    { Id: 1, name: "Item 1" },
    { Id: 2, name: "Item 2" },
  ];

  const mockRenderCell = (item: typeof mockData[0], columnKey: string | number) => {
    if (columnKey === "id") return item.Id;
    if (columnKey === "name") return item.name;
    return null;
  };

  const defaultProps = {
    data: mockData,
    columns: mockColumns,
    renderCell: mockRenderCell,
    isLoading: false,
    isError: false,
    search: "",
    onSearchChange: vi.fn(),
    page: 1,
    onPageChange: vi.fn(),
    paginationMeta: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.innerWidth
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("renderiza búsqueda y tabla", () => {
    render(<GenericTable {...defaultProps} />);

    const searchInput = screen.getByLabelText("Buscar en la tabla");
    expect(searchInput).toBeInTheDocument();

    const table = screen.getByLabelText("Tabla de datos");
    expect(table).toBeInTheDocument();
  });

  it("muestra texto vacío cuando no hay datos", () => {
    const emptyText = "No hay registros disponibles";
    render(
      <GenericTable
        {...defaultProps}
        data={[]}
        emptyText={emptyText}
      />
    );

    expect(screen.getByText(emptyText)).toBeInTheDocument();
  });

  it("muestra botón Nuevo cuando onNewClick es proporcionado", () => {
    const onNewClick = vi.fn();
    render(<GenericTable {...defaultProps} onNewClick={onNewClick} />);

    const newButton = screen.getByLabelText("Nuevo");
    expect(newButton).toBeInTheDocument();
  });

  it("renderiza datos en la tabla", () => {
    render(<GenericTable {...defaultProps} />);

    const table = screen.getByRole("grid", { name: "Tabla de datos" });
    expect(table).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });
});
