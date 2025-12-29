/**
 * Tests para la lógica de permisos
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePermiso, PermisoError } from "./requirePermiso";
import prisma from "@/DB/prisma";
import { calcularPermisosUsuario, actualizarPermisosEnJWT } from "@/lib/auth/updateUserPermissions";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

// Tipos para mocks
type MockUsuario = {
  Id: bigint;
  TenantId: bigint;
  PerfilUsuario: Array<{
    Perfiles: {
      Id: bigint;
      Tipo: "ADMINISTRADOR" | "EMPLEADO";
      Descripcion?: string | null;
      PerfilPermiso: Array<{
        Permiso: {
          Clave: string;
          EstaEliminado: boolean;
        };
      }>;
    };
  }>;
};

// Mock de Prisma
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: {
      findFirst: vi.fn(),
    },
    permiso: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    perfiles: {
      findMany: vi.fn(),
    },
    perfilPermiso: {
      createMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

// Mock de getSupabaseServerClient
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: {
          user: {
            id: "test-user-id",
            app_metadata: {},
          },
        },
      })),
    },
  })),
}));

// Mock de updateUserPermissions
vi.mock("@/lib/auth/updateUserPermissions", () => ({
  calcularPermisosUsuario: vi.fn(),
  actualizarPermisosEnJWT: vi.fn(),
}));

describe("requirePermiso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe lanzar error si el usuario no está autenticado", async () => {
    // Mock de usuario no autenticado
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);

    await expect(
      requirePermiso("productos:crear")
    ).rejects.toThrow(PermisoError);
  });

  it("debe retornar tenantId si el usuario tiene el permiso", async () => {
    const mockUsuario = {
      Id: BigInt(1),
      TenantId: BigInt(100),
      PerfilUsuario: [
        {
          Perfiles: {
            Id: BigInt(1),
            Tipo: "ADMINISTRADOR" as const,
            PerfilPermiso: [
              {
                Permiso: {
                  Clave: "productos:crear",
                  EstaEliminado: false,
                },
              },
            ],
          },
        },
      ],
    };

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as MockUsuario);

    const result = await requirePermiso("productos:crear");

    expect(result.tenantId).toBe(100);
    expect(result.usuarioId).toBe(1);
  });

  it("debe lanzar error si el usuario no tiene el permiso", async () => {
    const mockUsuario = {
      Id: BigInt(1),
      TenantId: BigInt(100),
      PerfilUsuario: [
        {
          Perfiles: {
            Id: BigInt(1),
            Tipo: "EMPLEADO" as const,
            PerfilPermiso: [
              {
                Permiso: {
                  Clave: "productos:ver",
                  EstaEliminado: false,
                },
              },
            ],
          },
        },
      ],
    };

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as MockUsuario);

    await expect(
      requirePermiso("productos:crear")
    ).rejects.toThrow(PermisoError);
  });

  it("debe lanzar error si el administrador no tiene el permiso explícitamente asignado", async () => {
    // Nota: La auto-asignación de permisos a administradores fue removida.
    // Los administradores ahora necesitan permisos explícitos asignados.
    const mockUsuario = {
      Id: BigInt(1),
      TenantId: BigInt(100),
      PerfilUsuario: [
        {
          Perfiles: {
            Id: BigInt(1),
            Tipo: "ADMINISTRADOR" as const,
            Descripcion: "Administrador",
            PerfilPermiso: [], // Sin permisos asignados
          },
        },
      ],
    };

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as MockUsuario);

    await expect(
      requirePermiso("productos:crear")
    ).rejects.toThrow(PermisoError);
  });

  describe("Permisos desde JWT", () => {
    it("debe leer permisos del JWT primero (sin consultar DB)", async () => {
      const mockUser = {
        id: "test-user-id",
        app_metadata: {
          permissions: ["productos:crear", "ventas"],
          isSuperAdmin: false,
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

      const mockUsuario = {
        Id: BigInt(1),
        TenantId: BigInt(100),
      };

      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);

      const result = await requirePermiso("productos:crear");

      expect(result.tenantId).toBe(100);
      expect(result.usuarioId).toBe(1);
      expect(result.permisos).toContain("productos:crear");
      // No debe llamar a calcularPermisosUsuario (no hay fallback)
      expect(calcularPermisosUsuario).not.toHaveBeenCalled();
    });

    it("debe hacer fallback a DB si no hay permisos en JWT", async () => {
      const mockUser = {
        id: "test-user-id",
        app_metadata: {}, // Sin permisos en JWT
      };

      vi.mocked(getSupabaseServerClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any);

      const mockUsuario = {
        Id: BigInt(1),
        TenantId: BigInt(100),
      };

      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);
      vi.mocked(calcularPermisosUsuario).mockResolvedValue({
        permisos: ["productos:crear"],
        isSuperAdmin: false,
        roles: [],
      });
      vi.mocked(actualizarPermisosEnJWT).mockResolvedValue();

      const result = await requirePermiso("productos:crear");

      expect(result.tenantId).toBe(100);
      expect(result.usuarioId).toBe(1);
      // Debe hacer fallback a DB
      expect(calcularPermisosUsuario).toHaveBeenCalledWith("test-user-id");
      // Debe actualizar JWT en background
      expect(actualizarPermisosEnJWT).toHaveBeenCalledWith("test-user-id");
    });

    it("debe permitir acceso a SuperAdmin desde JWT", async () => {
      const mockUser = {
        id: "test-user-id",
        app_metadata: {
          permissions: [],
          isSuperAdmin: true, // SuperAdmin
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

      const mockUsuario = {
        Id: BigInt(1),
        TenantId: BigInt(100),
      };

      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);

      const result = await requirePermiso("cualquier:permiso");

      expect(result.tenantId).toBe(100);
      expect(result.usuarioId).toBe(1);
      expect(result.permisos).toEqual(["*"]); // SuperAdmin tiene acceso completo
      // No debe consultar DB
      expect(calcularPermisosUsuario).not.toHaveBeenCalled();
    });

    it("debe lanzar error si no tiene permiso en JWT", async () => {
      const mockUser = {
        id: "test-user-id",
        app_metadata: {
          permissions: ["ventas"], // No tiene "productos:crear"
          isSuperAdmin: false,
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

      const mockUsuario = {
        Id: BigInt(1),
        TenantId: BigInt(100),
      };

      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);

      await expect(
        requirePermiso("productos:crear")
      ).rejects.toThrow(PermisoError);
    });
  });
});

