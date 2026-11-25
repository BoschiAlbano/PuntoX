/**
 * Tests mínimos para GenericCrud: render con props mínimas.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenericCrud from "./GenericCrud";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return {
    ...actual,
    addToast: vi.fn(),
    useDisclosure: () => ({ isOpen: false, onOpen: vi.fn(), onClose: vi.fn() }),
    Modal: ({ children }: any) => <div data-testid="modal">{children}</div>,
    ModalContent: ({ children }: any) => <div>{children}</div>,
    ModalHeader: () => null,
    ModalBody: () => null,
    ModalFooter: () => null,
  };
});
vi.mock("@/hooks/useGenericApi", () => ({
  useGenericApi: vi.fn(() => ({
    data: [],
    paginationMeta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    isLoading: false,
    isFetching: false,
    isError: false,
    saveMutation: { mutateAsync: vi.fn(), isPending: false },
    deleteMutation: { mutateAsync: vi.fn(), isPending: false },
    hardDeleteMutation: { mutateAsync: vi.fn(), isPending: false },
    refetch: vi.fn(),
    prefetchWithParams: vi.fn(),
  })),
}));
vi.mock("@/lib/auth/errorHandler", () => ({ handleError: vi.fn() }));
// GenericCrud sincroniza filtros con la URL (useRouter/useSearchParams/usePathname).
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/marcas",
  useSearchParams: () => new URLSearchParams(),
}));

const mockForm = ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Form</div> : null);
const columns = [{ uid: "Descripcion", name: "Descripción" }];
const renderCell = () => null;

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("GenericCrud", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza sin crash con props mínimas", () => {
    renderWithProviders(
      <GenericCrud
        apiPath="/api/marcas"
        queryKey="marcas"
        columns={columns}
        renderCell={renderCell}
        FormComponent={mockForm as any}
        title="Marcas"
      />
    );
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
  });
});
