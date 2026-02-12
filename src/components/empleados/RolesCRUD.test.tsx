/**
 * Tests mínimos para RolesCRUD: render sin crash y muestra botón de crear rol.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RolesCRUD from "./RolesCRUD";

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

vi.mock("@/hooks/useRoles", () => ({
  useRoles: vi.fn(() => ({
    rolesData: { roles: [] },
    isLoading: false,
    isError: false,
    createRol: { mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false },
    updateRol: { mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false },
    deleteRol: { mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false },
    refetch: vi.fn(),
  })),
}));

vi.mock("../loading/loading", () => ({
  LoadingComponent: () => <div>Loading...</div>,
}));

vi.mock("@/lib/constants/comprobantes", () => ({
  PERMISSIONS: {
    VENTAS: "VENTAS",
    CAJA: "CAJA",
  },
  TIPO_PERFIL: {
    ADMINISTRADOR: "ADMINISTRADOR",
    EMPLEADO: "EMPLEADO",
  },
}));

vi.mock("@/lib/auth/errorHandler", () => ({ handleError: vi.fn() }));

describe("RolesCRUD", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza sin crash y muestra botón de crear rol", () => {
    render(<RolesCRUD />);
    expect(screen.getByText(/nuevo rol/i)).toBeInTheDocument();
  });
});
