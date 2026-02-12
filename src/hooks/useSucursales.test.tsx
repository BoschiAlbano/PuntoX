/**
 * Tests para el hook useSucursales.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSucursales } from "./useSucursales";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useSucursales", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve sucursales cuando fetch resuelve", async () => {
    const mockSucursales = [
      { id: 1, nombre: "Central", direccion: "Calle 1", esPrincipal: true, estaActiva: true },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ sucursales: mockSucursales }),
      })
    );

    const { result } = renderHook(() => useSucursales(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockSucursales);
    expect(result.current.isError).toBe(false);
  });

  it("devuelve array vacío cuando la respuesta no tiene sucursales", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    const { result } = renderHook(() => useSucursales(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
  });
});
