/**
 * Tests para requirePermiso
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePermiso, PermisoError } from "./requirePermiso";

vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/lib/auth/updateUserPermissions", () => ({
  calcularPermisosUsuario: vi.fn(),
  actualizarPermisosEnJWT: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: {
      findFirst: vi.fn(),
    },
  },
}));

import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { calcularPermisosUsuario, actualizarPermisosEnJWT } from "@/lib/auth/updateUserPermissions";
import prisma from "@/DB/prisma";

describe("requirePermiso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lanza 401 si no hay usuario autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    await expect(requirePermiso("ventas")).rejects.toThrow(PermisoError);
    await expect(requirePermiso("ventas")).rejects.toMatchObject({
      message: "No autenticado",
      status: 401,
    });
  });

  it("lanza 401 si el usuario no existe en la DB (tenant)", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-123", app_metadata: {} } },
          error: null,
        }),
      },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);

    await expect(requirePermiso("ventas")).rejects.toThrow(PermisoError);
    await expect(requirePermiso("ventas")).rejects.toMatchObject({
      message: "Usuario no encontrado en el tenant",
      status: 401,
    });
  });

  it("retorna contexto cuando el usuario tiene el permiso en JWT", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "auth-123",
              app_metadata: {
                permissions: ["ventas", "productos"],
                isSuperAdmin: false,
              },
            },
          },
          error: null,
        }),
      },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(1),
      TenantId: BigInt(100),
    } as any);

    const result = await requirePermiso("ventas");

    expect(result).toEqual({
      tenantId: 100,
      usuarioId: 1,
      permisos: ["ventas", "productos"],
    });
    expect(calcularPermisosUsuario).not.toHaveBeenCalled();
  });

  it("lanza 403 si el usuario no tiene el permiso en JWT", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "auth-123",
              app_metadata: { permissions: ["productos"], isSuperAdmin: false },
            },
          },
          error: null,
        }),
      },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(1),
      TenantId: BigInt(100),
    } as any);

    await expect(requirePermiso("ventas")).rejects.toThrow(PermisoError);
    await expect(requirePermiso("ventas")).rejects.toMatchObject({
      message: "Sin permisos",
      status: 403,
    });
  });

  it("SuperAdmin en JWT tiene acceso sin verificar permiso", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "auth-123",
              app_metadata: { permissions: [], isSuperAdmin: true },
            },
          },
          error: null,
        }),
      },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(1),
      TenantId: BigInt(100),
    } as any);

    const result = await requirePermiso("cualquier_permiso");

    expect(result.permisos).toEqual(["*"]);
    expect(result.tenantId).toBe(100);
    expect(calcularPermisosUsuario).not.toHaveBeenCalled();
  });

  it("fallback a DB cuando no hay permisos en JWT y retorna si tiene permiso", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "auth-123",
              app_metadata: {},
            },
          },
          error: null,
        }),
      },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(1),
      TenantId: BigInt(100),
    } as any);
    vi.mocked(calcularPermisosUsuario).mockResolvedValue({
      permisos: ["ventas", "empleados"],
      isSuperAdmin: false,
      roles: [],
    });
    vi.mocked(actualizarPermisosEnJWT).mockResolvedValue();

    const result = await requirePermiso("ventas");

    expect(result).toEqual({
      tenantId: 100,
      usuarioId: 1,
      permisos: ["ventas", "empleados"],
    });
    expect(calcularPermisosUsuario).toHaveBeenCalledWith("auth-123");
  });

  it("fallback a DB: lanza 403 si no tiene permiso", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: "auth-123", app_metadata: {} },
          },
          error: null,
        }),
      },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(1),
      TenantId: BigInt(100),
    } as any);
    vi.mocked(calcularPermisosUsuario).mockResolvedValue({
      permisos: ["productos"],
      isSuperAdmin: false,
      roles: [],
    });

    await expect(requirePermiso("ventas")).rejects.toThrow(PermisoError);
    await expect(requirePermiso("ventas")).rejects.toMatchObject({
      message: "Sin permisos",
      status: 403,
    });
  });
});
