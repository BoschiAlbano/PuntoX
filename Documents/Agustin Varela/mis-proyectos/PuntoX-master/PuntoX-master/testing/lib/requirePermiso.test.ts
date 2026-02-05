/**
 * Tests para helper de seguridad requirePermiso
 *
 * Cubre:
 * - Usuario no autenticado (401)
 * - Usuario sin registro de aplicación / tenant inválido (401)
 * - Permisos obtenidos desde JWT (happy path y 403)
 * - SuperAdmin desde JWT (acceso total sin consultar DB)
 * - Fallback a DB cuando no hay permisos en JWT (happy path y 403)
 * - Errores inesperados mapeados a PermisoError 500
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePermiso, PermisoError } from "@/lib/requirePermiso";
import { PERMISSIONS } from "@/lib/auth/permissions";

vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/updateUserPermissions", () => ({
  calcularPermisosUsuario: vi.fn(),
  actualizarPermisosEnJWT: vi.fn().mockResolvedValue(undefined),
}));

describe("requirePermiso (helper de seguridad)", () => {
  const mockSupabase = vi.mocked(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("@/lib/supabase/serverClient").getSupabaseServerClient,
  );
  const mockPrisma = vi.mocked(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("@/DB/prisma").default,
  );
  const mockUpdatePerms = vi.mocked(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("@/lib/auth/updateUserPermissions"),
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupSupabaseUser = (user: any | null) => {
    mockSupabase.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
    } as any);
  };

  it("lanza PermisoError 401 cuando no hay usuario autenticado", async () => {
    setupSupabaseUser(null);

    await expect(
      requirePermiso(PERMISSIONS.PRODUCTOS),
    ).rejects.toMatchObject({
      status: 401,
      message: "No autenticado",
    } satisfies Partial<PermisoError>);

    expect(mockPrisma.usuario.findFirst).not.toHaveBeenCalled();
    expect(mockUpdatePerms.calcularPermisosUsuario).not.toHaveBeenCalled();
  });

  it("lanza PermisoError 401 cuando el usuario no existe en el tenant", async () => {
    setupSupabaseUser({ id: "auth-1", app_metadata: {} });

    mockPrisma.usuario.findFirst.mockResolvedValue(null);

    await expect(
      requirePermiso(PERMISSIONS.VENTAS),
    ).rejects.toMatchObject({
      status: 401,
      message: "Usuario no encontrado en el tenant",
    } satisfies Partial<PermisoError>);

    expect(mockPrisma.usuario.findFirst).toHaveBeenCalledWith({
      where: { AuthUserId: "auth-1", EstaEliminado: false },
      select: {
        Id: true,
        TenantId: true,
      },
    });
  });

  it("usa permisos del JWT cuando están presentes y el usuario tiene el permiso requerido", async () => {
    setupSupabaseUser({
      id: "auth-2",
      app_metadata: {
        tenant_id: "10",
        permissions: [PERMISSIONS.VENTAS, PERMISSIONS.PRODUCTOS],
      },
    });

    mockPrisma.usuario.findFirst.mockResolvedValue({
      Id: BigInt(5),
      TenantId: BigInt(10),
    } as any);

    const result = await requirePermiso(PERMISSIONS.PRODUCTOS);

    expect(result).toEqual({
      tenantId: 10,
      usuarioId: 5,
      permisos: [PERMISSIONS.VENTAS, PERMISSIONS.PRODUCTOS],
    });
    expect(mockUpdatePerms.calcularPermisosUsuario).not.toHaveBeenCalled();
  });

  it("lanza PermisoError 403 cuando JWT tiene permisos pero falta el requerido", async () => {
    setupSupabaseUser({
      id: "auth-3",
      app_metadata: {
        tenant_id: "10",
        permissions: [PERMISSIONS.VENTAS],
      },
    });

    mockPrisma.usuario.findFirst.mockResolvedValue({
      Id: BigInt(6),
      TenantId: BigInt(10),
    } as any);

    await expect(
      requirePermiso(PERMISSIONS.PRODUCTOS),
    ).rejects.toMatchObject({
      status: 403,
      message: "Sin permisos",
    } satisfies Partial<PermisoError>);

    expect(mockUpdatePerms.calcularPermisosUsuario).not.toHaveBeenCalled();
  });

  it("retorna permisos '*' cuando isSuperAdmin viene en el JWT", async () => {
    setupSupabaseUser({
      id: "auth-4",
      app_metadata: {
        tenant_id: "99",
        isSuperAdmin: true,
        permissions: [],
      },
    });

    mockPrisma.usuario.findFirst.mockResolvedValue({
      Id: BigInt(7),
      TenantId: BigInt(99),
    } as any);

    const result = await requirePermiso(PERMISSIONS.CAJA_ADMIN);

    // SuperAdmin tiene acceso completo sin consultar DB ni validar permiso individual
    expect(result).toEqual({
      tenantId: 99,
      usuarioId: 7,
      permisos: ["*"],
    });
    expect(mockUpdatePerms.calcularPermisosUsuario).not.toHaveBeenCalled();
  });

  it("usa fallback a DB cuando no hay permisos en JWT y valida permiso requerido", async () => {
    setupSupabaseUser({
      id: "auth-5",
      app_metadata: {
        tenant_id: "50",
        permissions: [],
      },
    });

    mockPrisma.usuario.findFirst.mockResolvedValue({
      Id: BigInt(8),
      TenantId: BigInt(50),
    } as any);

    mockUpdatePerms.calcularPermisosUsuario.mockResolvedValue({
      permisos: [PERMISSIONS.VENTAS, PERMISSIONS.CAJA],
      isSuperAdmin: false,
    });

    const result = await requirePermiso(PERMISSIONS.CAJA);

    expect(result).toEqual({
      tenantId: 50,
      usuarioId: 8,
      permisos: [PERMISSIONS.VENTAS, PERMISSIONS.CAJA],
    });
    expect(mockUpdatePerms.calcularPermisosUsuario).toHaveBeenCalledWith(
      "auth-5",
    );
    expect(mockUpdatePerms.actualizarPermisosEnJWT).toHaveBeenCalledWith(
      "auth-5",
    );
  });

  it("retorna '*' cuando fallback a DB marca isSuperAdmin=true aunque JWT no lo tenga", async () => {
    setupSupabaseUser({
      id: "auth-6",
      app_metadata: {
        tenant_id: "70",
        permissions: [],
        isSuperAdmin: false,
      },
    });

    mockPrisma.usuario.findFirst.mockResolvedValue({
      Id: BigInt(9),
      TenantId: BigInt(70),
    } as any);

    mockUpdatePerms.calcularPermisosUsuario.mockResolvedValue({
      permisos: [PERMISSIONS.VENTAS],
      isSuperAdmin: true,
    });

    const result = await requirePermiso(PERMISSIONS.PRODUCTOS);

    expect(result).toEqual({
      tenantId: 70,
      usuarioId: 9,
      permisos: ["*"],
    });
  });

  it("lanza PermisoError 403 cuando fallback a DB no incluye el permiso requerido", async () => {
    setupSupabaseUser({
      id: "auth-7",
      app_metadata: {
        tenant_id: "80",
        permissions: [],
      },
    });

    mockPrisma.usuario.findFirst.mockResolvedValue({
      Id: BigInt(10),
      TenantId: BigInt(80),
    } as any);

    mockUpdatePerms.calcularPermisosUsuario.mockResolvedValue({
      permisos: [PERMISSIONS.VENTAS],
      isSuperAdmin: false,
    });

    await expect(
      requirePermiso(PERMISSIONS.PRODUCTOS),
    ).rejects.toMatchObject({
      status: 403,
      message: "Sin permisos",
    } satisfies Partial<PermisoError>);
  });

  it("mapea errores inesperados a PermisoError 500 'Error verificando permisos'", async () => {
    setupSupabaseUser({
      id: "auth-8",
      app_metadata: {
        tenant_id: "90",
        permissions: [],
      },
    });

    mockPrisma.usuario.findFirst.mockResolvedValue({
      Id: BigInt(11),
      TenantId: BigInt(90),
    } as any);

    const unexpected = new Error("DB down");
    mockUpdatePerms.calcularPermisosUsuario.mockRejectedValue(unexpected);

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(
      requirePermiso(PERMISSIONS.PRODUCTOS),
    ).rejects.toMatchObject({
      status: 500,
      message: "Error verificando permisos",
    } satisfies Partial<PermisoError>);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error calculando permisos:",
      unexpected,
    );
    consoleSpy.mockRestore();
  });
});

