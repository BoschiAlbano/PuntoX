/**
 * Tests para el hook useCtaCte.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCtaCte } from "./useCtaCte";

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

describe("useCtaCte", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expone useMovimientosCliente, useBuscarClientes, registrarPago", () => {
    const { result } = renderHook(() => useCtaCte(), {
      wrapper: createWrapper(),
    });

    expect(result.current.useMovimientosCliente).toBeDefined();
    expect(result.current.useBuscarClientes).toBeDefined();
    expect(result.current.registrarPago).toBeDefined();
    expect(typeof result.current.registrarPago).toBe("function");
    expect(result.current.isRegistrandoPago).toBe(false);
  });

  it("useMovimientosCliente devuelve movimientos cuando hay clienteId", async () => {
    const mockItems = [
      { id: 1, fecha: "2025-01-01", tipo: "Venta", debe: 100, haber: 0, saldo: 100 },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: mockItems, saldoTotal: 100 }),
      })
    );

    const useMovimientosWithCliente = () => {
      const { useMovimientosCliente } = useCtaCte();
      return useMovimientosCliente(1);
    };

    const { result } = renderHook(useMovimientosWithCliente, {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockItems);
  });
});
