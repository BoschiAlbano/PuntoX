/**
 * Tests mínimos para GraficaPagos: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GraficaPagos from "./GraficaPagos";

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

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("GraficaPagos", () => {
  it("renderiza sin crash con datos vacíos", () => {
    render(<GraficaPagos datos={[]} />);
    expect(screen.getByText("Mix de Medios de Pago")).toBeDefined();
  });

  it("renderiza sin crash con datos", () => {
    const datos = [
      { nombre: "Efectivo", monto: 5000, porcentaje: 50 },
      { nombre: "Tarjeta", monto: 5000, porcentaje: 50 },
    ];
    render(<GraficaPagos datos={datos} />);
    expect(screen.getByTestId("pie-chart")).toBeDefined();
  });
});
