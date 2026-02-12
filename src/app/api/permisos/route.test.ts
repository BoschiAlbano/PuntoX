/**
 * Tests para GET /api/permisos.
 * Esta ruta no usa getAuthContext con permission (usa getSupabaseServerClient).
 * Convención de nombres y describe por método alineada con src/app/api/marcas/route.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { calcularPermisosUsuario, actualizarPermisosEnJWT } from "@/lib/auth/updateUserPermissions";

vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/lib/auth/updateUserPermissions", () => ({
  calcularPermisosUsuario: vi.fn(),
  actualizarPermisosEnJWT: vi.fn(),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Error interno del servidor",
        },
      }),
      { status: 500 }
    );
  }),
}));

describe("GET /api/permisos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si el usuario no está autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("retorna 200 con isSuperAdmin cuando el usuario es SuperAdmin en JWT", async () => {
    const rolesJWT = [{ id: 1, nombre: "SuperAdmin", tipo: "SUPER_ADMIN" }];
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              app_metadata: {
                permissions: [],
                isSuperAdmin: true,
                roles: rolesJWT,
              },
            },
          },
          error: null,
        }),
      },
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isSuperAdmin).toBe(true);
    expect(data.permisos).toEqual([]);
    expect(data.roles).toEqual(rolesJWT);
    expect(calcularPermisosUsuario).not.toHaveBeenCalled();
  });

  it("retorna 200 con permisos desde DB para usuario normal", async () => {
    const permisosDB = ["ventas", "productos"];
    const roles = [{ id: 2, nombre: "Empleado", tipo: "EMPLEADO" }];
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              app_metadata: { permissions: [], isSuperAdmin: false, roles: [] },
            },
          },
          error: null,
        }),
      },
    } as any);
    vi.mocked(calcularPermisosUsuario).mockResolvedValue({
      permisos: permisosDB,
      isSuperAdmin: false,
      roles,
    });
    vi.mocked(actualizarPermisosEnJWT).mockResolvedValue();

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.permisos).toEqual(permisosDB);
    expect(data.isSuperAdmin).toBe(false);
    expect(data.roles).toEqual(roles);
    expect(calcularPermisosUsuario).toHaveBeenCalledWith("user-1");
  });

  it("retorna 200 con isSuperAdmin cuando DB dice SuperAdmin pero JWT no", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              app_metadata: { permissions: [], isSuperAdmin: false, roles: [] },
            },
          },
          error: null,
        }),
      },
    } as any);
    vi.mocked(calcularPermisosUsuario).mockResolvedValue({
      permisos: [],
      isSuperAdmin: true,
      roles: [{ id: 1, nombre: "SuperAdmin", tipo: "SUPER_ADMIN" }],
    });
    vi.mocked(actualizarPermisosEnJWT).mockResolvedValue();

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isSuperAdmin).toBe(true);
    expect(data.permisos).toEqual([]);
  });

  it("retorna 500 cuando getSupabaseServerClient falla", async () => {
    vi.mocked(getSupabaseServerClient).mockRejectedValue(
      new Error("Error de conexión")
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
    expect(data.error.message || data.error).toMatch(/error|interno|conexión/i);
  });
});
