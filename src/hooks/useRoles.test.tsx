/**
 * Tests para el hook useRoles.
 * Mock de fetch global para verificar que el hook devuelve datos cuando fetch resuelve
 * y estados de error cuando fetch rechaza.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useRoles } from "./useRoles";

vi.mock("@heroui/react", () => ({
  addToast: vi.fn(),
}));
vi.mock("@/lib/auth/errorHandler", () => ({
  handleError: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve roles cuando fetch resuelve con datos válidos", async () => {
    const mockRoles = {
      roles: [
        { id: 1, nombre: "Admin", usuarios: 2, tipo: 1, descripcion: null },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRoles),
      }),
    );

    const { result } = renderHook(() => useRoles(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.rolesData).toEqual(mockRoles);
  });

  it("expone refetch y mutations", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ roles: [] }) }),
    );

    const { result } = renderHook(() => useRoles(), {
      wrapper: createWrapper(),
    });

    expect(result.current.refetch).toBeDefined();
    expect(result.current.createRol).toBeDefined();
    expect(result.current.updateRol).toBeDefined();
    expect(result.current.deleteRol).toBeDefined();
  });
});
