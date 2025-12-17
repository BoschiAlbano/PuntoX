/**
 * Tests para la lógica de permisos
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePermiso, PermisoError } from "./requirePermiso";
import prisma from "@/DB/prisma";

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
          },
        },
      })),
    },
  })),
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

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);

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

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);

    await expect(
      requirePermiso("productos:crear")
    ).rejects.toThrow(PermisoError);
  });

  it("debe asignar permiso automáticamente a administradores si no existe", async () => {
    const mockUsuario = {
      Id: BigInt(1),
      TenantId: BigInt(100),
      PerfilUsuario: [
        {
          Perfiles: {
            Id: BigInt(1),
            Tipo: "ADMINISTRADOR" as const,
            PerfilPermiso: [],
          },
        },
      ],
    };

    const mockPermiso = {
      Id: BigInt(1),
      Clave: "productos:crear",
      TenantId: BigInt(100),
      EstaEliminado: false,
    };

    const mockRolesAdmin = [
      { Id: BigInt(1) },
      { Id: BigInt(2) },
    ];

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUsuario as any);
    vi.mocked(prisma.permiso.upsert).mockResolvedValue(mockPermiso as any);
    vi.mocked(prisma.perfiles.findMany).mockResolvedValue(mockRolesAdmin as any);
    vi.mocked(prisma.perfilPermiso.createMany).mockResolvedValue({ count: 2 });
    vi.mocked(prisma.perfilPermiso.findFirst).mockResolvedValue({
      Id: BigInt(1),
      PerfilId: BigInt(1),
      PermisoId: BigInt(1),
    } as any);

    const result = await requirePermiso("productos:crear");

    expect(result.tenantId).toBe(100);
    expect(prisma.permiso.upsert).toHaveBeenCalled();
    expect(prisma.perfiles.findMany).toHaveBeenCalled();
    expect(prisma.perfilPermiso.createMany).toHaveBeenCalled();
  });
});

