/**
 * Tests para la API de marcas (GET, POST, PATCH, DELETE).
 *
 * Este archivo es la ESTRUCTURA DE REFERENCIA para el resto de tests de API del proyecto:
 * - getAuthContext con permission (PERMISSIONS.PRODUCTOS / equivalente)
 * - Mocks: getAuthContext, prisma, handleError (PermisoError ��� 403), parsePaginationParams, createPaginationResponse
 * - GET: 403 sin permiso, 200 con { data, pagination }
 * - POST: 403, 400 body inv?lido ({ error: "Datos inv?lidos", details }), 201 con recurso creado
 * - PATCH: 403, 400 body inv?lido, 201 con recurso actualizado
 * - DELETE: 403, 400 id inv?lido, 404 no encontrado, 200 { success: true, Id }
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";
import { AppErrorClass } from "@/lib/errors/types";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    marca: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    if (error instanceof AppErrorClass) {
      return new Response(
        JSON.stringify({ error: { code: error.code, message: error.message } }),
        { status: error.statusCode },
      );
    }
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));
vi.mock("@/lib/pagination", () => ({
  parsePaginationParams: vi.fn(() => ({ page: 1, limit: 20, skip: 0 })),
  createPaginationResponse: vi.fn((data: unknown[], total: number) => ({
    data,
    pagination: {
      page: 1,
      limit: 20,
      total,
      totalPages: total ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  })),
}));

describe("GET /api/marcas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso PRODUCTOS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/marcas");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con data y pagination cuando tiene permiso", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.marca.count).mockResolvedValue(1);
    vi.mocked(prisma.marca.findMany).mockResolvedValue([
      {
        Id: 1,
        Descripcion: "Marca A",
        EstaEliminado: false,
        _count: { Articulo: 5 },
      },
    ] as any);
    const req = new NextRequest("http://localhost:3000/api/marcas?limit=20");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data[0].CantidadProductos).toBe(5);
  });
});

describe("POST /api/marcas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/marcas", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "Nueva marca" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 con error y details cuando el body es inv?lido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    const req = new NextRequest("http://localhost:3000/api/marcas", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inv?lidos");
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
  });

  it("retorna 201 con la marca creada cuando el body es v?lido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.marca.create).mockResolvedValue({
      Id: 1,
      Descripcion: "Nueva marca",
      EstaEliminado: false,
      TenantId: 1,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/marcas", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "Nueva marca" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.Id).toBe(1);
    expect(data.Descripcion).toBe("Nueva marca");
  });
});

describe("PATCH /api/marcas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/marcas", {
      method: "PATCH",
      body: JSON.stringify({ Id: 1, Descripcion: "Editada" }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 con error y details cuando el body es inv?lido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    const req = new NextRequest("http://localhost:3000/api/marcas", {
      method: "PATCH",
      body: JSON.stringify({ Id: 1, Descripcion: "" }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inv?lidos");
    expect(data.details).toBeDefined();
  });

  it("retorna 201 con la marca actualizada cuando el body es v?lido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.marca.update).mockResolvedValue({
      Id: 1,
      Descripcion: "Marca editada",
      EstaEliminado: false,
      TenantId: 1,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/marcas", {
      method: "PATCH",
      body: JSON.stringify({ Id: 1, Descripcion: "Marca editada" }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.Id).toBe(1);
    expect(data.Descripcion).toBe("Marca editada");
  });
});

describe("DELETE /api/marcas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/marcas?Id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 cuando el id es inv?lido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    const req = new NextRequest("http://localhost:3000/api/marcas?id=abc", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("invalido");
  });

  it("retorna 404 cuando la marca no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.marca.findUnique).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/marcas?Id=999", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Marca no encontrada");
  });

  it("invierte el estado (toggle) cuando no se pide borrado permanente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.marca.findUnique).mockResolvedValue({ EstaEliminado: false } as any);
    vi.mocked(prisma.marca.update).mockResolvedValue({ Id: 1 } as any);
    const req = new NextRequest("http://localhost:3000/api/marcas?Id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.Id).toBe(1);
    expect(prisma.marca.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { EstaEliminado: true } }),
    );
  });

  it("rechaza el borrado permanente si la marca sigue activa", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.marca.findUnique).mockResolvedValue({ EstaEliminado: false } as any);
    const req = new NextRequest("http://localhost:3000/api/marcas?Id=1&permanente=true", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("desactivar");
  });

  it("elimina definitivamente cuando ya está inactiva", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.marca.findUnique).mockResolvedValue({ EstaEliminado: true } as any);
    vi.mocked(prisma.marca.delete).mockResolvedValue({ Id: 1 } as any);
    const req = new NextRequest("http://localhost:3000/api/marcas?Id=1&permanente=true", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.marca.delete).toHaveBeenCalled();
  });

  it("devuelve un mensaje amigable si el borrado permanente falla por relaciones", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.marca.findUnique).mockResolvedValue({ EstaEliminado: true } as any);
    vi.mocked(prisma.marca.delete).mockRejectedValue(new Error("Foreign key constraint failed"));
    const req = new NextRequest("http://localhost:3000/api/marcas?Id=1&permanente=true", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(409);
    expect(data.error.message).toContain("productos asociados");
  });
});
