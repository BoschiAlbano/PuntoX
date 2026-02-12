/**
 * Tests mínimos para PerfilTab: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PerfilTab } from "./PerfilTab";

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

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock("@/hooks/useConfiguracion", () => ({
  useConfiguracion: vi.fn(() => ({
    tenant: { nombre: "TestTenant", dominio: "test.com" },
    configuracion: {
      razonSocial: "",
      nombreFantasia: "",
      cuit: "",
      email: "",
      telefono: "",
      celular: "",
      direccion: "",
      localidadId: null,
      departamentoId: null,
      provinciaId: null,
      observacionPieFactura: "",
      ShowFoto: false,
    },
    branding: { logoPreview: "", slogan: "", color: "" },
    saveTenant: vi.fn(),
    saveConfiguracion: vi.fn(),
    saveBranding: vi.fn(),
    isSavingTenant: false,
    isSavingConfiguracion: false,
    useProvincias: () => ({ data: [], isLoading: false }),
    useDepartamentos: () => ({ data: [], isLoading: false }),
    useLocalidades: () => ({ data: [], isLoading: false }),
  })),
}));

describe("PerfilTab", () => {
  it("renderiza sin crash", () => {
    render(<PerfilTab />);
    expect(screen.getByText("Perfil del negocio")).toBeDefined();
  });
});
