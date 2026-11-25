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
      <p>{props.emptyText}</p>
      {/* Los filtros de Cajas se inyectan en la barra de la tabla */}
      {props.extraRightContent}
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

  it("renderiza la tabla con búsqueda por usuario y texto vacío propio", () => {
    renderWithProviders(<Cajas />);
    expect(screen.getByPlaceholderText("Buscar por usuario...")).toBeInTheDocument();
    expect(
      screen.getByText("No se encontraron cajas con los filtros seleccionados"),
    ).toBeInTheDocument();
  });

  it("muestra los filtros de estado (Todas por defecto) y rango de fechas", () => {
    renderWithProviders(<Cajas />);
    expect(screen.getAllByText("Todas").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Desde")).toBeInTheDocument();
    expect(screen.getByLabelText("Hasta")).toBeInTheDocument();
    // "Limpiar fechas" solo aparece con alguna fecha cargada
    expect(screen.queryByLabelText("Limpiar fechas")).toBeNull();
  });
});
