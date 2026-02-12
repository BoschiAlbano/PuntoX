/**
 * Tests para la API de configuración fiscal (GET, PUT).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: { configuracion: { findFirst: vi.fn(), update: vi.fn() } },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((e: unknown) => {
    const msg = e instanceof PermisoError ? e.message : "Error";
    const status = e instanceof PermisoError ? e.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("GET /api/configuracion/fiscal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso CONFIGURACION", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/configuracion/fiscal");
    let res: Response;
    try {
      res = await GET(req);
    } catch (e) {
      if (e instanceof PermisoError) {
        res = new Response(JSON.stringify({ error: e.message }), { status: e.status });
      } else throw e;
    }
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con fiscal por defecto cuando no hay config", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/configuracion/fiscal");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.fiscal).toBeDefined();
    expect(data.fiscal.moneda).toBe("ARS");
  });

  it("retorna 401 cuando no hay tenantId", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: null,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: [],
    });
    const req = new NextRequest("http://localhost:3000/api/configuracion/fiscal");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("retorna 200 con datos de config existente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({
      Moneda: "USD",
      ZonaHoraria: "UTC",
      Idioma: "en",
      CondicionIvaId: 1,
      PuntoVenta: "001",
      InicioActividades: "2020-01-01",
      CondicionIva: { Id: 1, Descripcion: "IVA" },
    } as any);
    const req = new NextRequest("http://localhost:3000/api/configuracion/fiscal");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.fiscal.moneda).toBe("USD");
  });
});
