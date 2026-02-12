/**
 * Tests para ClienteSearchModal
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ClienteSearchModal from "./ClienteSearchModal";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return {
    ...actual,
    addToast: vi.fn(),
    Modal: ({ children, isOpen }: any) =>
      isOpen ? <div data-testid="modal">{children}</div> : null,
    ModalContent: ({ children }: any) => <div>{children}</div>,
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

vi.mock("../clientes/ClienteForm", () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="cliente-form">ClienteForm</div> : null,
}));

vi.mock("lucide-react", () => ({
  Search: () => <div data-testid="search-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("ClienteSearchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza modal con búsqueda de clientes", () => {
    renderWithProviders(
      <ClienteSearchModal
        isOpen={true}
        onOpenChange={vi.fn()}
        handleSelect={vi.fn()}
      />
    );

    expect(screen.getByText("Buscar Cliente")).toBeInTheDocument();
  });

  it("muestra input de búsqueda con placeholder", () => {
    renderWithProviders(
      <ClienteSearchModal
        isOpen={true}
        onOpenChange={vi.fn()}
        handleSelect={vi.fn()}
      />
    );

    expect(
      screen.getByPlaceholderText("Buscar por Nombre, DNI, Email...")
    ).toBeInTheDocument();
  });

  it("muestra botón Agregar Cliente", () => {
    renderWithProviders(
      <ClienteSearchModal
        isOpen={true}
        onOpenChange={vi.fn()}
        handleSelect={vi.fn()}
      />
    );

    expect(screen.getByText("Agregar Cliente")).toBeInTheDocument();
  });

  it("muestra botón Usar Consumidor Final", () => {
    renderWithProviders(
      <ClienteSearchModal
        isOpen={true}
        onOpenChange={vi.fn()}
        handleSelect={vi.fn()}
      />
    );

    expect(screen.getByText("Usar Consumidor Final")).toBeInTheDocument();
  });
});
