/**
 * Tests para la lógica de permisos
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePermiso, PermisoError } from "./requirePermiso";
import prisma from "@/DB/prisma";

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

type MockPermiso = {
  Id: bigint;
  Clave: string;
  TenantId: bigint;
  EstaEliminado: boolean;
};

type MockPerfil = {
  Id: bigint;
};

type MockPerfilPermiso = {
  Id: bigint;
  PerfilId: bigint;
  PermisoId: bigint;
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
});

