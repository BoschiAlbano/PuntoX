/**
 * Tests para la API de cajas (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";
import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/lib/sucursal/verifyUserBranch", () => ({
  verifyUserBranchAccess: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    caja: { count: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock("@/lib/pagination", () => ({
  parsePaginationParams: vi.fn(() => ({ page: 1, limit: 20, skip: 0 })),
  createPaginationResponse: vi.fn((data: unknown[], total: number) => ({
    data,
    pagination: { page: 1, limit: 20, total, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  })),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: err instanceof PermisoError ? err.message : "Error interno" }), {
      status: err instanceof PermisoError ? 403 : 500,
    })
  ),
}));

describe("GET /api/cajas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.caja.count).mockResolvedValue(0);
    vi.mocked(prisma.caja.findMany).mockResolvedValue([]);
  });

  it("retorna 403 si no tiene permiso CAJA", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/cajas");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con data y pagination cuando tiene permiso", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: { id: "user-123" } as any,
      sucursalId: 1,
      isSuperAdmin: false,
      permissions: ["caja"],
    });
    const req = new NextRequest("http://localhost:3000/api/cajas");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
  });
});
