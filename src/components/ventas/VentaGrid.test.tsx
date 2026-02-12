/**
 * Tests para VentaGrid
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VentaGrid from "./VentaGrid";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return {
    ...actual,
    addToast: vi.fn(),
  };
});

vi.mock("lucide-react", () => ({
  Trash2: () => <div data-testid="trash-icon" />,
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("VentaGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza tabla vacía cuando no hay items", () => {
    renderWithProviders(
      <VentaGrid items={[]} onUpdateQuantity={vi.fn()} onRemoveItem={vi.fn()} />
    );
    expect(
      screen.getByText("Escanea o busca productos para comenzar.")
    ).toBeInTheDocument();
  });

  it("renderiza items con datos correctos", () => {
    const mockItems = [
      {
        Id: 1,
        Codigo: "12345",
        Descripcion: "Producto Test",
        cantidad: 2,
        precio: 100,
        subtotal: 200,
        TipoVenta: "UNIDAD",
        DescuentaStock: false,
        PermiteStockNegativo: false,
        Stock: 10,
      },
    ];

    renderWithProviders(
      <VentaGrid
        items={mockItems}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    expect(screen.getByText("Producto Test")).toBeInTheDocument();
    expect(screen.getByText("012345")).toBeInTheDocument();
  });

  it("muestra columnas de la tabla", () => {
    renderWithProviders(
      <VentaGrid items={[]} onUpdateQuantity={vi.fn()} onRemoveItem={vi.fn()} />
    );

    expect(screen.getByText("CODIGO")).toBeInTheDocument();
    expect(screen.getByText("DESCRIPCION")).toBeInTheDocument();
    expect(screen.getByText("CANTIDAD")).toBeInTheDocument();
    expect(screen.getByText("PRECIO UNIT.")).toBeInTheDocument();
    expect(screen.getByText("SUBTOTAL")).toBeInTheDocument();
    expect(screen.getByText("ACCIONES")).toBeInTheDocument();
  });
});
