/**
 * Tests para updateUserPermissions: calcularPermisosUsuario.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { calcularPermisosUsuario } from "./updateUserPermissions";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findFirst: vi.fn() },
    perfilUsuario: { findMany: vi.fn() },
  },
}));

describe("calcularPermisosUsuario", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna permisos vacíos cuando el usuario no existe", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
    const result = await calcularPermisosUsuario("auth-invalid");
    expect(result.permisos).toEqual([]);
    expect(result.isSuperAdmin).toBe(false);
    expect(result.roles).toEqual([]);
  });

  it("retorna permisos vacíos cuando el usuario no tiene TenantId", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 1n,
      TenantId: null,
      PerfilUsuario: [],
    } as any);
    const result = await calcularPermisosUsuario("auth-1");
    expect(result.permisos).toEqual([]);
    expect(result.isSuperAdmin).toBe(false);
  });

  it("extrae permisos de los perfiles del usuario", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 1n,
      TenantId: 1n,
      PerfilUsuario: [
        {
          Perfiles: {
            Id: 1n,
            Descripcion: "Vendedor",
            Tipo: "EMPLEADO",
            PerfilPermiso: [
              { Permiso: { Clave: "ventas", EstaEliminado: false } },
              { Permiso: { Clave: "productos", EstaEliminado: false } },
            ],
          },
        },
      ],
    } as any);
    const result = await calcularPermisosUsuario("auth-1");
    expect(result.permisos).toContain("ventas");
    expect(result.permisos).toContain("productos");
    expect(result.isSuperAdmin).toBe(false);
    expect(result.roles).toHaveLength(1);
    expect(result.roles[0].nombre).toBe("Vendedor");
  });

  it("detecta SuperAdmin por descripción del perfil", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 1n,
      TenantId: 1n,
      PerfilUsuario: [
        {
          Perfiles: {
            Id: 1n,
            Descripcion: "SuperAdmin",
            Tipo: "SUPERADMIN",
            PerfilPermiso: [],
          },
        },
      ],
    } as any);
    const result = await calcularPermisosUsuario("auth-admin");
    expect(result.isSuperAdmin).toBe(true);
  });

  it("excluye permisos eliminados", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 1n,
      TenantId: 1n,
      PerfilUsuario: [
        {
          Perfiles: {
            Id: 1n,
            Descripcion: "Rol",
            Tipo: "EMPLEADO",
            PerfilPermiso: [
              { Permiso: { Clave: "ventas", EstaEliminado: false } },
              { Permiso: { Clave: "productos", EstaEliminado: true } },
            ],
          },
        },
      ],
    } as any);
    const result = await calcularPermisosUsuario("auth-1");
    expect(result.permisos).toContain("ventas");
    expect(result.permisos).not.toContain("productos");
  });
});
