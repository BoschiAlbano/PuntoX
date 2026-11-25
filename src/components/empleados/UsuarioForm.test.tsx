/**
 * Tests mínimos para UsuarioForm: render condicional y modal.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UsuarioForm from "./UsuarioForm";

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

vi.mock("@/hooks/useUsuario", () => ({
  useUsuario: vi.fn(() => ({
    provincias: [],
    roles: [],
    sucursales: [],
    isLoadingProvincias: false,
    isLoadingRoles: false,
    isLoadingSucursales: false,
    useDepartamentos: vi.fn(() => ({ data: [], isLoading: false })),
    useLocalidades: vi.fn(() => ({ data: [], isLoading: false })),
  })),
}));

vi.mock("../../../prisma/generated/prisma", () => ({
  Sucursal: {},
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

// UsuarioForm es un formulario de página completa (/new y /[id]), ya no un modal.
describe("UsuarioForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra el título \"Nuevo Empleado\" cuando no hay initialData", () => {
    renderWithProviders(
      <UsuarioForm
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSaving={false}
      />
    );
    expect(screen.getByText("Nuevo Empleado")).toBeInTheDocument();
  });

  it("llama a onCancel al tocar Cancelar", () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <UsuarioForm
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={onCancel}
        isSaving={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
