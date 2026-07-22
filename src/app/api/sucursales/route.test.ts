/**
 * Tests para la API de sucursales (GET, POST).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";
import { AppErrorClass } from "@/lib/errors/types";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: {
    sucursal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) => {
    if (err instanceof AppErrorClass) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.statusCode,
      });
    }
    const msg = err instanceof PermisoError ? err.message : "Error interno";
    const status = err instanceof PermisoError ? err.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

const authOk = {
  tenantId: 1,
  usuarioId: 1,
  user: {} as any,
  sucursalId: 0,
  isSuperAdmin: false,
  permissions: ["empleados"],
};

describe("GET /api/sucursales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.sucursal.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Sucursal 1",
        Direccion: null,
        Telefono: null,
        EsPrincipal: true,
        EstaActiva: true,
        FechaCreacion: new Date(),
        _count: { UsuariosSucursales: 2 },
      },
    ] as any);
  });

  it("retorna 403 sin permiso EMPLEADOS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/sucursales");
    const res = await GET(req);
    expect((await res.json()).error).toBeDefined();
    expect(res.status).toBe(403);
  });

  it("retorna 200 con sucursales", async () => {
    const req = new NextRequest("http://localhost:3000/api/sucursales");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.sucursales).toBeDefined();
    expect(Array.isArray(data.sucursales)).toBe(true);
  });
});

describe("POST /api/sucursales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Plan: { Caracteristicas: null },
    } as any);
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.sucursal.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.sucursal.create).mockResolvedValue({
      Id: BigInt(1),
      Nombre: "Nueva Sucursal",
      Direccion: null,
      Telefono: null,
      EsPrincipal: false,
      EstaActiva: true,
    } as any);
  });

  it("retorna 403 sin permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/sucursales", {
      method: "POST",
      body: JSON.stringify({ nombre: "Nueva Sucursal" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("retorna 400 cuando body inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/sucursales", {
      method: "POST",
      body: JSON.stringify({ nombre: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("retorna 400 cuando ya existe sucursal con ese nombre", async () => {
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({ Id: BigInt(1) } as any);
    const req = new NextRequest("http://localhost:3000/api/sucursales", {
      method: "POST",
      body: JSON.stringify({ nombre: "Sucursal Existente" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("nombre");
  });

  it("retorna 201 con sucursal creada", async () => {
    const req = new NextRequest("http://localhost:3000/api/sucursales", {
      method: "POST",
      body: JSON.stringify({ nombre: "Nueva Sucursal" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.sucursal).toBeDefined();
    expect(data.sucursal.id).toBe(1);
    expect(data.sucursal.nombre).toBe("Nueva Sucursal");
  });

  it("retorna 403 cuando se alcanzó el límite de sucursales del plan", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Plan: { Caracteristicas: '{"maxSucursales":1}' },
    } as any);
    vi.mocked(prisma.sucursal.count).mockResolvedValue(1);
    const req = new NextRequest("http://localhost:3000/api/sucursales", {
      method: "POST",
      body: JSON.stringify({ nombre: "Nueva Sucursal" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(prisma.sucursal.create).not.toHaveBeenCalled();
  });
});
