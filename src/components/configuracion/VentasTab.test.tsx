/**
 * Tests mínimos para VentasTab: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VentasTab } from "./VentasTab";

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

// Mock all sub-components used by VentasTab
vi.mock("./ventas/PreferenciasBasicas", () => ({
  PreferenciasBasicas: () => <div data-testid="preferencias-basicas">PreferenciasBasicas</div>,
}));
vi.mock("./ventas/ConfiguracionStock", () => ({
  ConfiguracionStock: () => <div data-testid="configuracion-stock">ConfiguracionStock</div>,
}));
vi.mock("./ventas/ConfiguracionCaja", () => ({
  ConfiguracionCaja: () => <div data-testid="configuracion-caja">ConfiguracionCaja</div>,
}));
vi.mock("./ventas/ConfiguracionProductos", () => ({
  ConfiguracionProductos: () => <div data-testid="configuracion-productos">ConfiguracionProductos</div>,
}));
vi.mock("./ventas/ConfiguracionBascula", () => ({
  ConfiguracionBascula: () => <div data-testid="configuracion-bascula">ConfiguracionBascula</div>,
}));

describe("VentasTab", () => {
  it("renderiza sin crash", () => {
    render(<VentasTab />);
    expect(screen.getByText("Preferencias de venta")).toBeDefined();
  });
});
