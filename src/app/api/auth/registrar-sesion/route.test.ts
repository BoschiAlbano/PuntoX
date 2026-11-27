/**
 * Tests para la API registrar-sesion (POST, DELETE).
 * Registra o actualiza sesiones activas al iniciar sesión.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, DELETE } from "./route";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import prisma from "@/DB/prisma";
import { notificarNuevoDispositivo } from "@/lib/notificaciones/seguridad";

vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/lib/notificaciones/seguridad", () => ({
  notificarNuevoDispositivo: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findFirst: vi.fn(), update: vi.fn() },
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  },
}));

describe("POST /api/auth/registrar-sesion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 cuando no hay usuario autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);
    const req = new NextRequest("http://localhost:3000/api/auth/registrar-sesion", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("retorna 400 cuando el usuario no tiene tenantId en metadata", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-1", app_metadata: {} } },
        }),
      },
    } as any);
    const req = new NextRequest("http://localhost:3000/api/auth/registrar-sesion", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("No se pudo determinar el tenant");
  });

  it("retorna 404 cuando el usuario no existe en la BD", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-1", app_metadata: { tenantId: 1 } } },
        }),
        // La ruta lee el session_id del access token cuando no viene en el body.
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/auth/registrar-sesion", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Usuario no encontrado");
  });

  it("retorna 200 al crear o actualizar sesión correctamente", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-1", app_metadata: { tenantId: 1 } } },
        }),
        // La ruta lee el session_id del access token cuando no viene en el body.
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 1n,
      TenantId: 1n,
    } as any);
    // 1) SELECT sesión existente (vacío) 2) sesiones previas del usuario
    // 3) INSERT RETURNING Id
    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0, mismo: 0 }])
      .mockResolvedValueOnce([{ Id: 1n }]);
    const req = new NextRequest("http://localhost:3000/api/auth/registrar-sesion", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toContain("Sesión");
    expect(data.sesionId).toBe(1);
    // Primer inicio de sesión del usuario: no es "dispositivo nuevo"
    expect(notificarNuevoDispositivo).not.toHaveBeenCalled();
  });

  describe("aviso de dispositivo nuevo", () => {
    const loginDesde = async (previas: { total: number; mismo: number }) => {
      vi.mocked(getSupabaseServerClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-1", app_metadata: { tenantId: 1 } } },
          }),
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
      } as any);
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1n, TenantId: 1n } as any);
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([previas])
        .mockResolvedValueOnce([{ Id: 2n }]);
      return POST(
        new NextRequest("http://localhost:3000/api/auth/registrar-sesion", {
          method: "POST",
          headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/130.0",
            "x-forwarded-for": "200.1.2.3",
          },
          body: JSON.stringify({ dispositivo: "Windows - Chrome" }),
        }),
      );
    };

    it("notifica si el usuario ya tenía sesiones pero ninguna desde este navegador", async () => {
      await loginDesde({ total: 3, mismo: 0 });
      expect(notificarNuevoDispositivo).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1n,
          usuarioId: 1n,
          userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/130.0",
          ipAddress: "200.1.2.3",
        }),
      );
    });

    it("no notifica si ya inició sesión antes desde este navegador", async () => {
      await loginDesde({ total: 3, mismo: 2 });
      expect(notificarNuevoDispositivo).not.toHaveBeenCalled();
    });
  });
});

describe("DELETE /api/auth/registrar-sesion", () => {
  const conUsuario = (user: { id: string } | null) =>
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    } as any);
  /** Cookie de Supabase en el formato actual ("base64-..."), con session_id. */
  const cookieSesion = (sessionId: string) => {
    const b64 = (x: string) => Buffer.from(x).toString("base64url");
    const token = `h.${b64(JSON.stringify({ session_id: sessionId }))}.s`;
    return `sb-abc-auth-token=base64-${b64(JSON.stringify({ access_token: token }))}`;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(1 as any);
  });

  it("con sesionId cierra solo esa sesión y solo si es del usuario autenticado", async () => {
    conUsuario({ id: "auth-1" });
    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/auth/registrar-sesion?sesionId=12", { method: "DELETE" }),
    );
    expect(res.status).toBe(200);
    const [sql, id, authId] = vi.mocked(prisma.$executeRawUnsafe).mock.calls[0];
    expect(sql).toContain(`u."AuthUserId" = $2`);
    expect(id).toBe(12n);
    expect(authId).toBe("auth-1");
  });

  it("sin sesionId cierra solo la sesión de la cookie actual (nunca todas)", async () => {
    conUsuario({ id: "auth-1" });
    await DELETE(
      new NextRequest("http://localhost:3000/api/auth/registrar-sesion", {
        method: "DELETE",
        headers: { cookie: cookieSesion("sess-pc") },
      }),
    );
    const [sql, sessionId, authId] = vi.mocked(prisma.$executeRawUnsafe).mock.calls[0];
    expect(sql).toContain(`sa."SupabaseSessionId" = $1`);
    expect(sessionId).toBe("sess-pc");
    expect(authId).toBe("auth-1");
  });

  it("sin sesionId ni cookie identificable no cierra nada", async () => {
    conUsuario({ id: "auth-1" });
    await DELETE(new NextRequest("http://localhost:3000/api/auth/registrar-sesion", { method: "DELETE" }));
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it("sin usuario autenticado no cierra nada (antes cualquiera podía cerrar cualquier sesión por id)", async () => {
    conUsuario(null);
    const res = await DELETE(
      new NextRequest("http://localhost:3000/api/auth/registrar-sesion?sesionId=12", { method: "DELETE" }),
    );
    expect(res.status).toBe(200);
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });
});
