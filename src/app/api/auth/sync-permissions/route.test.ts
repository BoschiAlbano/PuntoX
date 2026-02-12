/**
 * Tests para la API sync-permissions (POST).
 * Sincroniza permisos del usuario en el JWT.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/lib/auth/updateUserPermissions", () => ({
  actualizarPermisosEnJWT: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("POST /api/auth/sync-permissions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 cuando no hay usuario autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any);
    const res = await POST();
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("retorna 200 con success cuando el usuario está autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
      },
    } as any);
    const res = await POST();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
