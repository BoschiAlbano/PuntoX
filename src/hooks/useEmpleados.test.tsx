/**
 * Tests para el hook useEmpleados.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEmpleados } from "./useEmpleados";

vi.mock("@heroui/react", () => ({
  addToast: vi.fn(),
}));
vi.mock("@/lib/auth/errorHandler", () => ({
  handleError: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useEmpleados", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve empleados cuando fetch resuelve", async () => {
    const mockEmpleados = {
      data: [
        {
          id: 1,
          personaId: 1,
          nombre: "Juan",
          apellido: "Pérez",
          nombreCompleto: "Juan Pérez",
          email: "juan@test.com",
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEmpleados),
        })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ roles: [] }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
            }),
        })
    );

    const { result } = renderHook(
      () => useEmpleados({ enabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoadingEmpleados).toBe(false));

    expect(result.current.empleados).toBeDefined();
    expect(Array.isArray(result.current.empleados)).toBe(true);
    expect(result.current.pagination).toBeDefined();
    expect(result.current.createEmpleado).toBeDefined();
    expect(result.current.updateEmpleado).toBeDefined();
    expect(result.current.deleteEmpleado).toBeDefined();
  });

  it("expone mutations para crear, editar y eliminar empleados", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [],
              pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
            }),
        })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ roles: [] }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
            }),
        })
    );

    const { result } = renderHook(
      () => useEmpleados({ enabled: true }),
      { wrapper: createWrapper() }
    );

    expect(result.current.createEmpleado).toBeDefined();
    expect(result.current.updateEmpleado).toBeDefined();
    expect(result.current.deleteEmpleado).toBeDefined();
    expect(result.current.createRol).toBeDefined();
    expect(result.current.updateRol).toBeDefined();
    expect(result.current.deleteRol).toBeDefined();
  });
});
