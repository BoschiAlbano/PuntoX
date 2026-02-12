/**
 * Tests para la API de clientes (GET, POST).
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
vi.mock("@/DB/prisma", () => ({
  default: {
    persona: { count: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    localidad: { findFirst: vi.fn() },
    condicionIva: { findFirst: vi.fn() },
    persona_Cliente: { create: vi.fn() },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
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

describe("GET /api/clientes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso CLIENTES", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/clientes");
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
      permissions: ["clientes"],
    });
    vi.mocked(prisma.persona.count).mockResolvedValue(0);
    vi.mocked(prisma.persona.findMany).mockResolvedValue([]);
    const req = new NextRequest("http://localhost:3000/api/clientes");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });
});

describe("POST /api/clientes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/clientes", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 con error y details cuando el body es inválido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["clientes"],
    });
    const req = new NextRequest("http://localhost:3000/api/clientes", {
      method: "POST",
      body: JSON.stringify({
        Nombre: "",
        Apellido: "X",
        Direccion: "Y",
        Mail: "a@b.com",
        LocalidadId: 1,
        CondicionIvaId: 1,
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
  });
});
