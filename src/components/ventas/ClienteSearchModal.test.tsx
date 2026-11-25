/**
 * Tests para ClienteSearchModal
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ClienteSearchModal from "./ClienteSearchModal";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return {
    ...actual,
    addToast: vi.fn(),
    Modal: ({ children, isOpen }: any) =>
      isOpen ? <div data-testid="modal">{children}</div> : null,
    // ModalContent recibe una render-function (onClose) => ...
    ModalContent: ({ children }: any) => (
      <div>{typeof children === "function" ? children(() => {}) : children}</div>
    ),
    ModalHeader: ({ children }: any) => <div>{children}</div>,
    ModalBody: ({ children }: any) => <div>{children}</div>,
    ModalFooter: ({ children }: any) => <div>{children}</div>,
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: [],
      isLoading: false,
      isFetching: false,
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    })),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
    })),
  };
});

vi.mock("../loading/loading", () => ({
  LoadingComponent: ({ message }: any) => <div>{message}</div>,
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const renderModal = (handleSelect = vi.fn(), onOpenChange = vi.fn()) =>
  renderWithProviders(
    <ClienteSearchModal
      isOpen={true}
      onOpenChange={onOpenChange}
      handleSelect={handleSelect}
    />
  );

describe("ClienteSearchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el título y el buscador de clientes", () => {
    renderModal();
    expect(screen.getByText("Buscar Cliente")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Buscar por Nombre, DNI, Email...")
    ).toBeInTheDocument();
  });

  it("no renderiza nada cuando isOpen es false", () => {
    renderWithProviders(
      <ClienteSearchModal isOpen={false} onOpenChange={vi.fn()} handleSelect={vi.fn()} />
    );
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("\"Consumidor Final\" selecciona al cliente genérico (id 0)", () => {
    const handleSelect = vi.fn();
    renderModal(handleSelect);
    fireEvent.click(screen.getByRole("button", { name: "Consumidor Final" }));
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect.mock.calls[0][0]).toMatchObject({ id: 0, activarCtaCte: false });
  });

  it("\"Nuevo Cliente\" navega al alta de clientes", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /Nuevo Cliente/ }));
    expect(push).toHaveBeenCalledWith("/clientes/new");
  });
});
