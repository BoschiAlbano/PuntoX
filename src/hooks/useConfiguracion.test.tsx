/**
 * Tests para el hook useConfiguracion.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useConfiguracion } from "./useConfiguracion";

vi.mock("@heroui/react", () => ({ addToast: vi.fn() }));
vi.mock("@/lib/auth/errorHandler", () => ({ handleError: vi.fn() }));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useConfiguracion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve configuracion cuando enableConfiguracion y fetch resuelve", async () => {
    const mockConfig = {
      razonSocial: "Test SA",
      nombreFantasia: "Test",
      cuit: "20-12345678-9",
      email: "test@test.com",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ configuracion: mockConfig }),
      })
    );

    const { result } = renderHook(
      () => useConfiguracion({ enableConfiguracion: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoadingConfiguracion).toBe(false));

    expect(result.current.configuracion).toEqual(mockConfig);
    expect(result.current.errorConfiguracion).toBeFalsy();
  });

  it("no hace fetch de configuracion cuando enableConfiguracion es false", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    renderHook(() => useConfiguracion({ enableConfiguracion: false }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).not.toHaveBeenCalled());
  });

  it("expone saveConfiguracion y mutations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    );

    const { result } = renderHook(
      () => useConfiguracion({ enableConfiguracion: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoadingConfiguracion).toBe(false));

    expect(typeof result.current.saveConfiguracion).toBe("function");
    expect(typeof result.current.savePreferenciasVenta).toBe("function");
    expect(result.current.refetchConfiguracion).toBeDefined();
  });
});
