/**
 * Tests para el hook useCajasQuery.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCajasQuery } from "./useCajasQuery";

vi.mock("@/store/useUserStore", () => ({
  useUserStore: vi.fn(),
}));

async function importUserStore() {
  return (await import("@/store/useUserStore")).useUserStore;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useCajasQuery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no ejecuta query cuando no hay sucursal seleccionada", async () => {
    const useUserStore = await importUserStore();
    vi.mocked(useUserStore).mockReturnValue({ currentBranch: null } as any);

    const { result } = renderHook(
      () => useCajasQuery({}),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("devuelve cajas cuando fetch resuelve y hay sucursal", async () => {
    const useUserStore = await importUserStore();
    vi.mocked(useUserStore).mockReturnValue({
      currentBranch: { Id: 1 },
    } as any);

    const mockCajas = {
      data: [{ Id: 1, FechaApertura: "2025-01-01", MontoInicial: 1000 }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCajas),
      })
    );

    const { result } = renderHook(
      () => useCajasQuery({ page: 1, limit: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.data).toBeDefined();
    expect(Array.isArray(result.current.data?.data)).toBe(true);
    expect(result.current.data?.meta).toBeDefined();
  });
});
