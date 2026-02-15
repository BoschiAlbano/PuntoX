/**
 * Tests mínimos para GraficaIngresos: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GraficaIngresos from "./GraficaIngresos";

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
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
}));

describe("GraficaIngresos", () => {
  it("renderiza sin crash con datos vacíos", () => {
    render(<GraficaIngresos datos={[]} />);
    expect(screen.getByText("Ingresos Totales")).toBeDefined();
  });

  it("renderiza sin crash con datos", () => {
    const datos = [
      { fecha: "2025-01-01", ingresos: 1000, descuentos: 50, facturas: 5, todos: 1050 },
      { fecha: "2025-01-02", ingresos: 2000, descuentos: 100, facturas: 8, todos: 2100 },
    ];
    render(<GraficaIngresos datos={datos} />);
    expect(screen.getByTestId("line-chart")).toBeDefined();
  });
});
