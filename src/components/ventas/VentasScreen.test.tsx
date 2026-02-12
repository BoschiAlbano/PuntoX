/**
 * Tests para VentasScreen
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VentasScreen from "./VentasScreen";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return {
    ...actual,
    addToast: vi.fn(),
    Modal: ({ children }: any) => <div data-testid="modal">{children}</div>,
    ModalContent: ({ children }: any) => <div>{children}</div>,
    ModalHeader: () => null,
    ModalBody: () => null,
    ModalFooter: () => null,
  };
});

vi.mock("@/store/ventaStore", () => ({
  useVentaStore: vi.fn(() => ({
    items: [],
    cliente: { Id: 0, Nombre: "Consumidor Final" },
    tipoComprobante: 2,
    listaPrecios: 1,
    descuentoPorcentaje: 0,
    addItem: vi.fn(),
    updateItemQuantity: vi.fn(),
    removeItem: vi.fn(),
    setCliente: vi.fn(),
    setTipoComprobante: vi.fn(),
    setListaPrecios: vi.fn(),
    setDescuentoPorcentaje: vi.fn(),
    numeroComprobanteAsociado: null,
    setNumeroComprobanteAsociado: vi.fn(),
    clearVenta: vi.fn(),
  })),
}));

vi.mock("./ProductSearch", () => ({
  default: () => <div data-testid="product-search" />,
}));

vi.mock("./VentaGrid", () => ({
  default: () => <div data-testid="venta-grid" />,
}));

vi.mock("./VentaFooter", () => ({
  default: () => <div data-testid="venta-footer" />,
}));

vi.mock("./ClienteSearch", () => ({
  default: () => <div data-testid="cliente-search" />,
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("VentasScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza sin crash", () => {
    renderWithProviders(<VentasScreen />);
    expect(screen.getByTestId("venta-grid")).toBeInTheDocument();
  });

  it("muestra el selector de comprobante", () => {
    renderWithProviders(<VentasScreen />);
    expect(screen.getByText("Comprobante")).toBeInTheDocument();
  });

  it("muestra el selector de lista de precios", () => {
    renderWithProviders(<VentasScreen />);
    expect(screen.getByText("L1: General")).toBeInTheDocument();
  });
});
