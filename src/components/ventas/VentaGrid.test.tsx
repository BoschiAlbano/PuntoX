/**
 * Tests para VentaGrid
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VentaGrid from "./VentaGrid";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return {
    ...actual,
    addToast: vi.fn(),
  };
});

// Mock parcial: íconos reales salvo Trash2, que se identifica por testid.
vi.mock("lucide-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("lucide-react")>()),
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

  it("muestra el estado vacío (sin tabla) cuando no hay items", () => {
    renderWithProviders(
      <VentaGrid items={[]} onUpdateQuantity={vi.fn()} onRemoveItem={vi.fn()} />
    );
    expect(screen.getByText("Sin productos")).toBeInTheDocument();
    expect(
      screen.getByText("Escanea o busca un producto para comenzar")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Detalle de venta")).toBeNull();
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

    // Hay una lista mobile y una tabla desktop; se verifica la tabla.
    const tabla = within(screen.getByLabelText("Detalle de venta"));
    expect(tabla.getByText("Producto Test")).toBeInTheDocument();
    expect(tabla.getByText("012345")).toBeInTheDocument();
  });

  it("muestra columnas de la tabla cuando hay items", () => {
    renderWithProviders(
      <VentaGrid
        items={[
          {
            Id: 1,
            Codigo: "1",
            Descripcion: "X",
            cantidad: 1,
            precio: 10,
            subtotal: 10,
            TipoVenta: "UNIDAD",
            DescuentaStock: false,
            PermiteStockNegativo: false,
            Stock: 10,
          },
        ] as any}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );
    const tabla = within(screen.getByLabelText("Detalle de venta"));
    for (const col of ["CÓDIGO", "DESCRIPCIÓN", "CANT.", "PRECIO", "DTO %", "SUBTOTAL"]) {
      expect(tabla.getByText(col)).toBeInTheDocument();
    }
  });
});
