/**
 * Cerrar las demás sesiones: cierra todas las del usuario salvo la actual
 * (identificada por el session_id del JWT en la cookie de Supabase).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({ default: { $executeRawUnsafe: vi.fn() } }));

const b64 = (x: string) => Buffer.from(x).toString("base64url");
const cookieSesion = (sessionId: string) => {
  const token = `h.${b64(JSON.stringify({ session_id: sessionId }))}.s`;
  return `sb-abc-auth-token=base64-${b64(JSON.stringify({ access_token: token }))}`;
};
const cerrarOtras = (cookie?: string) =>
  POST(
    new NextRequest("http://localhost/api/configuracion/seguridad/sesiones/cerrar-otras", {
      method: "POST",
      headers: cookie ? { cookie } : {},
    }),
  );

describe("POST /api/configuracion/seguridad/sesiones/cerrar-otras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue({ tenantId: 3, usuarioId: 9 } as any);
  });

  it("cierra las sesiones del usuario salvo la actual", async () => {
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(2);
    const res = await cerrarOtras(cookieSesion("sess-actual"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sesionesCerradas: 2 });

    const [sql, tenantId, usuarioId, actual] = vi.mocked(prisma.$executeRawUnsafe).mock.calls[0];
    expect(sql).toContain(`"SupabaseSessionId" != $3`);
    expect([tenantId, usuarioId, actual]).toEqual([3n, 9n, "sess-actual"]);
  });

  it("si no identifica la sesión actual no cierra nada (antes cerraba todas, incluida la propia)", async () => {
    const res = await cerrarOtras();
    expect(res.status).toBe(409);
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it("exige el permiso de configuración", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const res = await cerrarOtras(cookieSesion("sess-actual"));
    expect(res.status).toBe(403);
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });
});
