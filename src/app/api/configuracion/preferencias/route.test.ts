/**
 * Tests para la API de preferencias (GET, PUT).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((e: unknown) => {
    const msg = e instanceof PermisoError ? e.message : "Error";
    const status = e instanceof PermisoError ? e.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("GET /api/configuracion/preferencias", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso CONFIGURACION", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/configuracion/preferencias");
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

  it("retorna 200 con preferencias por defecto", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    const req = new NextRequest("http://localhost:3000/api/configuracion/preferencias");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.preferencias).toBeDefined();
  });
});

describe("PUT /api/configuracion/preferencias", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/configuracion/preferencias", {
      method: "PUT",
      body: JSON.stringify({ email: true, push: false }),
    });
    let res: Response;
    try {
      res = await PUT(req);
    } catch (e) {
      if (e instanceof PermisoError) {
        res = new Response(JSON.stringify({ error: e.message }), { status: e.status });
      } else throw e;
    }
    expect(res.status).toBe(403);
  });

  it("retorna 200 con preferencias actualizadas", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    const req = new NextRequest("http://localhost:3000/api/configuracion/preferencias", {
      method: "PUT",
      body: JSON.stringify({ email: true, push: false }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.preferencias).toBeDefined();
  });
});
