/**
 * Tests para la API de estadísticas de seguridad (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: { $queryRawUnsafe: vi.fn() },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((e: unknown) => {
    const msg = e instanceof PermisoError ? e.message : "Error";
    const status = e instanceof PermisoError ? e.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("GET /api/configuracion/seguridad/estadisticas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso CONFIGURACION", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/estadisticas");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("retorna 200 con estadísticas", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([{ count: 2n }])
      .mockResolvedValueOnce([{ count: 1n }])
      .mockResolvedValueOnce([{ FechaUltimaActividad: new Date() }])
      .mockResolvedValueOnce([{ count: 0n }])
      .mockResolvedValueOnce([{ count: 5n }]);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/estadisticas");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.estadisticas).toBeDefined();
  });
});
