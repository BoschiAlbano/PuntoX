/**
 * Test mínimo para VentaFooter: render sin crash y texto clave.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VentaFooter from "./VentaFooter";

vi.mock("@/hooks/useConfiguracion", () => ({
  useConfiguracion: vi.fn(),
}));
vi.mock("@/hooks/useCaja", () => ({
  useCaja: vi.fn(),
}));
vi.mock("@/store/ventaStore", () => ({
  useVentaStore: vi.fn(),
}));
vi.mock("react-to-print", () => ({
  useReactToPrint: () => ({ contentRef: null }),
}));

import { useConfiguracion } from "@/hooks/useConfiguracion";
import { useCaja } from "@/hooks/useCaja";
import { useVentaStore } from "@/store/ventaStore";

const defaultProps = {
  subtotal: 100,
  descuento: 0,
  setDescuento: vi.fn(),
  total: 100,
  items: [],
  cliente: null,
  tipoComprobante: 1,
  handleLimpiar: vi.fn(),
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("VentaFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConfiguracion).mockReturnValue({
      configuracion: {
        tipoFormaPagoPorDefectoVenta: 1,
      },
    } as any);
    vi.mocked(useCaja).mockReturnValue({
      cajaActual: { Id: 1 },
      abrirCaja: vi.fn(),
      isLoading: false,
    } as any);
    vi.mocked(useVentaStore).mockReturnValue({
      pagos: [],
      addPago: vi.fn(),
      removePago: vi.fn(),
      setPagos: vi.fn(),
      numeroComprobanteAsociado: null,
    } as any);
  });

  it("renderiza sin crash y muestra texto clave de total y venta", () => {
    renderWithProviders(<VentaFooter {...defaultProps} />);
    expect(screen.getByText(/Subtotal:/i)).toBeInTheDocument();
    expect(screen.getByText(/CONFIRMAR VENTA/i)).toBeInTheDocument();
  });
});
