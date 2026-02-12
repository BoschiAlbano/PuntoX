/**
 * Tests para el hook useGenericApi.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useGenericApi } from "./useGenericApi";

vi.mock("@/lib/react-query/queryDefaults", () => ({
  dynamicDataQueryOptions: {},
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useGenericApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [],
            meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
          }),
      }),
    );
  });

  it("devuelve datos iniciales vacíos", () => {
    const { result } = renderHook(
      () =>
        useGenericApi({
          endpoint: "/api/test",
          queryKey: "test",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it("carga datos cuando fetch resuelve correctamente", async () => {
    const mockData = {
      data: [{ Id: 1, Descripcion: "Test" }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }),
    );

    const { result } = renderHook(
      () =>
        useGenericApi({
          endpoint: "/api/test",
          queryKey: "test",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual(mockData.data);
    expect(result.current.paginationMeta).toEqual(mockData.meta);
  });

  it("saveMutation llama fetch con POST para crear", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        }),
    });

    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(
      () =>
        useGenericApi({
          endpoint: "/api/test",
          queryKey: "test",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newItem = { Descripcion: "Nuevo Item" };
    await result.current.saveMutation.mutateAsync({
      data: newItem,
      isEdit: false,
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        }),
      );
    });
  });

  it("deleteMutation llama fetch con DELETE", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        }),
    });

    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(
      () =>
        useGenericApi({
          endpoint: "/api/test",
          queryKey: "test",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.deleteMutation.mutateAsync(1);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/test/?Id=1"),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });
});
