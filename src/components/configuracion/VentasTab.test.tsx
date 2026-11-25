/**
 * Tests para VentasTab: skeleton mientras carga y las 4 secciones al terminar.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VentasTab } from "./VentasTab";
import { useConfiguracion } from "@/hooks/useConfiguracion";

vi.mock("@/hooks/useConfiguracion", () => ({ useConfiguracion: vi.fn() }));
vi.mock("./ConfiguracionSkeleton", () => ({
  VentasTabSkeleton: () => <div data-testid="ventas-skeleton" />,
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

// Mock all sub-components used by VentasTab
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
  it("muestra el skeleton mientras carga la configuración", () => {
    vi.mocked(useConfiguracion).mockReturnValue({ isLoadingConfiguracion: true } as any);
    render(<VentasTab />);
    expect(screen.getByTestId("ventas-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("configuracion-stock")).toBeNull();
  });

  it("renderiza las 4 secciones de configuración cuando terminó de cargar", () => {
    vi.mocked(useConfiguracion).mockReturnValue({ isLoadingConfiguracion: false } as any);
    render(<VentasTab />);
    for (const id of [
      "configuracion-stock",
      "configuracion-caja",
      "configuracion-productos",
      "configuracion-bascula",
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });
});
