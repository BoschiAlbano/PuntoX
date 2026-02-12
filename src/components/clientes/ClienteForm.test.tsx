/**
 * Tests mínimos para ClienteForm: render condicional y modal.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ClienteForm from "./ClienteForm";

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

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return { ...actual };
});

vi.mock("@/lib/auth/errorHandler", () => ({ handleError: vi.fn() }));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("ClienteForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no renderiza cuando isOpen es false", () => {
    renderWithProviders(
      <ClienteForm
        isOpen={false}
        onClose={vi.fn()}
        initialData={null}
        onSubmit={vi.fn()}
        isSaving={false}
      />
    );
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("renderiza modal cuando isOpen es true", () => {
    renderWithProviders(
      <ClienteForm
        isOpen={true}
        onClose={vi.fn()}
        initialData={null}
        onSubmit={vi.fn()}
        isSaving={false}
      />
    );
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });
});
