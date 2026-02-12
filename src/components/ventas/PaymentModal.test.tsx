/**
 * Tests para PaymentModal
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentModal from "./PaymentModal";

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

vi.mock("lucide-react", () => ({
  Trash2: () => <div data-testid="trash-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("PaymentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza modal con total cuando isOpen es true", () => {
    renderWithProviders(
      <PaymentModal
        isOpen={true}
        onClose={vi.fn()}
        total={100}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Confirmar Pago")).toBeInTheDocument();
    expect(screen.getAllByText(/100/).length).toBeGreaterThan(0);
  });

  it("muestra botón FINALIZAR VENTA", () => {
    renderWithProviders(
      <PaymentModal
        isOpen={true}
        onClose={vi.fn()}
        total={100}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("FINALIZAR VENTA")).toBeInTheDocument();
  });

  it("no renderiza cuando isOpen es false", () => {
    renderWithProviders(
      <PaymentModal
        isOpen={false}
        onClose={vi.fn()}
        total={100}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("muestra botón cancelar", () => {
    renderWithProviders(
      <PaymentModal
        isOpen={true}
        onClose={vi.fn()}
        total={100}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });
});
