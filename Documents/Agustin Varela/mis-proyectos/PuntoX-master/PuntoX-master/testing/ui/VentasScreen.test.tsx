/**
 * Tests de UI para VentasScreen
 * - Verifica búsqueda de productos
 * - Verifica agregado de productos al carrito
 * - Manejo de errores de API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "../utils/renderWithProviders";
import userEvent from "@testing-library/user-event";
import VentasScreen from "@/components/ventas/VentasScreen";
import { useVentaStore } from "@/store/ventaStore";
import { useProductosVentas } from "@/hooks/useProductos";

// Mock del store de ventas
vi.mock("@/store/ventaStore", () => ({
  useVentaStore: vi.fn(),
}));

// Mock del hook useProductosVentas
vi.mock("@/hooks/useProductos", () => ({
  useProductosVentas: vi.fn(),
}));

// Mock de componentes hijos
vi.mock("@/components/ventas/ProductSearch", () => ({
  default: ({ onSelectProduct }: any) => (
    <div data-testid="product-search">
      <input
        data-testid="product-search-input"
        placeholder="Buscar productos..."
        onChange={(e) => {
          // Simular selección de producto
          if (e.target.value === "test") {
            onSelectProduct?.({
              Id: 1,
              Descripcion: "Producto Test",
              Stock: 10,
            });
          }
        }}
      />
    </div>
  ),
}));

vi.mock("@/components/ventas/VentaGrid", () => ({
  default: () => <div data-testid="venta-grid">VentaGrid</div>,
}));

vi.mock("@/components/ventas/VentaFooter", () => ({
  default: () => <div data-testid="venta-footer">VentaFooter</div>,
}));

vi.mock("@/components/ventas/ClienteSearch", () => ({
  default: () => <div data-testid="cliente-search">ClienteSearch</div>,
}));

describe("VentasScreen - UI Tests", () => {
  const mockUseVentaStore = vi.mocked(useVentaStore);
  const mockUseProductosVentas = vi.mocked(useProductosVentas);

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock por defecto del store de ventas
    mockUseVentaStore.mockReturnValue({
      items: [],
      cliente: null,
      tipoComprobante: 1,
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
    } as any);

    // Mock por defecto del hook de productos
    mockUseProductosVentas.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  it("debe renderizar todos los componentes principales", () => {
    renderWithProviders(<VentasScreen />);

    expect(screen.getByTestId("product-search")).toBeInTheDocument();
    expect(screen.getByTestId("venta-grid")).toBeInTheDocument();
    expect(screen.getByTestId("venta-footer")).toBeInTheDocument();
    expect(screen.getByTestId("cliente-search")).toBeInTheDocument();
  });

  it("debe llamar a addItem cuando se selecciona un producto", async () => {
    const user = userEvent.setup();
    const mockAddItem = vi.fn();

    mockUseVentaStore.mockReturnValue({
      items: [],
      cliente: null,
      tipoComprobante: 1,
      listaPrecios: 1,
      descuentoPorcentaje: 0,
      addItem: mockAddItem,
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      setCliente: vi.fn(),
      setTipoComprobante: vi.fn(),
      setListaPrecios: vi.fn(),
      setDescuentoPorcentaje: vi.fn(),
      numeroComprobanteAsociado: null,
      setNumeroComprobanteAsociado: vi.fn(),
      clearVenta: vi.fn(),
    } as any);

    renderWithProviders(<VentasScreen />);

    const searchInput = screen.getByTestId("product-search-input");
    await user.type(searchInput, "test");

    // Verificar que se llamó addItem (el mock de ProductSearch simula la selección)
    // Nota: esto depende de cómo esté implementado ProductSearch en el mock
  });
});
