/**
 * Tests para el hook useCaja.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCaja } from "./useCaja";

vi.mock("@/store/useUserStore", () => ({
  useUserStore: vi.fn(),
}));
vi.mock("@heroui/react", () => ({ addToast: vi.fn() }));

import { useUserStore } from "@/store/useUserStore";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useCaja", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserStore).mockReturnValue({
      currentBranch: { Id: 1 },
      user: { Id: 1 },
    } as any);
  });

  it("devuelve cajaActual cuando fetch resuelve y enableCaja", async () => {
    const mockCaja = { Id: 1, MontoInicial: 1000, FechaApertura: "2025-01-01" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ caja: mockCaja }),
      }),
    );

    const { result } = renderHook(
      () => useCaja({ enableCaja: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 2000,
    });

    expect(result.current.cajaActual).toEqual(mockCaja);
  });

  it("expone abrirCaja y cerrarCaja", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ caja: null }) }),
    );

    const { result } = renderHook(
      () => useCaja({ enableCaja: true }),
      { wrapper: createWrapper() },
    );

    expect(result.current.abrirCaja).toBeDefined();
    expect(result.current.cerrarCaja).toBeDefined();
  });
});
