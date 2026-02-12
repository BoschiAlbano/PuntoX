/**
 * Tests para la API de contadores (GET - próximo número comprobante).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: {
    contador: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: "Error interno" }), { status: 500 })
  ),
}));

describe("GET /api/contadores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue({ tenantId: 1 } as any);
  });

  it("retorna 401 cuando getAuthUser devuelve error", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 }),
    } as any);
    const req = new NextRequest("http://localhost:3000/api/contadores?tipoComprobante=1");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 cuando falta tipoComprobante", async () => {
    const req = new NextRequest("http://localhost:3000/api/contadores");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("tipoComprobante");
  });

  it("retorna 400 cuando tipoComprobante inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/contadores?tipoComprobante=0");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("retorna 200 con numero cuando existe contador", async () => {
    vi.mocked(prisma.contador.findFirst).mockResolvedValue({
      Id: BigInt(1),
      Valor: 10,
      TenantId: BigInt(1),
      TipoComprobante: 1,
      EstaEliminado: false,
    } as any);
    vi.mocked(prisma.contador.update).mockResolvedValue({
      Id: BigInt(1),
      Valor: 11,
    } as any);

    const req = new NextRequest("http://localhost:3000/api/contadores?tipoComprobante=1");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.numero).toBe(11);
    expect(data.tipoComprobante).toBe(1);
  });

  it("retorna 200 creando contador cuando no existe", async () => {
    vi.mocked(prisma.contador.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.contador.create).mockResolvedValue({
      Id: BigInt(1),
      Valor: 1,
      TenantId: BigInt(1),
      TipoComprobante: 1,
    } as any);
    vi.mocked(prisma.contador.update).mockResolvedValue({
      Id: BigInt(1),
      Valor: 2,
    } as any);

    const req = new NextRequest("http://localhost:3000/api/contadores?tipoComprobante=1");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.numero).toBeDefined();
    expect(prisma.contador.create).toHaveBeenCalled();
  });
});
