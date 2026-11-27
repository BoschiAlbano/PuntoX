import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerTenant } from "./register-tenant";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { invitarEmpleado } from "@/lib/empleados/invitacion";

vi.mock("@/lib/requireSuperAdmin", () => ({
  requireSuperAdminServer: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/auth/updateUserPermissions", () => ({
  actualizarPermisosEnJWT: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/empleados/invitacion", () => ({ invitarEmpleado: vi.fn() }));
vi.mock("@/lib/supabase/serviceClient", () => ({ getSupabaseServiceClient: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: { usuario: { findFirst: vi.fn() }, $transaction: vi.fn() },
}));

const createUser = vi.fn();
const updateUserById = vi.fn();
const deleteUser = vi.fn();

const form = (campos: Record<string, string>) => {
  const fd = new FormData();
  const base = {
    tenantName: "Kiosco Ana",
    adminNombre: "Ana",
    adminApellido: "Paz",
    adminEmail: "ana@kiosco.com",
    adminUsername: "ana.paz",
    planId: "1",
  };
  for (const [k, v] of Object.entries({ ...base, ...campos })) fd.set(k, v);
  return fd;
};

describe("registerTenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: { admin: { createUser, updateUserById, deleteUser } },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockResolvedValue({ Id: 50n } as any);
    updateUserById.mockResolvedValue({ error: null });
    deleteUser.mockResolvedValue({ error: null });
    vi.mocked(invitarEmpleado).mockResolvedValue({ ok: true, user: { id: "auth-inv" } } as any);
    createUser.mockResolvedValue({ data: { user: { id: "auth-pwd" } }, error: null });
  });

  it("invita al dueño por email (sin contraseña) con su usuario y el comercio", async () => {
    const res = await registerTenant(form({ modoAcceso: "invitacion" }));
    expect(res.ok).toBe(true);
    expect(invitarEmpleado).toHaveBeenCalledWith({
      email: "ana@kiosco.com",
      username: "ana.paz",
      comercio: "Kiosco Ana",
    });
    expect(createUser).not.toHaveBeenCalled();
    expect(res.message).toContain("ana@kiosco.com");
    expect(updateUserById).toHaveBeenCalledWith("auth-inv", { app_metadata: { tenantId: "50" } });
  });

  it("con contraseña: crea la cuenta confirmada como antes", async () => {
    const res = await registerTenant(form({ modoAcceso: "password", adminPassword: "secreta123" }));
    expect(res.ok).toBe(true);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ana@kiosco.com", password: "secreta123", email_confirm: true }),
    );
    expect(invitarEmpleado).not.toHaveBeenCalled();
  });

  it("si se elige contraseña y no se envía, falla la validación", async () => {
    const res = await registerTenant(form({ modoAcceso: "password" }));
    expect(res.ok).toBe(false);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("frena si el nombre de usuario ya existe (en cualquier comercio), antes de crear la cuenta", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1n } as any);
    const res = await registerTenant(form({ modoAcceso: "invitacion" }));
    expect(res).toEqual({
      ok: false,
      error: 'El nombre de usuario "ana.paz" ya está en uso. Elegí otro.',
    });
    expect(prisma.usuario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { Nombre: "ana.paz" } }),
    );
    expect(invitarEmpleado).not.toHaveBeenCalled();
  });

  it("si falla la base, borra la cuenta de Auth (la invitación deja de servir)", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("db caída"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await registerTenant(form({ modoAcceso: "invitacion" }));
    expect(res.ok).toBe(false);
    expect(deleteUser).toHaveBeenCalledWith("auth-inv");
    errorSpy.mockRestore();
  });
});
