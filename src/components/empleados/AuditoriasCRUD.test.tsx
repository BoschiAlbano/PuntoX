/**
 * Tests mínimos para AuditoriasCRUD: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuditoriasCRUD from "./AuditoriasCRUD";

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

vi.mock("@/components/shared/GenericCrud", () => ({
  default: (props: any) => (
    <div data-testid="generic-crud">
      <span>{props.searchPlaceholder}</span>
    </div>
  ),
}));

vi.mock("../../app/(dashboard)/empleados/auditoria-utils", () => ({
  formatTiempoRelativo: vi.fn(() => "Hace 5 min"),
  formatearAccion: vi.fn(() => "Login"),
  mapearAccion: vi.fn(() => ({ categoria: "LOGIN" })),
  mapearSeveridad: vi.fn(() => "default"),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("AuditoriasCRUD", () => {
  it("renderiza sin crash", () => {
    renderWithProviders(<AuditoriasCRUD />);
    expect(screen.getByTestId("generic-crud")).toBeDefined();
    expect(screen.getByText("Buscar por usuario, acción o IP...")).toBeDefined();
  });
});
