/**
 * Tests para la API de CtaCteCliente (GET, POST).
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
    comprobante: {
      findMany: vi.fn(),
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
vi.mock("@/lib/services/comprobantes", () => ({
  registrarPagoCuentaCorriente: vi.fn(),
  formaPagoSchema: {},
}));
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));

describe("GET /api/CtaCteCliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 si no tiene permiso CLIENTES", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/CtaCteCliente?clienteId=1");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 cuando falta clienteId", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["clientes"],
    });
    const req = new NextRequest("http://localhost:3000/api/CtaCteCliente");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("Cliente");
  });

  it("retorna 200 con movimientos cuando tiene permiso y clienteId válido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["clientes"],
    });
    vi.mocked(prisma.comprobante.findMany)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any);
    const req = new NextRequest("http://localhost:3000/api/CtaCteCliente?clienteId=1");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("saldoTotal");
    expect(Array.isArray(data.items)).toBe(true);
  });
});
