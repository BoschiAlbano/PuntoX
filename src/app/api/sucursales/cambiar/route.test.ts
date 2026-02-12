/**
 * Tests para la API de cambiar sucursal (POST).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/lib/sucursal/verifyUserBranch", () => ({
  verifyUserBranchAccess: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuarioSucursal: {
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: any[]) => Promise.all(ops)),
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: "Error interno" }), { status: 500 })
  ),
}));

describe("POST /api/sucursales/cambiar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as any);
  });

  it("retorna 400 cuando el body es inválido (sin sucursalId)", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      user: { id: "user-123" },
    } as any);
    const req = new NextRequest("http://localhost:3000/api/sucursales/cambiar", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con success cuando tiene acceso y sucursalId válido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      user: { id: "user-123" },
    } as any);
    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      usuarioId: 1,
      sucursal: { Id: BigInt(1), Nombre: "Sucursal 1" },
    } as any);
    const req = new NextRequest("http://localhost:3000/api/sucursales/cambiar", {
      method: "POST",
      body: JSON.stringify({ sucursalId: 1 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
