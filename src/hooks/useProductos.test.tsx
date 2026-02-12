/**
 * Tests para el hook useProductos.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useProductos } from "./useProductos";

vi.mock("@/lib/adapters/producto.adapter", () => ({
  productoListAdapter: (data: unknown[]) => data,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useProductos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve productos cuando fetch resuelve", async () => {
    const mockData = {
      data: [{ Id: 1, Descripcion: "Producto 1", CodigoBarra: "123" }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }),
    );

    const { result } = renderHook(() => useProductos(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoadingProductos).toBe(false));

    expect(result.current.isErrorProductos).toBe(false);
    expect(result.current.productos).toBeDefined();
    expect(result.current.paginationMeta).toBeDefined();
    expect(Array.isArray(result.current.productos)).toBe(true);
  });

  it("expone saveMutation y deleteMutation", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      }),
    );

    const { result } = renderHook(() => useProductos(), {
      wrapper: createWrapper(),
    });

    expect(result.current.saveMutation).toBeDefined();
    expect(result.current.deleteMutation).toBeDefined();
  });
});
