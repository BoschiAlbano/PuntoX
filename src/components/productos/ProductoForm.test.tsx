/**
 * Tests mínimos para ProductoForm: render condicional y modal.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductoForm from "./ProductoForm";

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

vi.mock("../../../prisma/generated/prisma", () => ({
  TiposVenta: { UNIDAD: "UNIDAD", PESO: "PESO" },
}));

vi.mock("../marcas/MarcaForm", () => ({
  default: () => null,
}));

vi.mock("../rubros/RubroForm", () => ({
  default: () => null,
}));

vi.mock("../unidad-medida/UnidadMedidaForm", () => ({
  default: () => null,
}));

vi.mock("../loading/loading", () => ({
  LoadingComponent: () => <div>Loading...</div>,
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

// ProductoForm es un formulario de página completa (/new y /[id]), ya no un modal.
describe("ProductoForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra el título \"Nuevo Producto\" cuando no hay initialData", () => {
    renderWithProviders(
      <ProductoForm
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSaving={false}
      />
    );
    expect(screen.getByText("Nuevo Producto")).toBeInTheDocument();
  });

  it("llama a onCancel al tocar Cancelar", () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <ProductoForm
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
