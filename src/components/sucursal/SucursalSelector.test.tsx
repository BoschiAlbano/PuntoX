/**
 * Tests para SucursalSelector.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SucursalSelector from "./SucursalSelector";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return { ...actual, addToast: vi.fn() };
});

const mockSucursales = [
  { Id: "1", Nombre: "Sucursal Central", EsPrincipal: true, Direccion: "Calle 1" },
  { Id: "2", Nombre: "Sucursal Norte", EsPrincipal: false, Direccion: "Calle 2" },
];

const createMockState = (overrides: Partial<{
  branches: typeof mockSucursales;
  currentBranch: (typeof mockSucursales)[0] | null;
  isLoading: boolean;
}> = {}) => ({
  branches: mockSucursales,
  currentBranch: mockSucursales[0],
  isLoading: false,
  ...overrides,
});

const mockUseUserStore = vi.fn((selector: (s: ReturnType<typeof createMockState>) => unknown) => {
  const state = createMockState();
  return selector(state);
});

vi.mock("@/store/useUserStore", () => ({
  useUserStore: (selector: (s: unknown) => unknown) => mockUseUserStore(selector),
}));

describe("SucursalSelector", () => {
  beforeEach(() => {
    mockUseUserStore.mockImplementation(
      (selector: (s: ReturnType<typeof createMockState>) => unknown) => {
        const state = createMockState();
        return selector(state);
      }
    );
  });

  it("no renderiza nada cuando isLoading es true", () => {
    mockUseUserStore.mockImplementation(
      (selector: (s: ReturnType<typeof createMockState>) => unknown) => {
        return selector(createMockState({ isLoading: true }));
      }
    );
    const { container } = render(<SucursalSelector hideIfSingle={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("no renderiza nada cuando hideIfSingle y solo hay una sucursal", () => {
    mockUseUserStore.mockImplementation(
      (selector: (s: ReturnType<typeof createMockState>) => unknown) => {
        return selector(
          createMockState({ branches: [mockSucursales[0]], currentBranch: mockSucursales[0] })
        );
      }
    );
    const { container } = render(<SucursalSelector hideIfSingle />);
    expect(container.firstChild).toBeNull();
  });

  it("no renderiza nada cuando no hay sucursales", () => {
    mockUseUserStore.mockImplementation(
      (selector: (s: ReturnType<typeof createMockState>) => unknown) => {
        return selector(createMockState({ branches: [], currentBranch: null }));
      }
    );
    const { container } = render(<SucursalSelector hideIfSingle={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza el selector con sucursal actual cuando hay múltiples sucursales", () => {
    mockUseUserStore.mockImplementation(
      (selector: (s: ReturnType<typeof createMockState>) => unknown) => {
        return selector(createMockState());
      }
    );
    render(<SucursalSelector hideIfSingle={false} />);
    expect(screen.getByText(/Sucursal Central|Seleccionar sucursal/i)).toBeInTheDocument();
  });
});
