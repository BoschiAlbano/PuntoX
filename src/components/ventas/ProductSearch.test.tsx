/**
 * Tests mínimos para ProductSearch: render y placeholder.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductSearch from "./ProductSearch";

vi.mock("@/hooks/useConfiguracion", () => ({
  useConfiguracion: vi.fn(() => ({ configuracion: {} })),
}));
vi.mock("@/hooks/useProductos", () => ({
  fetchProductosVentas: vi.fn(() => Promise.resolve([])),
}));
vi.mock("@/lib/utils/barcode", () => ({
  parseScaleBarcode: vi.fn((code: string) => ({ codigo: code, peso: null })),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("ProductSearch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza sin crash y muestra input de búsqueda", () => {
    renderWithProviders(
      <ProductSearch onProductSelect={vi.fn()} />
    );
    expect(
      screen.getByPlaceholderText(/escanear|busc|código|barras/i)
    ).toBeInTheDocument();
  });
});
