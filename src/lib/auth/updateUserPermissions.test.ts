/**
 * Tests para el sistema de permisos en JWT
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calcularPermisosUsuario,
  actualizarPermisosEnJWT,
  actualizarPermisosUsuariosDelRol,
} from "./updateUserPermissions";
import prisma from "@/DB/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Mock de Prisma
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock de Supabase Admin
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        getUserById: vi.fn(),
        updateUserById: vi.fn(),
      },
    },
  },
}));

// Mock de perfilUsuario
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: {
      findFirst: vi.fn(),
    },
    perfilUsuario: {
      findMany: vi.fn(),
    },
  },
}));

describe("Sistema de Permisos en JWT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calcularPermisosUsuario", () => {
    it("debe calcular permisos correctamente desde la DB", async () => {
      const mockUsuario = {
        Id: BigInt(1),
        TenantId: BigInt(100),
        PerfilUsuario: [
          {
            Perfiles: {
              Id: BigInt(1),
              Descripcion: "Administrador",
              Tipo: "ADMINISTRADOR" as const,
              PerfilPermiso: [
                {
                  Permiso: {
                    Clave: "ventas",
                    EstaEliminado: false,
                  },
                },
                {
                  Permiso: {
                    Clave: "productos",
                    EstaEliminado: false,
                  },
                },
              ],
            },
          },
        ],
      };

      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);

      const result = await calcularPermisosUsuario("test-auth-id");

      expect(result.permisos).toContain("ventas");
      expect(result.permisos).toContain("productos");
      expect(result.isSuperAdmin).toBe(false);
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].nombre).toBe("Administrador");
    });

    it("debe detectar SuperAdmin correctamente", async () => {
      const mockUsuario = {
        Id: BigInt(1),
        TenantId: BigInt(100),
        PerfilUsuario: [
          {
            Perfiles: {
              Id: BigInt(1),
              Descripcion: "SuperAdmin",
              Tipo: "ADMINISTRADOR" as const,
              PerfilPermiso: [
                {
                  Permiso: {
                    Clave: "ventas",
                    EstaEliminado: false,
                  },
                },
              ],
            },
          },
        ],
      };

      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);

      const result = await calcularPermisosUsuario("test-auth-id");

      expect(result.isSuperAdmin).toBe(true);
    });

    it("debe retornar permisos vacíos si el usuario no existe", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);

      const result = await calcularPermisosUsuario("invalid-id");

      expect(result.permisos).toEqual([]);
      expect(result.isSuperAdmin).toBe(false);
      expect(result.roles).toEqual([]);
    });

    it("debe filtrar permisos eliminados", async () => {
      const mockUsuario = {
        Id: BigInt(1),
        TenantId: BigInt(100),
        PerfilUsuario: [
          {
            Perfiles: {
              Id: BigInt(1),
              Descripcion: "Empleado",
              Tipo: "EMPLEADO" as const,
              PerfilPermiso: [
                {
                  Permiso: {
                    Clave: "ventas",
                    EstaEliminado: false,
                  },
                },
                {
                  Permiso: {
                    Clave: "productos",
                    EstaEliminado: true, // Eliminado
                  },
                },
              ],
            },
          },
        ],
      };

      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);

      const result = await calcularPermisosUsuario("test-auth-id");

      expect(result.permisos).toContain("ventas");
      expect(result.permisos).not.toContain("productos");
    });
  });

  describe("actualizarPermisosEnJWT", () => {
    it("debe actualizar permisos en el JWT correctamente", async () => {
      const mockUsuario = {
        Id: BigInt(1),
        TenantId: BigInt(100),
        PerfilUsuario: [
          {
            Perfiles: {
              Id: BigInt(1),
              Descripcion: "Administrador",
              Tipo: "ADMINISTRADOR" as const,
              PerfilPermiso: [
                {
                  Permiso: {
                    Clave: "ventas",
                    EstaEliminado: false,
                  },
                },
              ],
            },
          },
        ],
      };

      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);
      vi.mocked(supabaseAdmin.auth.admin.getUserById).mockResolvedValue({
        data: {
          user: {
            id: "test-auth-id",
            app_metadata: { tenantId: "100" },
          },
        },
        error: null,
      } as any);
      vi.mocked(supabaseAdmin.auth.admin.updateUserById).mockResolvedValue({
        data: { user: {} },
        error: null,
      } as any);

      await actualizarPermisosEnJWT("test-auth-id");

      expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
        "test-auth-id",
        expect.objectContaining({
          app_metadata: expect.objectContaining({
            permissions: expect.arrayContaining(["ventas"]),
            isSuperAdmin: false,
            permissionsVersion: expect.any(Number),
          }),
        })
      );
    });

    it("debe preservar otros metadatos al actualizar", async () => {
      const mockUsuario = {
        Id: BigInt(1),
        TenantId: BigInt(100),
        PerfilUsuario: [],
      };

      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);
      vi.mocked(supabaseAdmin.auth.admin.getUserById).mockResolvedValue({
        data: {
          user: {
            id: "test-auth-id",
            app_metadata: {
              tenantId: "100",
              customField: "customValue",
            },
          },
        },
        error: null,
      } as any);
      vi.mocked(supabaseAdmin.auth.admin.updateUserById).mockResolvedValue({
        data: { user: {} },
        error: null,
      } as any);

      await actualizarPermisosEnJWT("test-auth-id");

      const updateCall = vi.mocked(supabaseAdmin.auth.admin.updateUserById).mock.calls[0];
      const metadata = updateCall[1]?.app_metadata as any;

      expect(metadata.customField).toBe("customValue");
      expect(metadata.tenantId).toBe("100");
    });
  });

  describe("actualizarPermisosUsuariosDelRol", () => {
    it("debe actualizar permisos de todos los usuarios con un rol", async () => {
      const mockPerfilUsuarios = [
        {
          Usuario: {
            AuthUserId: "user-1",
          },
        },
        {
          Usuario: {
            AuthUserId: "user-2",
          },
        },
      ];

      vi.mocked(prisma.perfilUsuario.findMany).mockResolvedValue(
        mockPerfilUsuarios as any
      );

      // Mock de calcularPermisosUsuario para cada usuario
      vi.mocked(prisma.usuario.findFirst)
        .mockResolvedValueOnce({
          Id: BigInt(1),
          TenantId: BigInt(100),
          PerfilUsuario: [],
        } as any)
        .mockResolvedValueOnce({
          Id: BigInt(2),
          TenantId: BigInt(100),
          PerfilUsuario: [],
        } as any);

      vi.mocked(supabaseAdmin.auth.admin.getUserById).mockResolvedValue({
        data: {
          user: {
            id: "test-id",
            app_metadata: {},
          },
        },
        error: null,
      } as any);
      vi.mocked(supabaseAdmin.auth.admin.updateUserById).mockResolvedValue({
        data: { user: {} },
        error: null,
      } as any);

      await actualizarPermisosUsuariosDelRol(BigInt(1), BigInt(100));

      expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledTimes(2);
    });
  });
});

