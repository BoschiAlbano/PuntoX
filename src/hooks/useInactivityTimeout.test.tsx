/**
 * Tests para el hook useInactivityTimeout.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useInactivityTimeout } from "./useInactivityTimeout";

const mockSignOut = vi.fn().mockResolvedValue({});
const mockUseSupabaseAuthContext = vi.fn(() => ({
  supabase: { auth: { signOut: mockSignOut } },
  status: "unauthenticated",
}));

vi.mock("@/components/auth/sessionProvider", () => ({
  useSupabaseAuthContext: () => mockUseSupabaseAuthContext(),
}));

describe("useInactivityTimeout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseSupabaseAuthContext.mockReturnValue({
      supabase: { auth: { signOut: mockSignOut } },
      status: "unauthenticated",
    });

    // Mock fetch
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            bloquearPorInactividad: false,
            tiempoInactividadMinutos: 30,
          }),
      }),
    );

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "sessionStorage", {
      value: sessionStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("no configura timeout si status no es authenticated", async () => {
    mockUseSupabaseAuthContext.mockReturnValue({
      supabase: { auth: { signOut: mockSignOut } },
      status: "unauthenticated",
    });

    renderHook(() => useInactivityTimeout());

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    // Avanzar tiempo para verificar que no se configuró timeout
    vi.advanceTimersByTime(31 * 60 * 1000); // 31 minutos

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("carga configuración de seguridad al montar", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          bloquearPorInactividad: true,
          tiempoInactividadMinutos: 30,
        }),
    });

    vi.stubGlobal("fetch", mockFetch);

    renderHook(() => useInactivityTimeout());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/configuracion/seguridad",
        expect.objectContaining({
          credentials: "include",
          cache: "no-store",
        }),
      );
    });
  });

  it("no configura timeout si bloquearPorInactividad es false", async () => {
    mockUseSupabaseAuthContext.mockReturnValue({
      supabase: { auth: { signOut: mockSignOut } },
      status: "authenticated",
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          bloquearPorInactividad: false,
          tiempoInactividadMinutos: 30,
        }),
    });

    vi.stubGlobal("fetch", mockFetch);

    renderHook(() => useInactivityTimeout());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Avanzar tiempo para verificar que no se configuró timeout
    vi.advanceTimersByTime(31 * 60 * 1000); // 31 minutos

    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
