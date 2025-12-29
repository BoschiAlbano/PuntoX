/**
 * Tests para el endpoint /api/permisos
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { calcularPermisosUsuario, actualizarPermisosEnJWT } from "@/lib/auth/updateUserPermissions";

// Mock de getSupabaseServerClient
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));

// Mock de updateUserPermissions
vi.mock("@/lib/auth/updateUserPermissions", () => ({
  calcularPermisosUsuario: vi.fn(),
  actualizarPermisosEnJWT: vi.fn(),
}));

describe("GET /api/permisos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar permisos del JWT si están disponibles", async () => {
    const mockUser = {
      id: "test-user-id",
      app_metadata: {
        permissions: ["ventas", "productos"],
        isSuperAdmin: false,
        roles: [{ id: 1, nombre: "Administrador", tipo: "ADMINISTRADOR" }],
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.permisos).toEqual(["ventas", "productos"]);
    expect(data.isSuperAdmin).toBe(false);
    expect(data.roles).toHaveLength(1);
    // No debe consultar DB
    expect(calcularPermisosUsuario).not.toHaveBeenCalled();
  });

  it("debe retornar permisos de DB si no hay en JWT (fallback)", async () => {
    const mockUser = {
      id: "test-user-id",
      app_metadata: {}, // Sin permisos en JWT
    };

    const mockPermisos = {
      permisos: ["ventas", "productos"],
      isSuperAdmin: false,
      roles: [{ id: 1, nombre: "Empleado", tipo: "EMPLEADO" }],
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    vi.mocked(calcularPermisosUsuario).mockResolvedValue(mockPermisos);
    vi.mocked(actualizarPermisosEnJWT).mockResolvedValue();

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.permisos).toEqual(["ventas", "productos"]);
    expect(data.isSuperAdmin).toBe(false);
    // Debe consultar DB
    expect(calcularPermisosUsuario).toHaveBeenCalledWith("test-user-id");
    // Debe actualizar JWT en background
    expect(actualizarPermisosEnJWT).toHaveBeenCalledWith("test-user-id");
  });

  it("debe retornar 401 si el usuario no está autenticado", async () => {
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

  it("debe manejar errores correctamente", async () => {
    vi.mocked(getSupabaseServerClient).mockRejectedValue(
      new Error("Error de conexión")
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error al obtener permisos");
  });

  it("debe detectar SuperAdmin desde JWT", async () => {
    const mockUser = {
      id: "test-user-id",
      app_metadata: {
        permissions: [],
        isSuperAdmin: true, // SuperAdmin
        roles: [],
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isSuperAdmin).toBe(true);
    // No debe consultar DB
    expect(calcularPermisosUsuario).not.toHaveBeenCalled();
  });
});

