/**
 * Tests mínimos para PanelAlertas: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PanelAlertas from "./PanelAlertas";
import type { AlertasData } from "@/hooks/useAnaliticas";

vi.mock("@/hooks/useCurrency", () => ({
  useCurrency: () => "ARS",
}));

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

const mockData: AlertasData = {
  alertas: {
    stock: [],
    cobranzas: [],
    actividad: [],
    cheques: [],
    cajas: [],
  },
  resumen: {
    stock: 0,
    stockUrgentes: 0,
    cobranzas: 0,
    cobranzasVencidas: 0,
    actividad: 0,
    cheques: 0,
    chequesUrgentes: 0,
    cajas: 0,
    cajasSinActividad: 0,
  },
};

describe("PanelAlertas", () => {
  it("renderiza sin crash", () => {
    render(<PanelAlertas data={mockData} isLoading={false} />);
    expect(screen.getByText("Stock Crítico")).toBeDefined();
  });

  it("muestra estado de carga", () => {
    render(<PanelAlertas data={mockData} isLoading={true} />);
    expect(screen.getByText("Cargando alertas...")).toBeDefined();
  });
});
