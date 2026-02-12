/**
 * Tests para la API de sucursal por ID (GET, PATCH).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    sucursal: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: err instanceof PermisoError ? err.message : "Error interno" }), {
      status: err instanceof PermisoError ? 403 : 500,
    })
  ),
}));

describe("GET /api/sucursales/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 si no tiene permiso EMPLEADOS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/sucursales/1");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 404 cuando la sucursal no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/sucursales/999");
    const res = await GET(req, { params: Promise.resolve({ id: "999" }) });
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toContain("Sucursal");
  });

  it("retorna 200 con sucursal cuando existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: BigInt(1),
      Nombre: "Sucursal Central",
      Direccion: "Calle 1",
      Telefono: "123",
      EsPrincipal: true,
      EstaActiva: true,
      FechaCreacion: new Date(),
      UsuariosSucursales: [],
      _count: { Cajas: 2, Comprobantes: 100 },
    } as any);
    const req = new NextRequest("http://localhost:3000/api/sucursales/1");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.sucursal).toBeDefined();
    expect(data.sucursal.nombre).toBe("Sucursal Central");
    expect(data.sucursal.id).toBe(1);
  });
});

describe("PATCH /api/sucursales/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/sucursales/1", {
      method: "PATCH",
      body: JSON.stringify({ nombre: "Nueva Sucursal" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(403);
  });

  it("retorna 200 con sucursal actualizada cuando el body es válido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    vi.mocked(prisma.sucursal.findFirst)
      .mockResolvedValueOnce({
        Id: BigInt(1),
        Nombre: "Vieja",
        EsPrincipal: false,
      } as any)
      .mockResolvedValueOnce(null); // nombreDuplicado check
    vi.mocked(prisma.sucursal.update).mockResolvedValue({
      Id: BigInt(1),
      Nombre: "Sucursal Editada",
      Direccion: "Nueva Calle",
      EsPrincipal: false,
      EstaActiva: true,
      FechaCreacion: new Date(),
    } as any);
    const req = new NextRequest("http://localhost:3000/api/sucursales/1", {
      method: "PATCH",
      body: JSON.stringify({ nombre: "Sucursal Editada", direccion: "Nueva Calle" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.sucursal.nombre).toBe("Sucursal Editada");
  });
});
