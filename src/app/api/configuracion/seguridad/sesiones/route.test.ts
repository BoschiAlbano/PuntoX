/**
 * Tests para la API de sesiones activas (GET).
 * El cierre de sesiones se hace desde ./cerrar-otras (el DELETE por id se eliminó en 43cbc70).
 * Estructura de referencia: src/app/api/marcas/route.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
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
/** Arma un JWT falso con el claim session_id (solo se decodifica el payload). */
const fakeJwt = (sessionId: string) =>
  `h.${Buffer.from(JSON.stringify({ session_id: sessionId })).toString("base64url")}.s`;

const mockSupabaseSession = (accessToken: string | null) =>
  vi.mocked(getSupabaseServerClient).mockResolvedValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: accessToken ? { access_token: accessToken } : null },
      }),
    },
  } as any);

describe("GET /api/configuracion/seguridad/sesiones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseSession(null);
  });

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

  it("marca esActual en la sesión cuyo SupabaseSessionId coincide con el token", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["configuracion"],
    });
    mockSupabaseSession(fakeJwt("sess-actual"));
    const base = {
      UsuarioId: 1n,
      UsuarioNombre: "admin",
      IpAddress: null,
      UserAgent: null,
      Dispositivo: null,
      Ubicacion: null,
      FechaInicio: new Date("2025-01-01"),
      FechaUltimaActividad: new Date("2025-01-01"),
      EsConfiable: false,
    };
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { ...base, Id: 1n, SupabaseSessionId: "sess-actual" },
      { ...base, Id: 2n, SupabaseSessionId: "sess-otra" },
    ] as any);
    const res = await GET(
      new NextRequest("http://localhost:3000/api/configuracion/seguridad/sesiones"),
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.sesiones.map((x: any) => x.esActual)).toEqual([true, false]);
  });
});
