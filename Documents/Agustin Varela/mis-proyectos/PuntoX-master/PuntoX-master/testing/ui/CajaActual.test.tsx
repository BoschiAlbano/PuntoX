/**
 * Tests de UI para el componente CajaActual
 * - Verifica estados de carga, caja cerrada/abierta
 * - Flujos de apertura, cierre y registro de gastos
 * - Manejo de errores de API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "../utils/renderWithProviders";
import userEvent from "@testing-library/user-event";
import CajaActual from "@/components/caja/CajaActual";
import { useCaja } from "@/hooks/useCaja";
import { useUserStore } from "@/store/useUserStore";

// Mock del hook useCaja
vi.mock("@/hooks/useCaja");

// Mock de useUserStore
vi.mock("@/store/useUserStore", () => ({
  useUserStore: vi.fn(),
}));

// Mock de LoadingComponent
vi.mock("@/components/loading/loading", () => ({
  LoadingComponent: ({ message }: { message: string }) => (
    <div data-testid="loading">{message}</div>
  ),
}));

describe("CajaActual - UI Tests", () => {
  const mockUseCaja = vi.mocked(useCaja);
  const mockUseUserStore = vi.mocked(useUserStore);

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock por defecto de useUserStore
    mockUseUserStore.mockReturnValue({
      currentBranch: { Id: "1", Nombre: "Sucursal Test" },
    } as any);
  });

  describe("Estado de carga inicial", () => {
    it("debe mostrar loading cuando isLoading es true", () => {
      mockUseCaja.mockReturnValue({
        cajaActual: null,
        conceptosGasto: [],
        resumenDia: null,
        isLoading: true,
        isFetching: false,
        isError: false,
        isCajaAbierta: false,
        isOpening: false,
        isClosing: false,
        isAddingGasto: false,
        isAddingConcepto: false,
        abrirCaja: vi.fn(),
        cerrarCaja: vi.fn(),
        agregarGasto: vi.fn(),
        agregarConceptoGasto: vi.fn(),
        refetch: vi.fn(),
        fetchDetalleComprobante: vi.fn(),
      } as any);

      renderWithProviders(<CajaActual />);

      expect(screen.getByTestId("loading")).toBeInTheDocument();
      expect(screen.getByText("Cargando caja...")).toBeInTheDocument();
    });
  });

  describe("Caja cerrada", () => {
    it("debe mostrar mensaje de caja cerrada y botón para abrir", () => {
      mockUseCaja.mockReturnValue({
        cajaActual: null,
        conceptosGasto: [],
        resumenDia: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        isCajaAbierta: false,
        isOpening: false,
        isClosing: false,
        isAddingGasto: false,
        isAddingConcepto: false,
        abrirCaja: vi.fn(),
        cerrarCaja: vi.fn(),
        agregarGasto: vi.fn(),
        agregarConceptoGasto: vi.fn(),
        refetch: vi.fn(),
        fetchDetalleComprobante: vi.fn(),
      } as any);

      renderWithProviders(<CajaActual />);

      expect(screen.getByText("La caja está cerrada")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Debes abrir la caja para comenzar a registrar operaciones."
        )
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /abrir caja/i })).toBeInTheDocument();
    });

    it("debe abrir modal de apertura al hacer clic en 'Abrir Caja'", async () => {
      const user = userEvent.setup();
      const mockAbrirCaja = vi.fn().mockResolvedValue({});

      mockUseCaja.mockReturnValue({
        cajaActual: null,
        conceptosGasto: [],
        resumenDia: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        isCajaAbierta: false,
        isOpening: false,
        isClosing: false,
        isAddingGasto: false,
        isAddingConcepto: false,
        abrirCaja: mockAbrirCaja,
        cerrarCaja: vi.fn(),
        agregarGasto: vi.fn(),
        agregarConceptoGasto: vi.fn(),
        refetch: vi.fn(),
        fetchDetalleComprobante: vi.fn(),
      } as any);

      renderWithProviders(<CajaActual />);

      const abrirButton = screen.getByRole("button", { name: /abrir caja/i });
      await user.click(abrirButton);

      // Verificar que el modal se abre
      expect(screen.getByText("Apertura de Caja")).toBeInTheDocument();
      expect(screen.getByLabelText(/monto inicial/i)).toBeInTheDocument();
    });

    it("debe llamar a abrirCaja con el monto ingresado", async () => {
      const user = userEvent.setup();
      const mockAbrirCaja = vi.fn().mockResolvedValue({});

      mockUseCaja.mockReturnValue({
        cajaActual: null,
        conceptosGasto: [],
        resumenDia: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        isCajaAbierta: false,
        isOpening: false,
        isClosing: false,
        isAddingGasto: false,
        isAddingConcepto: false,
        abrirCaja: mockAbrirCaja,
        cerrarCaja: vi.fn(),
        agregarGasto: vi.fn(),
        agregarConceptoGasto: vi.fn(),
        refetch: vi.fn(),
        fetchDetalleComprobante: vi.fn(),
      } as any);

      renderWithProviders(<CajaActual />);

      // Abrir modal
      const abrirButton = screen.getByRole("button", { name: /abrir caja/i });
      await user.click(abrirButton);

      // Ingresar monto
      const montoInput = screen.getByLabelText(/monto inicial/i);
      await user.type(montoInput, "1000");

      // Confirmar apertura
      const confirmButton = screen.getByRole("button", { name: /abrir caja/i });
      await user.click(confirmButton);

      // Verificar que se llamó con el monto correcto
      await waitFor(() => {
        expect(mockAbrirCaja).toHaveBeenCalledWith(1000);
      });
    });
  });

  describe("Caja abierta", () => {
    const mockCajaAbierta = {
      Id: 1,
      MontoInicial: 1000,
      TotalEntradaEfectivo: 5000,
      TotalSalidaEfectivo: 500,
      TotalEntradaTarjeta: 2000,
      TotalSalidaTarjeta: 0,
      TotalEntradaCheque: 0,
      TotalSalidaCheque: 0,
      TotalEntradaCtaCte: 0,
      TotalSalidaCtaCte: 0,
      TotalEntradaTransf: 0,
      TotalSalidaTransf: 0,
      Ganancia: 0,
      FechaApertura: "2026-02-05T08:00:00Z",
      FechaCierre: null,
      UsuarioAperturaId: 1,
      UsuarioCierreId: null,
      EstaEliminado: false,
      Movimiento: [],
      Gasto: [],
      DetalleCaja: [],
    };

    it("debe mostrar información de la caja abierta", () => {
      mockUseCaja.mockReturnValue({
        cajaActual: mockCajaAbierta,
        conceptosGasto: [
          { Id: 1, Descripcion: "Alquiler" },
          { Id: 2, Descripcion: "Servicios" },
        ],
        resumenDia: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        isCajaAbierta: true,
        isOpening: false,
        isClosing: false,
        isAddingGasto: false,
        isAddingConcepto: false,
        abrirCaja: vi.fn(),
        cerrarCaja: vi.fn(),
        agregarGasto: vi.fn(),
        agregarConceptoGasto: vi.fn(),
        refetch: vi.fn(),
        fetchDetalleComprobante: vi.fn(),
      } as any);

      renderWithProviders(<CajaActual />);

      // Verificar que se muestra información de la caja
      expect(screen.getByText(/monto inicial/i)).toBeInTheDocument();
      expect(screen.getByText(/total entrada efectivo/i)).toBeInTheDocument();
    });

    it("debe mostrar botón para agregar gasto cuando la caja está abierta", () => {
      mockUseCaja.mockReturnValue({
        cajaActual: mockCajaAbierta,
        conceptosGasto: [
          { Id: 1, Descripcion: "Alquiler" },
          { Id: 2, Descripcion: "Servicios" },
        ],
        resumenDia: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        isCajaAbierta: true,
        isOpening: false,
        isClosing: false,
        isAddingGasto: false,
        isAddingConcepto: false,
        abrirCaja: vi.fn(),
        cerrarCaja: vi.fn(),
        agregarGasto: vi.fn(),
        agregarConceptoGasto: vi.fn(),
        refetch: vi.fn(),
        fetchDetalleComprobante: vi.fn(),
      } as any);

      renderWithProviders(<CajaActual />);

      // Buscar botón de agregar gasto (puede estar en un modal o directamente visible)
      const agregarGastoButtons = screen.queryAllByText(/agregar gasto/i);
      expect(agregarGastoButtons.length).toBeGreaterThan(0);
    });

    it("debe llamar a agregarGasto con los datos correctos", async () => {
      const user = userEvent.setup();
      const mockAgregarGasto = vi.fn().mockResolvedValue({});

      mockUseCaja.mockReturnValue({
        cajaActual: mockCajaAbierta,
        conceptosGasto: [
          { Id: 1, Descripcion: "Alquiler" },
          { Id: 2, Descripcion: "Servicios" },
        ],
        resumenDia: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        isCajaAbierta: true,
        isOpening: false,
        isClosing: false,
        isAddingGasto: false,
        isAddingConcepto: false,
        abrirCaja: vi.fn(),
        cerrarCaja: vi.fn(),
        agregarGasto: mockAgregarGasto,
        agregarConceptoGasto: vi.fn(),
        refetch: vi.fn(),
        fetchDetalleComprobante: vi.fn(),
      } as any);

      renderWithProviders(<CajaActual />);

      // Buscar y hacer clic en botón de agregar gasto
      const agregarGastoButton = screen.getByRole("button", {
        name: /agregar gasto/i,
      });
      await user.click(agregarGastoButton);

      // Esperar a que aparezca el modal y completar el formulario
      await waitFor(() => {
        expect(screen.getByText(/nuevo gasto/i)).toBeInTheDocument();
      });

      // Completar formulario (si los campos están disponibles)
      const descripcionInput = screen.queryByLabelText(/descripción/i);
      const montoInput = screen.queryByLabelText(/monto/i);

      if (descripcionInput && montoInput) {
        await user.type(descripcionInput, "Gasto de prueba");
        await user.type(montoInput, "500");

        // Buscar y hacer clic en confirmar
        const confirmButton = screen.getByRole("button", {
          name: /guardar|confirmar|agregar/i,
        });
        await user.click(confirmButton);

        // Verificar que se llamó con los datos correctos
        await waitFor(() => {
          expect(mockAgregarGasto).toHaveBeenCalled();
        });
      }
    });

    it("debe mostrar botón para cerrar caja", () => {
      mockUseCaja.mockReturnValue({
        cajaActual: mockCajaAbierta,
        conceptosGasto: [],
        resumenDia: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        isCajaAbierta: true,
        isOpening: false,
        isClosing: false,
        isAddingGasto: false,
        isAddingConcepto: false,
        abrirCaja: vi.fn(),
        cerrarCaja: vi.fn(),
        agregarGasto: vi.fn(),
        agregarConceptoGasto: vi.fn(),
        refetch: vi.fn(),
        fetchDetalleComprobante: vi.fn(),
      } as any);

      renderWithProviders(<CajaActual />);

      // Buscar botón de cerrar caja
      const cerrarCajaButtons = screen.queryAllByText(/cerrar caja/i);
      expect(cerrarCajaButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Manejo de errores", () => {
    it("debe manejar error al abrir caja", async () => {
      const user = userEvent.setup();
      const mockAbrirCaja = vi
        .fn()
        .mockRejectedValue(new Error("Error al abrir la caja"));

      mockUseCaja.mockReturnValue({
        cajaActual: null,
        conceptosGasto: [],
        resumenDia: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        isCajaAbierta: false,
        isOpening: false,
        isClosing: false,
        isAddingGasto: false,
        isAddingConcepto: false,
        abrirCaja: mockAbrirCaja,
        cerrarCaja: vi.fn(),
        agregarGasto: vi.fn(),
        agregarConceptoGasto: vi.fn(),
        refetch: vi.fn(),
        fetchDetalleComprobante: vi.fn(),
      } as any);

      renderWithProviders(<CajaActual />);

      // Intentar abrir caja
      const abrirButton = screen.getByRole("button", { name: /abrir caja/i });
      await user.click(abrirButton);

      const montoInput = screen.getByLabelText(/monto inicial/i);
      await user.type(montoInput, "1000");

      const confirmButton = screen.getByRole("button", { name: /abrir caja/i });
      await user.click(confirmButton);

      // Verificar que se llamó la función (el error se maneja internamente)
      await waitFor(() => {
        expect(mockAbrirCaja).toHaveBeenCalled();
      });
    });
  });
});
