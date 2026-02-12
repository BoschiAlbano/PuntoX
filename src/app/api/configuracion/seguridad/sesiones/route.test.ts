/**
 * Tests para la API de sesiones activas (GET, DELETE).
 * Estructura de referencia: src/app/api/marcas/route.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, DELETE } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findFirst: vi.fn() },
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("GET /api/configuracion/seguridad/sesiones", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso CONFIGURACION", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/sesiones");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
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
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/sesiones");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("retorna 200 con sesiones vacías cuando no hay sesiones activas", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([]);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/sesiones");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.sesiones).toEqual([]);
  });

  it("retorna 200 con sesiones formateadas", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      {
        Id: 1n,
        UsuarioId: 1n,
        UsuarioNombre: "admin",
        IpAddress: "127.0.0.1",
        UserAgent: "Mozilla",
        Dispositivo: "Chrome",
        Ubicacion: null,
        FechaInicio: new Date("2025-01-01"),
        FechaUltimaActividad: new Date("2025-01-01"),
        EsConfiable: true,
      },
    ] as any);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/sesiones");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.sesiones).toHaveLength(1);
    expect(data.sesiones[0].id).toBe(1);
    expect(data.sesiones[0].usuarioNombre).toBe("admin");
  });
});

describe("DELETE /api/configuracion/seguridad/sesiones", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso CONFIGURACION", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/sesiones?id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 cuando falta el id de sesión", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/sesiones", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("ID de sesión requerido");
  });

  it("retorna 404 cuando la sesión no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-1" } } }) },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1n } as any);
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([]);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/sesiones?id=999", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Sesión no encontrada o ya cerrada");
  });

  it("retorna 200 al cerrar sesión correctamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-1" } } }) },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1n } as any);
    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([{ UsuarioId: 1n, Dispositivo: null, IpAddress: "127.0.0.1", TokenHash: "xxx" }] as any);
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(1 as any);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/sesiones?id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBeDefined();
  });
});
