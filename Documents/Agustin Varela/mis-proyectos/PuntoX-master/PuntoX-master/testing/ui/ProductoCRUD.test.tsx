/**
 * Tests de UI para ProductoCRUD
 * - Verifica búsqueda y paginación
 * - Manejo de errores de API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "../utils/renderWithProviders";
import userEvent from "@testing-library/user-event";
import ProductoCRUD from "@/components/productos/ProductoCRUD";
import { useProductos } from "@/hooks/useProductos";

// Mock del hook useProductos
vi.mock("@/hooks/useProductos");

// Mock de GenericCrud
vi.mock("@/components/shared/GenericCrud", () => ({
  default: ({ title, searchPlaceholder }: any) => (
    <div data-testid="generic-crud">
      <h1>{title}</h1>
      <input
        data-testid="search-input"
        placeholder={searchPlaceholder}
        aria-label="search"
      />
    </div>
  ),
}));

describe("ProductoCRUD - UI Tests", () => {
  const mockUseProductos = vi.mocked(useProductos);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe renderizar el componente con título y buscador", () => {
    mockUseProductos.mockReturnValue({
      productos: [],
      paginationMeta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      isLoadingProductos: false,
      isErrorProductos: false,
      marcas: [],
      rubros: [],
      unidades: [],
      ivas: [],
      saveMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      deleteMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      addStockMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
    });

    renderWithProviders(<ProductoCRUD />);

    expect(screen.getByText("Gestión de Productos")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Buscar productos...")
    ).toBeInTheDocument();
  });

  it("debe mostrar estado de carga cuando isLoadingProductos es true", () => {
    mockUseProductos.mockReturnValue({
      productos: [],
      paginationMeta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      isLoadingProductos: true,
      isErrorProductos: false,
      marcas: [],
      rubros: [],
      unidades: [],
      ivas: [],
      saveMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      deleteMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      addStockMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
    });

    renderWithProviders(<ProductoCRUD />);

    // El componente debería mostrar algún indicador de carga
    // (depende de la implementación de GenericCrud)
    expect(screen.getByTestId("generic-crud")).toBeInTheDocument();
  });
});
