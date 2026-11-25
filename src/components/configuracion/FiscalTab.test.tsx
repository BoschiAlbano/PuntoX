/**
 * Tests mínimos para FiscalTab: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FiscalTab } from "./FiscalTab";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return {
    ...actual,
    addToast: vi.fn(),
    useDisclosure: () => ({ isOpen: false, onOpen: vi.fn(), onClose: vi.fn() }),
    Modal: ({ children, isOpen }: any) => isOpen ? <div data-testid="modal">{typeof children === 'function' ? children(() => {}) : children}</div> : null,
    ModalContent: ({ children }: any) => <div>{typeof children === 'function' ? children(() => {}) : children}</div>,
    ModalHeader: ({ children }: any) => <div>{children}</div>,
    ModalBody: ({ children }: any) => <div>{children}</div>,
    ModalFooter: ({ children }: any) => <div>{children}</div>,
  };
});

vi.mock("@/hooks/useConfiguracion", () => {
  // Objeto estable: el hook real devuelve query.data (misma referencia entre
  // renders). Crear un objeto nuevo en cada llamada dispara un loop infinito
  // en los useEffect([xxxData]) del componente.
  const mockValue = {
    fiscal: {
      moneda: "ARS",
      zonaHoraria: "America/Argentina/Buenos_Aires",
      idioma: "es-AR",
      condicionIvaId: null,
      tipoIva: "",
      puntoVenta: "",
      inicioActividades: "",
      ingresosBrutos: "",
    },
    saveFiscal: vi.fn(),
    isSavingFiscal: false,
  };
  return { useConfiguracion: vi.fn(() => mockValue) };
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("FiscalTab", () => {
  it("renderiza sin crash", () => {
    renderWithProviders(<FiscalTab />);
    expect(screen.getByText("Configuración regional")).toBeDefined();
  });
});
