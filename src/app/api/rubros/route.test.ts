/**
 * Tests para la API de rubros (GET, POST, PATCH, DELETE).
 * Estructura alineada con marcas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: {
    rubro: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) => {
    const msg = err instanceof PermisoError ? err.message : "Error interno";
    const status = err instanceof PermisoError ? err.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));
vi.mock("@/lib/pagination", () => ({
  parsePaginationParams: vi.fn(() => ({ page: 1, limit: 20, skip: 0 })),
  createPaginationResponse: vi.fn((data: unknown[], total: number) => ({
    data,
    pagination: { page: 1, limit: 20, total, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  })),
}));

const authOk = { tenantId: 1, usuarioId: 1, user: {} as any, sucursalId: 0, isSuperAdmin: false, permissions: ["productos"] };

describe("GET /api/rubros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.rubro.count).mockResolvedValue(1);
    vi.mocked(prisma.rubro.findMany).mockResolvedValue([
      { Id: 1, Descripcion: "Rubro A", EstaEliminado: false },
    ] as any);
  });

  it("retorna 403 sin permiso PRODUCTOS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/rubros");
    const res = await GET(req);
    expect((await res.json()).error).toBeDefined();
    expect(res.status).toBe(403);
  });

  it("retorna 200 con data y pagination", async () => {
    const req = new NextRequest("http://localhost:3000/api/rubros?limit=20");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
  });
});

describe("POST /api/rubros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.rubro.create).mockResolvedValue({
      Id: BigInt(1),
      Descripcion: "Nuevo rubro",
      EstaEliminado: false,
      TenantId: BigInt(1),
    } as any);
  });

  it("retorna 403 sin permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/rubros", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "Nuevo rubro" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("retorna 400 con details cuando body inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/rubros", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
  });

  it("retorna 201 con rubro creado", async () => {
    const req = new NextRequest("http://localhost:3000/api/rubros", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "Nuevo rubro" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.Id).toBe(1);
    expect(data.Descripcion).toBe("Nuevo rubro");
  });
});

describe("DELETE /api/rubros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
  });

  it("retorna 400 cuando id inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/rubros?id=abc", { method: "DELETE" });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("invalido");
  });

  it("retorna 404 cuando no existe", async () => {
    vi.mocked(prisma.rubro.delete).mockRejectedValue(new Error("record to update not found"));
    const req = new NextRequest("http://localhost:3000/api/rubros?Id=999", { method: "DELETE" });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(404);
  });

  it("retorna 200 con success", async () => {
    vi.mocked(prisma.rubro.delete).mockResolvedValue({ Id: BigInt(1) } as any);
    const req = new NextRequest("http://localhost:3000/api/rubros?Id=1", { method: "DELETE" });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.Id).toBe(1);
  });
});
