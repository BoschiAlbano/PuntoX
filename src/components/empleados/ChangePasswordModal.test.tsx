/**
 * Tests mínimos para ChangePasswordModal: render con isOpen.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChangePasswordModal from "./ChangePasswordModal";

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

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const defaultProps = {
  isOpen: false,
  onClose: vi.fn(),
  usuarioId: 1,
  userName: "Juan",
};

describe("ChangePasswordModal", () => {
  it("no renderiza cuando isOpen es false", () => {
    renderWithProviders(<ChangePasswordModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("renderiza modal cuando isOpen es true", () => {
    renderWithProviders(<ChangePasswordModal {...defaultProps} isOpen={true} />);
    expect(screen.getByTestId("modal")).toBeDefined();
    expect(screen.getByText("Cambiar Contraseña - Juan")).toBeDefined();
  });
});
