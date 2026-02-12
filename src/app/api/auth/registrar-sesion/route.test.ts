/**
 * Tests para la API registrar-sesion (POST, DELETE).
 * Registra o actualiza sesiones activas al iniciar sesión.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, DELETE } from "./route";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import prisma from "@/DB/prisma";

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
      },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 1n,
      TenantId: 1n,
    } as any);
    // Primera llamada: SELECT sesión existente (vacío). Segunda: INSERT RETURNING Id
    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ Id: 1n }]);
    const req = new NextRequest("http://localhost:3000/api/auth/registrar-sesion", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toContain("Sesión");
  });
});

describe("DELETE /api/auth/registrar-sesion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 200 al cerrar sesión (siempre retorna 200 por diseño)", async () => {
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(undefined as any);
    const req = new NextRequest("http://localhost:3000/api/auth/registrar-sesion?sesionId=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBeDefined();
  });
});
