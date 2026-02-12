/**
 * Tests mínimos para UsuariosCRUD: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UsuariosCRUD from "./UsuariosCRUD";

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

vi.mock("@/hooks/useGenericApi", () => ({
  useGenericApi: vi.fn(() => ({
    data: [],
    paginationMeta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    isLoading: false,
    isError: false,
    saveMutation: { mutateAsync: vi.fn() },
    deleteMutation: { mutateAsync: vi.fn() },
    refetch: vi.fn(),
  })),
}));

vi.mock("@/store/useUserStore", () => ({
  useUserStore: vi.fn(() => ({
    user: { Id: 1 },
    roles: [],
  })),
}));

vi.mock("./ChangePasswordModal", () => ({
  default: () => null,
}));

vi.mock("@/lib/constants/comprobantes", () => ({
  TIPO_PERFIL: {
    ADMINISTRADOR: "ADMINISTRADOR",
    EMPLEADO: "EMPLEADO",
  },
}));

vi.mock("@/lib/auth/errorHandler", () => ({ handleError: vi.fn() }));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("UsuariosCRUD", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza sin crash", () => {
    renderWithProviders(<UsuariosCRUD />);
    expect(screen.getByPlaceholderText(/buscar por nombre, usuario o dni/i)).toBeInTheDocument();
  });
});
