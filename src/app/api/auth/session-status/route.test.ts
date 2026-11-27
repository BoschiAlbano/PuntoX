/**
 * Heartbeat de sesión: cada dispositivo debe evaluarse por SU sesión
 * (session_id del JWT). Antes, al no poder leer la cookie, tomaba "la sesión
 * más reciente del usuario" y cerrar sesión en un dispositivo expulsaba a todos.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import prisma from "@/DB/prisma";

const getUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser } })),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    configuracion: { findFirst: vi.fn() },
  },
}));

const b64 = (x: string) => Buffer.from(x).toString("base64url");
const cookieSesion = (sessionId: string) => {
  const token = `h.${b64(JSON.stringify({ session_id: sessionId }))}.s`;
  return `sb-abc-auth-token=base64-${b64(JSON.stringify({ access_token: token }))}`;
};
const consultar = (cookie?: string) =>
  GET(
    new NextRequest("http://localhost:3000/api/auth/session-status", {
      headers: cookie ? { cookie } : {},
    }),
  );

describe("GET /api/auth/session-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    getUser.mockResolvedValue({
      data: { user: { id: "auth-1", app_metadata: { tenantId: 1 } } },
      error: null,
    });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(null);
  });

  it("busca SU sesión por el session_id de la cookie (formato base64-)", async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { Id: 5n, FechaUltimaActividad: new Date(), EstaActiva: true },
    ] as any);
    const data = await (await consultar(cookieSesion("sess-pc"))).json();
    expect(data).toEqual({ activa: true });
    const [sql, , , sessionId] = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0];
    expect(sql).toContain(`sa."SupabaseSessionId" = $3`);
    expect(sessionId).toBe("sess-pc");
  });

  it("si SU sesión fue cerrada, avisa sesionCerrada", async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { Id: 5n, FechaUltimaActividad: new Date(), EstaActiva: false },
    ] as any);
    const data = await (await consultar(cookieSesion("sess-pc"))).json();
    expect(data).toEqual({ activa: false, sesionCerrada: true });
  });

  it("si no puede identificar la sesión, NO expulsa (no usa la más reciente del usuario)", async () => {
    const data = await (await consultar()).json();
    expect(data).toEqual({ activa: true });
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
  });
});
