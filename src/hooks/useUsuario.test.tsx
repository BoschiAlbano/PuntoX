/**
 * Tests para el hook useUsuario.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useUsuario } from "./useUsuario";

vi.mock("./useRoles", () => ({
  useRoles: vi.fn(() => ({
    rolesData: { roles: [{ id: 1, nombre: "Admin", tipo: "ADMIN" }] },
    isLoading: false,
  })),
}));
vi.mock("./useSucursales", () => ({
  useSucursales: vi.fn(() => ({
    data: [{ id: 1, nombre: "Central", esPrincipal: true }],
    isLoading: false,
  })),
}));

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

describe("useUsuario", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve roles y sucursales desde hooks mockeados", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ Id: 1, Descripcion: "Buenos Aires" }]),
      })
    );

    const { result } = renderHook(() => useUsuario(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoadingProvincias).toBe(false));

    expect(result.current.roles).toHaveLength(1);
    expect(result.current.roles[0].nombre).toBe("Admin");
    expect(result.current.sucursales).toHaveLength(1);
    expect(result.current.sucursales[0].nombre).toBe("Central");
  });

  it("expone useDepartamentos y useLocalidades", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    );

    const { result } = renderHook(() => useUsuario(), {
      wrapper: createWrapper(),
    });

    expect(result.current.useDepartamentos).toBeDefined();
    expect(result.current.useLocalidades).toBeDefined();
    expect(typeof result.current.useDepartamentos).toBe("function");
    expect(typeof result.current.useLocalidades).toBe("function");
  });
});
