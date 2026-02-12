/**
 * Tests para la API de perfil del negocio (GET, PUT).
 * Usa resolveTenantId con Supabase server client.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "./route";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    tenant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    configuracion: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("GET /api/admin/configuracion/perfil", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 cuando no hay tenantId", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: null },
          })
        ),
      },
    } as any);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("retorna 404 cuando el tenant no existe", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { user_metadata: { tenantId: 1 } } },
          })
        ),
      },
    } as any);
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Tenant no encontrado");
  });

  it("retorna 200 con datos del perfil cuando existe", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { user_metadata: { tenantId: 1 } } },
          })
        ),
      },
    } as any);
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Nombre: "Mi Negocio",
      Dominio: "minegocio",
    } as any);
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({
      RazonSocial: "Mi Negocio S.A.",
      Cuit: "20-12345678-9",
      Email: "test@test.com",
      Telefono: "1234567890",
    } as any);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.nombre).toBe("Mi Negocio");
    expect(data.razonSocial).toBe("Mi Negocio S.A.");
    expect(data.cuit).toBe("20-12345678-9");
  });
});

describe("PUT /api/admin/configuracion/perfil", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 cuando no hay tenantId", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: null },
          })
        ),
      },
    } as any);
    const req = new NextRequest("http://localhost:3000/api/admin/configuracion/perfil", {
      method: "PUT",
      body: JSON.stringify({
        nombre: "Mi Negocio",
        razonSocial: "Mi Negocio S.A.",
        cuit: "20-12345678-9",
      }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("retorna 400 cuando el body es inválido (falta nombre, razonSocial o cuit)", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { user_metadata: { tenantId: 1 } } },
          })
        ),
      },
    } as any);
    const req = new NextRequest("http://localhost:3000/api/admin/configuracion/perfil", {
      method: "PUT",
      body: JSON.stringify({
        nombre: "",
      }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
  });

  it("retorna 200 con perfil actualizado cuando el body es válido", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { user_metadata: { tenantId: 1 } } },
          })
        ),
      },
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      return await callback({
        tenant: {
          update: vi.fn(),
        },
        configuracion: {
          findFirst: vi.fn().mockResolvedValue({
            Id: BigInt(1),
          }),
          update: vi.fn(),
        },
      });
    });
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Nombre: "Mi Negocio Actualizado",
      Dominio: "minegocio",
    } as any);
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({
      RazonSocial: "Mi Negocio S.A. Actualizado",
      Cuit: "20-12345678-9",
      Email: "test@test.com",
      Telefono: "1234567890",
    } as any);
    const req = new NextRequest("http://localhost:3000/api/admin/configuracion/perfil", {
      method: "PUT",
      body: JSON.stringify({
        nombre: "Mi Negocio Actualizado",
        razonSocial: "Mi Negocio S.A. Actualizado",
        cuit: "20-12345678-9",
        correo: "test@test.com",
        telefono: "1234567890",
        dominio: "minegocio",
      }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.nombre).toBe("Mi Negocio Actualizado");
    expect(data.razonSocial).toBe("Mi Negocio S.A. Actualizado");
    expect(data.cuit).toBe("20-12345678-9");
  });
});
