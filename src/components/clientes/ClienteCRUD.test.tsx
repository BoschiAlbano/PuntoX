/**
 * Tests mínimos para ClienteCRUD: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ClienteCRUD from "./ClienteCRUD";

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

vi.mock("@/lib/auth/errorHandler", () => ({ handleError: vi.fn() }));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("ClienteCRUD", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza sin crash", () => {
    renderWithProviders(<ClienteCRUD />);
    expect(screen.getByPlaceholderText(/buscar por nombre, email, dni/i)).toBeInTheDocument();
  });
});
