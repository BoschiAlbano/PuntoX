/**
 * Tests para la API de conceptos de gastos (GET, POST).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: {
    conceptoGastos: {
      findMany: vi.fn(),
      create: vi.fn(),
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

const authOk = { tenantId: 1, user: {} as any, sucursalId: 0, permissions: ["caja"] };

describe("GET /api/conceptos-gastos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.conceptoGastos.findMany).mockResolvedValue([
      { Id: 1, Descripcion: "Concepto 1", EstaEliminado: false },
    ] as any);
  });

  it("lanza PermisoError cuando no tiene permiso CAJA", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/conceptos-gastos");
    await expect(GET(req)).rejects.toThrow(PermisoError);
  });

  it("retorna 200 con conceptosGasto", async () => {
    const req = new NextRequest("http://localhost:3000/api/conceptos-gastos");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.conceptosGasto).toBeDefined();
    expect(Array.isArray(data.conceptosGasto)).toBe(true);
  });
});

describe("POST /api/conceptos-gastos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.conceptoGastos.create).mockResolvedValue({
      Id: BigInt(1),
      Descripcion: "Nuevo concepto",
      EstaEliminado: false,
      TenantId: BigInt(1),
    } as any);
  });

  it("lanza PermisoError cuando no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/conceptos-gastos", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "Nuevo concepto" }),
    });
    await expect(POST(req)).rejects.toThrow(PermisoError);
  });

  it("retorna 400 con details cuando body inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/conceptos-gastos", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.details).toBeDefined();
  });

  it("retorna 201 con concepto creado", async () => {
    const req = new NextRequest("http://localhost:3000/api/conceptos-gastos", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "Nuevo concepto" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.Id).toBe(1);
    expect(data.Descripcion).toBe("Nuevo concepto");
  });
});
