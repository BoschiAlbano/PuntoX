/**
 * Tests para la API de último código de producto (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    articulo: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: err instanceof PermisoError ? err.message : "Error interno" }), {
      status: err instanceof PermisoError ? 403 : 500,
    })
  ),
}));

describe("GET /api/productos/ultimo-codigo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 si no tiene permiso PRODUCTOS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/productos/ultimo-codigo");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con ultimoCodigo cuando hay productos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.articulo.findFirst).mockResolvedValue({
      Codigo: 42,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/productos/ultimo-codigo");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ultimoCodigo).toBe(43);
  });

  it("retorna 200 con ultimoCodigo 1 cuando no hay productos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.articulo.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/productos/ultimo-codigo");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ultimoCodigo).toBe(1);
  });
});
