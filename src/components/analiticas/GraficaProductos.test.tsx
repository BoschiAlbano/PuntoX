/**
 * Tests mínimos para GraficaProductos: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GraficaProductos from "./GraficaProductos";

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
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
}));

describe("GraficaProductos", () => {
  it("renderiza sin crash con datos vacíos", () => {
    render(<GraficaProductos datos={[]} />);
    expect(screen.getByText("Top 10 Productos por Ventas")).toBeDefined();
  });

  it("renderiza sin crash con datos", () => {
    const datos = [
      { id: 1, nombre: "Producto A", cantidad: 100, monto: 5000, margen: 1500, margenPorcentaje: 30 },
      { id: 2, nombre: "Producto B", cantidad: 80, monto: 4000, margen: 800, margenPorcentaje: 20 },
    ];
    render(<GraficaProductos datos={datos} />);
    expect(screen.getByTestId("bar-chart")).toBeDefined();
  });
});
