/**
 * Tests para Cajas: render y filtros.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import Cajas from "./Cajas";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return { ...actual, addToast: vi.fn() };
});

vi.mock("@/hooks/useCajasQuery", () => ({
  useCajasQuery: vi.fn(() => ({
    data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isFetching: false,
  })),
}));

vi.mock("@/hooks/useCaja", () => ({
  Caja: {},
}));

vi.mock("@/components/shared/GenericTable", () => ({
  default: (props: any) => (
    <div data-testid="generic-table">
      <input placeholder={props.searchPlaceholder || "Buscar..."} />
    </div>
  ),
  Column: {},
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: vi.fn((val: string) => val),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("Cajas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza título Cajas", () => {
    renderWithProviders(<Cajas />);
    expect(screen.getByText("Cajas")).toBeInTheDocument();
  });

  it("muestra selector de estado", () => {
    renderWithProviders(<Cajas />);
    const label = screen.getByText("Estado");
    const select = label.parentElement?.querySelector("select");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Todas")).toBeInTheDocument();
    expect(screen.getByText("Abiertas")).toBeInTheDocument();
    expect(screen.getByText("Cerradas")).toBeInTheDocument();
  });

  it("renderiza GenericTable", () => {
    renderWithProviders(<Cajas />);
    expect(screen.getByPlaceholderText("Buscar por usuario...")).toBeInTheDocument();
  });
});
