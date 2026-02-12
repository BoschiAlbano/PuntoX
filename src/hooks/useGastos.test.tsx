/**
 * Tests para el hook useGastos.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useGastos } from "./useGastos";

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

describe("useGastos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserStore).mockReturnValue({
      currentBranch: { Id: 1 },
    } as any);
  });

  it("devuelve conceptosGasto cuando fetch resuelve y enableConceptos", async () => {
    const mockConceptos = [{ Id: 1, Descripcion: "Concepto 1" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ conceptosGasto: mockConceptos }),
      }),
    );

    const { result } = renderHook(() => useGastos({ enableConceptos: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoadingConceptos).toBe(false), {
      timeout: 2000,
    });

    expect(result.current.conceptosGasto).toEqual(mockConceptos);
  });

  it("expone agregarGasto y editarGasto mutations", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ conceptosGasto: [] }) }),
    );

    const { result } = renderHook(() => useGastos({ enableConceptos: true }), {
      wrapper: createWrapper(),
    });

    expect(result.current.agregarGasto).toBeDefined();
    expect(result.current.editarGasto).toBeDefined();
    expect(result.current.eliminarGasto).toBeDefined();
  });
});
