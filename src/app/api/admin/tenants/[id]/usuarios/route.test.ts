/**
 * Tests para PATCH /api/admin/tenants/[id]/usuarios (resetPassword, setPassword).
 * generateLink de Supabase NO envía email: la ruta debe devolver el link.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findFirst: vi.fn() },
    tenant: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: vi.fn(),
}));
vi.mock("@/lib/auditoria/registrarAuditoria", () => ({ registrarAuditoria: vi.fn() }));
vi.mock("@/lib/notificaciones/seguridad", () => ({ notificarPasswordCambiadaPorAdmin: vi.fn() }));

const generateLink = vi.fn();

const patchReset = () =>
  PATCH(
    new NextRequest("http://localhost:3000/api/admin/tenants/1/usuarios", {
      method: "PATCH",
      body: JSON.stringify({ usuarioId: 5, action: "resetPassword" }),
    }),
    { params: Promise.resolve({ id: "1" }) },
  );

describe("PATCH /api/admin/tenants/[id]/usuarios — resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue({ isSuperAdmin: true } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 5n,
      AuthUserId: "auth-5",
      Nombre: "ana",
    } as any);
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: "ana@test.com" } },
            error: null,
          }),
          generateLink,
        },
      },
    } as any);
  });

  it("devuelve el link de recuperación y no afirma haber enviado un email", async () => {
    generateLink.mockResolvedValue({
      data: { properties: { action_link: "https://auth.test/recover?token=abc" } },
      error: null,
    });
    const res = await patchReset();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.link).toBe("https://auth.test/recover?token=abc");
    expect(data.message).toContain("ana@test.com");
    expect(data.message).toMatch(/No se envió ningún email/);
    expect(generateLink).toHaveBeenCalledWith({
      type: "recovery",
      email: "ana@test.com",
    });
  });

  it("retorna 500 si generateLink devuelve un action_link vacío", async () => {
    generateLink.mockResolvedValue({
      data: { properties: { action_link: "" } },
      error: null,
    });
    const res = await patchReset();
    expect(res.status).toBe(500);
  });

  it("retorna 403 si no es SuperAdmin", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ isSuperAdmin: false } as any);
    const res = await patchReset();
    expect(res.status).toBe(403);
    expect(generateLink).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/tenants/[id]/usuarios — setPassword", () => {
  const updateUserById = vi.fn();
  const cambiar = (nuevaPassword: unknown, tenant = "4") =>
    PATCH(
      new NextRequest(`http://localhost:3000/api/admin/tenants/${tenant}/usuarios`, {
        method: "PATCH",
        body: JSON.stringify({ usuarioId: 7, action: "setPassword", nuevaPassword }),
      }),
      { params: Promise.resolve({ id: tenant }) },
    );

  beforeEach(() => {
    vi.clearAllMocks();
    // El superadmin es del comercio 1; el usuario, del 4.
    vi.mocked(getAuthContext).mockResolvedValue({ isSuperAdmin: true, tenantId: 1, usuarioId: 1 } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 7n,
      AuthUserId: "auth-7",
      Nombre: "boschi1",
    } as any);
    updateUserById.mockResolvedValue({ error: null });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: { admin: { updateUserById } },
    } as any);
  });

  it("busca el usuario en el comercio de la URL, no en el del superadmin", async () => {
    const res = await cambiar("nueva-clave-1");
    expect(res.status).toBe(200);
    expect(prisma.usuario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { Id: 7n, TenantId: 4n, EstaEliminado: false } }),
    );
    expect(updateUserById).toHaveBeenCalledWith("auth-7", { password: "nueva-clave-1" });
  });

  it("rechaza una contraseña corta sin tocar Supabase", async () => {
    const res = await cambiar("corta");
    expect(res.status).toBe(400);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("404 si el usuario no es de ese comercio", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
    const res = await cambiar("nueva-clave-1");
    expect(res.status).toBe(404);
    expect(updateUserById).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/tenants/[id]/usuarios — hacerDueno", () => {
  const hacerDueno = () =>
    PATCH(
      new NextRequest("http://localhost:3000/api/admin/tenants/4/usuarios", {
        method: "PATCH",
        body: JSON.stringify({ usuarioId: 6, action: "hacerDueno" }),
      }),
      { params: Promise.resolve({ id: "4" }) },
    );
  const usuarioConRol = (Tipo: string, EstaBloqueado = false) =>
    vi.mocked(prisma.usuario.findFirst)
      .mockResolvedValueOnce({ Id: 6n, AuthUserId: "auth-6", Nombre: "boschi1" } as any)
      .mockResolvedValueOnce({ EstaBloqueado, PerfilUsuario: [{ Perfiles: { Tipo } }] } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue({ isSuperAdmin: true, usuarioId: 1 } as any);
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      UsuarioDueno: { Id: 5n, Nombre: "planbasico" },
    } as any);
  });

  it("transfiere la propiedad a un administrador activo del comercio", async () => {
    usuarioConRol("ADMINISTRADOR");
    const res = await hacerDueno();
    expect(res.status).toBe(200);
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { Id: 4n },
      data: { UsuarioDuenoId: 6n },
    });
  });

  it("rechaza a un usuario que no es administrador", async () => {
    usuarioConRol("EMPLEADO");
    const res = await hacerDueno();
    expect(res.status).toBe(400);
    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });

  it("rechaza a un usuario bloqueado", async () => {
    usuarioConRol("ADMINISTRADOR", true);
    const res = await hacerDueno();
    expect(res.status).toBe(400);
    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });
});
