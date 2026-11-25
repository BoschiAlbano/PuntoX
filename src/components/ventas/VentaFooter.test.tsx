/**
 * Tests para VentaFooter: totales, formato es-AR y descuento porcentual.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("muestra los totales y el botón de pago", () => {
    renderWithProviders(<VentaFooter {...defaultProps} />);
    expect(screen.getByText("Totales")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Descuento")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    // Sin items el botón principal no se puede confirmar
    expect(screen.getByRole("button", { name: /Completar pago/i })).toBeDisabled();
  });

  it("formatea subtotal, descuento (%) y total en es-AR", () => {
    renderWithProviders(
      <VentaFooter
        {...defaultProps}
        subtotal={1000}
        descuento={10}
        total={900}
      />
    );
    expect(screen.getByText("$1.000,00")).toBeInTheDocument();
    // El descuento es un porcentaje: 10% de 1000
    expect(screen.getByText("− $100,00")).toBeInTheDocument();
    // El total destacado está junto a la etiqueta "Total" (el monto también
    // aparece en el resumen de pagos)
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("$900,00");
  });

  it("el input de descuento muestra el % y lo limita a 0..100", () => {
    const setDescuento = vi.fn();
    renderWithProviders(
      <VentaFooter
        {...defaultProps}
        subtotal={100}
        descuento={25}
        total={75}
        setDescuento={setDescuento}
      />
    );
    const input = screen.getByTestId("descuento-input");
    expect(input).toHaveValue(25);
    fireEvent.change(input, { target: { value: "150" } });
    expect(setDescuento).toHaveBeenLastCalledWith(100);
    fireEvent.change(input, { target: { value: "-5" } });
    expect(setDescuento).toHaveBeenLastCalledWith(0);
  });
});
