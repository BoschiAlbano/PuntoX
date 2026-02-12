/**
 * Tests para la API de configuración (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: {
    configuracion: {
      findFirst: vi.fn(),
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

describe("GET /api/configuracion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue({ tenantId: 1 } as any);
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({
      Id: BigInt(1),
      RazonSocial: "Empresa Test",
      Cuit: "20123456789",
      Direccion: "Calle 123",
      LocalidadId: 1,
    } as any);
  });

  it("retorna 401 cuando no hay tenantId", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ tenantId: null } as any);
    const req = new NextRequest("http://localhost:3000/api/configuracion");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it("retorna 404 cuando no hay configuración", async () => {
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/configuracion");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toContain("encontrada");
  });

  it("retorna 200 con configuración", async () => {
    const req = new NextRequest("http://localhost:3000/api/configuracion");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.configuracion).toBeDefined();
    expect(data.configuracion.razonSocial).toBe("Empresa Test");
  });
});
