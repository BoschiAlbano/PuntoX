/**
 * Tests para getAuthUser (wrapper deprecado) y invalidateUserCache.
 * getAuthContext requiere muchos mocks (cookies, Supabase, requestContext).
 * Probamos el wrapper getAuthUser que maneja errores y las funciones de invalidación.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAuthUser,
  invalidateUserCache,
  invalidateBranchCache,
} from "./getAuthUser";

vi.mock("./requestContext", () => ({
  getRequestAuthContext: vi.fn().mockReturnValue(null),
  setRequestAuthContext: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(null),
  }),
}));
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findFirst: vi.fn() },
    usuarioSucursal: { count: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

describe("getAuthUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna error 401 cuando no hay usuario autenticado", async () => {
    const result = await getAuthUser(false);
    expect(result.user).toBeNull();
    expect(result.tenantId).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(401);
  });
});

describe("invalidateUserCache", () => {
  it("no lanza error al invalidar (limpia caches internos)", () => {
    expect(() => invalidateUserCache("auth-1")).not.toThrow();
    expect(() => invalidateUserCache("auth-1", 1)).not.toThrow();
  });
});

describe("invalidateBranchCache", () => {
  it("no lanza error al invalidar", () => {
    expect(() => invalidateBranchCache(1)).not.toThrow();
  });
});
