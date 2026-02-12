/**
 * Tests para la API de cambiar contraseña (PUT).
 * Estructura de referencia: src/app/api/marcas/route.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PUT } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: vi.fn(),
}));
vi.mock("@/lib/auditoria/registrarAuditoria", () => ({
  registrarAuditoria: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("PUT /api/empleados/cambiar-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ data: {}, error: null }),
        },
      },
    } as any);
  });

  it("retorna 403 si no tiene permiso EMPLEADOS y no es el mismo usuario", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/empleados/cambiar-password", {
      method: "PUT",
      body: JSON.stringify({ usuarioId: 2, nuevaPassword: "nueva1234" }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 cuando el body es inválido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    const req = new NextRequest("http://localhost:3000/api/empleados/cambiar-password", {
      method: "PUT",
      body: JSON.stringify({ usuarioId: 1, nuevaPassword: "123" }), // password corta
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos invalidos");
  });

  it("retorna 400 cuando falta el body", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    const req = new NextRequest("http://localhost:3000/api/empleados/cambiar-password", {
      method: "PUT",
      body: "invalid",
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("retorna 404 cuando el usuario no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/empleados/cambiar-password", {
      method: "PUT",
      body: JSON.stringify({ usuarioId: 999, nuevaPassword: "nueva1234" }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Usuario no encontrado");
  });

  it("retorna 200 con mensaje de éxito cuando cambia la contraseña", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 1n,
      AuthUserId: "auth-123",
      Persona_Empleado: { Id: 1, Persona: { Nombre: "Juan", Apellido: "Perez", Mail: "juan@test.com" } },
    } as any);
    const req = new NextRequest("http://localhost:3000/api/empleados/cambiar-password", {
      method: "PUT",
      body: JSON.stringify({ usuarioId: 1, nuevaPassword: "nueva1234" }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBe("Contraseña actualizada correctamente");
  });
});
