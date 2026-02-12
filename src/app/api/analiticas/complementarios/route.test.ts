/**
 * Tests para la API de analíticas complementarios (GET).
 * Requiere PERMISSIONS.ANALITICAS.
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
vi.mock("@/lib/constants/comprobantes", () => ({
  PERMISSIONS: { ANALITICAS: "analiticas" },
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    gasto: {
      findMany: vi.fn(),
    },
    caja: {
      findMany: vi.fn(),
    },
    sesionActiva: {
      findMany: vi.fn(),
    },
    auditoriaEmpleado: {
      findMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("GET /api/analiticas/complementarios", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 cuando no tiene permiso ANALITICAS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("Permiso denegado", 403)
    );
    const req = new NextRequest("http://localhost:3000/api/analiticas/complementarios");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con datos cuando tiene permiso y tipo=todos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["analiticas"],
    });
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([]);
    vi.mocked(prisma.caja.findMany).mockResolvedValue([]);
    vi.mocked(prisma.sesionActiva.findMany).mockResolvedValue([]);
    vi.mocked(prisma.auditoriaEmpleado.findMany).mockResolvedValue([]);
    const req = new NextRequest(
      "http://localhost:3000/api/analiticas/complementarios?tipo=todos"
    );
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toBeDefined();
  });
});
