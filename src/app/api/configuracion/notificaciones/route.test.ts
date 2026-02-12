/**
 * Tests para la API de notificaciones (GET, PUT).
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

describe("GET /api/configuracion/notificaciones", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso CONFIGURACION", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/configuracion/notificaciones");
    let res: Response;
    try {
      res = await GET(req);
    } catch (e) {
      if (e instanceof PermisoError) {
        res = new Response(JSON.stringify({ error: e.message }), { status: e.status });
      } else throw e;
    }
    expect(res.status).toBe(403);
  });

  it("retorna 200 con notificaciones", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/configuracion/notificaciones");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.notificaciones).toBeDefined();
  });
});

describe("PUT /api/configuracion/notificaciones", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 400 cuando el body es inválido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    const req = new NextRequest("http://localhost:3000/api/configuracion/notificaciones", {
      method: "PUT",
      body: JSON.stringify({ push: "invalid" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("retorna 200 con notificaciones actualizadas", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({ Id: 1 } as any);
    vi.mocked(prisma.configuracion.update).mockResolvedValue({
      NotificacionesPush: true,
      NotificacionesResumenDiario: false,
      NotificacionesStockBajo: true,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/configuracion/notificaciones", {
      method: "PUT",
      body: JSON.stringify({ push: true, resumenDiario: false, stockBajo: true }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.notificaciones).toBeDefined();
  });
});
