/**
 * Tests para la API de branding (GET, PUT).
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
vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: vi.fn().mockReturnValue({
    storage: { from: vi.fn().mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: null }) }) },
  }),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((e: unknown) => {
    const msg = e instanceof PermisoError ? e.message : "Error";
    const status = e instanceof PermisoError ? e.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("GET /api/configuracion/branding", () => {
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
    const req = new NextRequest("http://localhost:3000/api/configuracion/branding");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con branding", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: [],
    });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({ Foto: "logo.png" } as any);
    const req = new NextRequest("http://localhost:3000/api/configuracion/branding");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.branding).toBeDefined();
  });
});
