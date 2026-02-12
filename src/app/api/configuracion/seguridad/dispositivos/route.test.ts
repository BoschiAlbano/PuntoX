/**
 * Tests para la API de dispositivos confiables (GET, DELETE).
 * Estructura de referencia: src/app/api/marcas/route.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, DELETE } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
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

describe("GET /api/configuracion/seguridad/dispositivos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso CONFIGURACION", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/dispositivos");
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
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/dispositivos");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("retorna 200 con dispositivos vacíos cuando no hay dispositivos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([]);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/dispositivos");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.dispositivos).toEqual([]);
  });

  it("retorna 200 con dispositivos formateados", async () => {
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
        NombreDispositivo: "Chrome Windows",
        UserAgent: "Mozilla",
        IpAddress: "127.0.0.1",
        FechaRegistro: new Date("2025-01-01"),
        FechaUltimoUso: new Date("2025-01-01"),
      },
    ] as any);
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/dispositivos");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.dispositivos).toHaveLength(1);
    expect(data.dispositivos[0].id).toBe(1);
    expect(data.dispositivos[0].nombreDispositivo).toBe("Chrome Windows");
  });
});

describe("DELETE /api/configuracion/seguridad/dispositivos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso CONFIGURACION", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest(
      "http://localhost:3000/api/configuracion/seguridad/dispositivos?id=1",
      { method: "DELETE" }
    );
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 cuando falta el id de dispositivo", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    const req = new NextRequest("http://localhost:3000/api/configuracion/seguridad/dispositivos", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("ID de dispositivo requerido");
  });

  it("retorna 404 cuando el dispositivo no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(0 as any);
    const req = new NextRequest(
      "http://localhost:3000/api/configuracion/seguridad/dispositivos?id=999",
      { method: "DELETE" }
    );
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Dispositivo no encontrado");
  });

  it("retorna 200 al eliminar dispositivo correctamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(1 as any);
    const req = new NextRequest(
      "http://localhost:3000/api/configuracion/seguridad/dispositivos?id=1",
      { method: "DELETE" }
    );
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBe("Dispositivo eliminado correctamente");
  });
});
