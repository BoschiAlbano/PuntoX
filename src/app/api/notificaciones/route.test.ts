import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { supabaseSessionIdActual } from "@/lib/auth/sesionActual";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/lib/auth/sesionActual", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/sesionActual")>()),
  supabaseSessionIdActual: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: { notificacion: { findMany: vi.fn(), count: vi.fn() } },
}));

const listar = () => GET(new NextRequest("http://localhost:3000/api/notificaciones?limit=20"));

describe("GET /api/notificaciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue({ tenantId: 1, usuarioId: 7 } as any);
    vi.mocked(prisma.notificacion.findMany).mockResolvedValue([
      {
        Id: 3n,
        TenantId: 1n,
        UsuarioId: 7n,
        Titulo: "t",
        Fecha: new Date("2026-11-27T12:00:00Z"),
      },
    ] as any);
    vi.mocked(prisma.notificacion.count).mockResolvedValue(1);
  });

  it("oculta el aviso de dispositivo nuevo generado por la sesión actual", async () => {
    vi.mocked(supabaseSessionIdActual).mockResolvedValue("sess-abc");
    const res = await listar();
    expect(res.status).toBe(200);

    const where = vi.mocked(prisma.notificacion.findMany).mock.calls[0][0]!.where as any;
    expect(where.AND).toContainEqual({
      OR: [{ EntidadId: null }, { EntidadId: { not: "NUEVO_DISPOSITIVO:sess-abc" } }],
    });
    // El contador de no leídas usa el mismo filtro
    const whereCount = vi.mocked(prisma.notificacion.count).mock.calls[0][0]!.where as any;
    expect(whereCount).toEqual({ ...where, Leida: false });
  });

  it("sin sesión identificable no excluye nada (solo usuario y tenant)", async () => {
    vi.mocked(supabaseSessionIdActual).mockResolvedValue(null);
    await listar();
    const where = vi.mocked(prisma.notificacion.findMany).mock.calls[0][0]!.where as any;
    expect(where).toEqual({
      TenantId: 1n,
      AND: [{ OR: [{ UsuarioId: null }, { UsuarioId: 7n }] }],
    });
  });

  it("serializa los BigInt", async () => {
    vi.mocked(supabaseSessionIdActual).mockResolvedValue(null);
    const data = await (await listar()).json();
    expect(data.data[0]).toMatchObject({ Id: "3", TenantId: "1", UsuarioId: "7" });
    expect(data.pagination.unreadCount).toBe(1);
  });
});
