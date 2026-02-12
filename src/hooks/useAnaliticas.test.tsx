/**
 * Tests para los hooks useAnaliticas: useKPIs, useGraficas, useAlertas, useComplementarios.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useKPIs,
  useGraficas,
  useAlertas,
  useComplementarios,
} from "./useAnaliticas";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useKPIs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no ejecuta query cuando faltan fechas", () => {
    const { result } = renderHook(
      () => useKPIs({ enabled: true }),
      { wrapper: createWrapper() }
    );
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("devuelve KPIs cuando fetch resuelve", async () => {
    const mockKPIs = {
      periodo: { desde: "2025-01-01", hasta: "2025-01-31", tipo: "mensual" },
      kpis: {
        ingresosNetos: { valor: 1000, variacion: 0.1, periodoAnterior: 900 },
        tickets: { valor: 50, variacion: 0.05, periodoAnterior: 48 },
        ticketPromedio: { valor: 20, variacion: 0, periodoAnterior: 20 },
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockKPIs),
      })
    );

    const { result } = renderHook(
      () =>
        useKPIs({
          fechaDesde: "2025-01-01",
          fechaHasta: "2025-01-31",
          enabled: true,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.kpis).toBeDefined();
    expect(result.current.data?.kpis.ingresosNetos.valor).toBe(1000);
  });
});

describe("useGraficas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no ejecuta query cuando faltan fechas", () => {
    const { result } = renderHook(
      () => useGraficas({ tipo: "ingresos", enabled: true }),
      { wrapper: createWrapper() }
    );
    expect(result.current.isFetching).toBe(false);
  });

  it("devuelve datos de gráfica cuando fetch resuelve", async () => {
    const mockGrafica = {
      tipo: "ingresos",
      datos: [{ fecha: "2025-01-01", valor: 100 }],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGrafica),
      })
    );

    const { result } = renderHook(
      () =>
        useGraficas({
          tipo: "ingresos",
          fechaDesde: "2025-01-01",
          fechaHasta: "2025-01-31",
          enabled: true,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.tipo).toBe("ingresos");
    expect(Array.isArray(result.current.data?.datos)).toBe(true);
  });
});

describe("useAlertas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve alertas cuando fetch resuelve", async () => {
    const mockAlertas = {
      alertas: { stock: [], cobranzas: [] },
      resumen: { stock: 0, stockUrgentes: 0, cobranzas: 0 },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAlertas),
      })
    );

    const { result } = renderHook(() => useAlertas({ enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.alertas).toBeDefined();
    expect(result.current.data?.resumen).toBeDefined();
  });
});

describe("useComplementarios", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no ejecuta query cuando faltan fechas", () => {
    const { result } = renderHook(
      () => useComplementarios({ enabled: true }),
      { wrapper: createWrapper() }
    );
    expect(result.current.isFetching).toBe(false);
  });
});
