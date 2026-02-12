/**
 * Tests para la API de configuración de seguridad (GET, PUT).
 * Estructura de referencia: src/app/api/marcas/route.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    configuracion: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
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

describe("GET /api/configuracion/seguridad", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 cuando no hay tenantId", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: null,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: [],
    });
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("retorna 200 con valores por defecto cuando no hay configuración", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: [],
    });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.dobleFactor).toBe(false);
    expect(data.expirarSesiones30Dias).toBe(true);
    expect(data.bloquearTrasIntentos).toBe("5");
  });

  it("retorna 200 con configuración existente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: [],
    });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({
      Forzar2FA: true,
      ExpirarSesiones30Dias: false,
      BloquearTrasIntentos: 10,
      AlertarNuevoDispositivo: false,
      BloquearPorInactividad: true,
      TiempoInactividadMinutos: 15,
      RecordarSesion30Dias: false,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.dobleFactor).toBe(true);
    expect(data.bloquearTrasIntentos).toBe("10");
    expect(data.tiempoInactividadMinutos).toBe(15);
  });
});

describe("PUT /api/configuracion/seguridad", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso CONFIGURACION", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad", {
      method: "PUT",
      body: JSON.stringify({ dobleFactor: true }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 404 cuando no existe configuración", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad", {
      method: "PUT",
      body: JSON.stringify({ dobleFactor: true }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toContain("Configuración no encontrada");
  });

  it("retorna 200 con configuración actualizada cuando el body es válido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({ Id: 1 } as any);
    vi.mocked(prisma.configuracion.update).mockResolvedValue({} as any);
    vi.mocked(prisma.configuracion.findUnique).mockResolvedValue({
      Forzar2FA: true,
      ExpirarSesiones30Dias: true,
      BloquearTrasIntentos: 5,
      AlertarNuevoDispositivo: true,
      BloquearPorInactividad: false,
      TiempoInactividadMinutos: 30,
      RecordarSesion30Dias: true,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad", {
      method: "PUT",
      body: JSON.stringify({ dobleFactor: true }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.dobleFactor).toBe(true);
  });
});
