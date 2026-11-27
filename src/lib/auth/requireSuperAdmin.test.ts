/**
 * Rutas de /api/admin que antes no exigían superadmin:
 * - check-subscriptions era pública;
 * - configuracion/perfil y configuracion/preferencias-venta tomaban el tenant
 *   de user_metadata (editable por el usuario) y no pedían ningún permiso.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { createError } from "@/lib/errors/types";
import prisma from "@/DB/prisma";
import { requireSuperAdmin } from "./requireSuperAdmin";
import { GET as checkSubscriptions } from "@/app/api/admin/check-subscriptions/route";
import { GET as getPerfil, PUT as putPerfil } from "@/app/api/admin/configuracion/perfil/route";
import {
  GET as getPreferencias,
  PUT as putPreferencias,
} from "@/app/api/admin/configuracion/preferencias-venta/route";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: {
    tenant: { findMany: vi.fn(), findUnique: vi.fn() },
    configuracion: { findFirst: vi.fn() },
  },
}));

const ctx = (isSuperAdmin: boolean) =>
  ({ tenantId: 1, usuarioId: 1, isSuperAdmin, isAdministrador: !isSuperAdmin, permissions: [] }) as any;

const put = (url: string) =>
  new NextRequest(url, { method: "PUT", body: JSON.stringify({}) });

describe("requireSuperAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve el contexto si es superadmin", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(ctx(true));
    expect(await requireSuperAdmin()).toMatchObject({ tenantId: 1, isSuperAdmin: true });
  });

  it("403 para un administrador de comercio", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(ctx(false));
    const r = await requireSuperAdmin();
    expect((r as Response).status).toBe(403);
  });

  it("401 sin sesión", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(createError.unauthorized("No autenticado"));
    const r = await requireSuperAdmin();
    expect((r as Response).status).toBe(401);
  });
});

describe("rutas de /api/admin protegidas", () => {
  beforeEach(() => vi.clearAllMocks());

  const rutas: [string, () => Promise<Response>][] = [
    ["GET check-subscriptions", () => checkSubscriptions()],
    ["GET configuracion/perfil", () => getPerfil()],
    ["PUT configuracion/perfil", () => putPerfil(put("http://localhost/api/admin/configuracion/perfil"))],
    ["GET configuracion/preferencias-venta", () => getPreferencias()],
    [
      "PUT configuracion/preferencias-venta",
      () => putPreferencias(put("http://localhost/api/admin/configuracion/preferencias-venta")),
    ],
  ];

  it.each(rutas)("%s: 401 sin sesión, sin tocar la base", async (_n, llamar) => {
    vi.mocked(getAuthContext).mockRejectedValue(createError.unauthorized("No autenticado"));
    expect((await llamar()).status).toBe(401);
    expect(prisma.tenant.findMany).not.toHaveBeenCalled();
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
    expect(prisma.configuracion.findFirst).not.toHaveBeenCalled();
  });

  it.each(rutas)("%s: 403 para un usuario que no es superadmin", async (_n, llamar) => {
    vi.mocked(getAuthContext).mockResolvedValue(ctx(false));
    expect((await llamar()).status).toBe(403);
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
    expect(prisma.configuracion.findFirst).not.toHaveBeenCalled();
  });

  it("check-subscriptions funciona para el superadmin", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(ctx(true));
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([]);
    const res = await checkSubscriptions();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "No hay tiendas vencidas" });
  });
});
