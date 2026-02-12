/**
 * Tests para la API de tenants admin (GET, PATCH, DELETE).
 * Requiere SuperAdmin.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    tenant: {
      findMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    perfiles: {
      findMany: vi.fn(),
    },
    usuario: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    auth: { admin: { deleteUser: vi.fn() } },
  })),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("GET /api/admin/tenants", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 cuando no es superadmin", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: [],
    });
    const req = new NextRequest("http://localhost:3000/api/admin/tenants");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("retorna 200 con lista de tenants cuando es superadmin", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: true,
      permissions: [],
    });
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Tenant 1",
        Dominio: "tenant1",
        EstaActivo: true,
        OnboardingCompleto: true,
        PlanId: BigInt(1),
        Plan: { Nombre: "Base" },
        Configuraciones: [{ Email: "test@test.com", RazonSocial: "Test" }],
        Usuarios: [],
        _count: { Usuarios: 0 },
      },
    ] as any);
    vi.mocked(prisma.perfiles.findMany).mockResolvedValue([]);
    const req = new NextRequest("http://localhost:3000/api/admin/tenants");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.tenants).toBeDefined();
    expect(Array.isArray(data.tenants)).toBe(true);
    expect(data.totals).toBeDefined();
  });
});

describe("PATCH /api/admin/tenants", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 cuando no es superadmin", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: [],
    });
    const req = new NextRequest("http://localhost:3000/api/admin/tenants", {
      method: "PATCH",
      body: JSON.stringify({ tenantId: 1, action: "activate" }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("retorna 400 cuando falta tenantId o action", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: true,
      permissions: [],
    });
    const req = new NextRequest("http://localhost:3000/api/admin/tenants", {
      method: "PATCH",
      body: JSON.stringify({ tenantId: 1 }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("requeridos");
  });

  it("retorna 200 con success y tenant cuando se actualiza correctamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: true,
      permissions: [],
    });
    vi.mocked(prisma.tenant.update).mockResolvedValue({
      Id: BigInt(1),
      Nombre: "Tenant 1",
      EstaActivo: true,
      OnboardingCompleto: true,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/admin/tenants", {
      method: "PATCH",
      body: JSON.stringify({ tenantId: 1, action: "activate" }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tenant).toBeDefined();
  });
});

describe("DELETE /api/admin/tenants", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 cuando no es superadmin", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: [],
    });
    const req = new NextRequest("http://localhost:3000/api/admin/tenants?id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("retorna 400 cuando falta id", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: true,
      permissions: [],
    });
    const req = new NextRequest("http://localhost:3000/api/admin/tenants", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("requerido");
  });

  it("retorna 404 cuando el tenant no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: true,
      permissions: [],
    });
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/admin/tenants?id=999", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Tenant no encontrado");
  });

  it("retorna 200 con success y message cuando se elimina correctamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: true,
      permissions: [],
    });
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Id: BigInt(1),
      Nombre: "Tenant 1",
    } as any);
    vi.mocked(prisma.usuario.findMany).mockResolvedValue([]);
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost:3000/api/admin/tenants?id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBeDefined();
  });
});
