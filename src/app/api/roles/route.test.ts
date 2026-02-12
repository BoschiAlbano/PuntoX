/**
 * Tests para la API de roles (GET, POST).
 * Estructura de referencia: src/app/api/marcas/route.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/lib/auditoria/registrarAuditoria", () => ({
  registrarAuditoria: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    perfiles: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    permiso: { upsert: vi.fn() },
    perfilPermiso: { createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("GET /api/roles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso EMPLEADOS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/roles");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con roles cuando tiene permiso", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    vi.mocked(prisma.perfiles.findMany).mockResolvedValue([
      {
        Id: 1,
        Descripcion: "Vendedor",
        Tipo: "EMPLEADO",
        PerfilUsuario: [],
        PerfilPermiso: [{ Permiso: { Clave: "ventas", Descripcion: "Ventas", EstaEliminado: false } }],
      },
    ] as any);
    const req = new NextRequest("http://localhost:3000/api/roles");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.roles).toBeDefined();
    expect(Array.isArray(data.roles)).toBe(true);
    expect(data.roles[0].nombre).toBe("Vendedor");
  });
});

describe("POST /api/roles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/roles", {
      method: "POST",
      body: JSON.stringify({ nombre: "Rol Test", tipo: "EMPLEADO" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 con error cuando el body es inválido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/roles", {
      method: "POST",
      body: JSON.stringify({ nombre: "", tipo: "EMPLEADO" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos invalidos");
  });

  it("retorna 201 con rol creado cuando el body es válido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue(null);
    const rolCreado = {
      Id: 1,
      Descripcion: "Rol Test",
      Tipo: "EMPLEADO",
    };
    const permisos = [{ Id: 1n, Clave: "ventas", Descripcion: "Ventas" }];
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        perfiles: { create: vi.fn().mockResolvedValue(rolCreado) },
        permiso: { upsert: vi.fn().mockResolvedValue(permisos[0]) },
        perfilPermiso: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
      };
      return fn(tx);
    });
    const req = new NextRequest("http://localhost:3000/api/roles", {
      method: "POST",
      body: JSON.stringify({ nombre: "Rol Test", tipo: "EMPLEADO" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.rol).toBeDefined();
    expect(data.rol.nombre).toBe("Rol Test");
    expect(data.rol.id).toBe(1);
  });
});
