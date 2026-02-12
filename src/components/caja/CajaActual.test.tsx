/**
 * Test mínimo para CajaActual: render sin crash y texto clave cuando no hay caja abierta.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CajaActual from "./CajaActual";

vi.mock("@/hooks/useCaja", () => ({
  useCaja: vi.fn(),
}));
vi.mock("@/hooks/useGastos", () => ({
  useGastos: vi.fn(),
}));
vi.mock("react-to-print", () => ({
  useReactToPrint: () => ({ contentRef: null }),
}));

import { useCaja } from "@/hooks/useCaja";
import { useGastos } from "@/hooks/useGastos";

describe("CajaActual", () => {
  beforeEach(() => {
    vi.mocked(useCaja).mockReturnValue({
      cajaActual: null,
      isLoading: false,
      isFetching: false,
      isOpening: false,
      isClosing: false,
      isCajaAbierta: false,
      abrirCaja: vi.fn(),
      cerrarCaja: vi.fn(),
      refetch: vi.fn(),
      fetchDetalleComprobante: vi.fn(),
    } as any);
    vi.mocked(useGastos).mockReturnValue({
      conceptosGasto: [],
      agregarGasto: vi.fn(),
      editarGasto: vi.fn(),
      eliminarGasto: vi.fn(),
      agregarConceptoGasto: vi.fn(),
      isAddingGasto: false,
      isEditingGasto: false,
      isDeletingGasto: false,
      isAddingConcepto: false,
    } as any);
  });

  it("renderiza sin crash y muestra opción de abrir caja cuando no hay caja abierta", () => {
    render(<CajaActual />);
    expect(screen.getByText(/Abrir Caja/i)).toBeInTheDocument();
  });
});
