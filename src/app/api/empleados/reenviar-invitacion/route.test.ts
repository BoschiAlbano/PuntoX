/**
 * Tests para POST /api/empleados/reenviar-invitacion.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { reenviarInvitacionEmpleado } from "@/lib/empleados/invitacion";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: { usuario: { findFirst: vi.fn() } },
}));
vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: vi.fn(),
}));
vi.mock("@/lib/empleados/invitacion", () => ({
  reenviarInvitacionEmpleado: vi.fn(),
}));
vi.mock("@/lib/auditoria/registrarAuditoria", () => ({
  registrarAuditoria: vi.fn().mockResolvedValue(undefined),
}));

const getUserById = vi.fn();
const reenviar = (body: unknown) =>
  POST(
    new NextRequest("http://localhost:3000/api/empleados/reenviar-invitacion", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/empleados/reenviar-invitacion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue({ tenantId: 1, usuarioId: 1 } as any);
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: { admin: { getUserById } },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 7n,
      Nombre: "juan",
      AuthUserId: "auth-7",
      EmpleadoId: 70n,
      Tenant: { Nombre: "Kiosco Ana" },
    } as any);
    getUserById.mockResolvedValue({
      data: { user: { email: "juan@mail.com", email_confirmed_at: null } },
    });
    vi.mocked(reenviarInvitacionEmpleado).mockResolvedValue({ ok: true, via: "invitacion" });
  });

  it("reenvía la invitación con el usuario y el comercio, y audita", async () => {
    const res = await reenviar({ usuarioId: 7 });
    expect(res.status).toBe(200);
    expect(reenviarInvitacionEmpleado).toHaveBeenCalledWith(
      expect.objectContaining({ email: "juan@mail.com" }),
      { username: "juan", comercio: "Kiosco Ana" },
    );
    expect(prisma.usuario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { Id: 7n, TenantId: 1n, EstaEliminado: false },
      }),
    );
    expect(registrarAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "REENVIAR_INVITACION", usuarioAfectadoId: 7n }),
    );
  });

  it("retorna 409 si el empleado ya activó su cuenta", async () => {
    vi.mocked(reenviarInvitacionEmpleado).mockResolvedValue({ ok: false, motivo: "ya_activo" });
    const res = await reenviar({ usuarioId: 7 });
    expect(res.status).toBe(409);
    expect(registrarAuditoria).not.toHaveBeenCalled();
  });

  it("retorna 400 si el empleado tiene email interno", async () => {
    getUserById.mockResolvedValue({
      data: { user: { email: "juan2026@puntox.com", email_confirmed_at: null } },
    });
    const res = await reenviar({ usuarioId: 7 });
    expect(res.status).toBe(400);
    expect(reenviarInvitacionEmpleado).not.toHaveBeenCalled();
  });

  it("retorna 404 si el usuario no es del tenant", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
    expect((await reenviar({ usuarioId: 99 })).status).toBe(404);
  });

  it("retorna 502 si Supabase no pudo enviar el email", async () => {
    vi.mocked(reenviarInvitacionEmpleado).mockResolvedValue({ ok: false, motivo: "error" });
    expect((await reenviar({ usuarioId: 7 })).status).toBe(502);
  });

  it("retorna 400 con body inválido y 403 sin permiso", async () => {
    expect((await reenviar({ usuarioId: "abc" })).status).toBe(400);
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    expect((await reenviar({ usuarioId: 7 })).status).toBe(403);
  });
});
