import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { notificarCambio2FA } from "@/lib/notificaciones/seguridad";

vi.mock("@/DB/prisma", () => ({ default: { usuario: { findFirst: vi.fn() } } }));
vi.mock("@/lib/supabase/serverClient", () => ({ getSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/notificaciones/seguridad", () => ({ notificarCambio2FA: vi.fn() }));

const listFactors = vi.fn();
const getUser = vi.fn();

const enviar = (evento: string) =>
  POST(
    new NextRequest("http://localhost:3000/api/auth/mfa-evento", {
      method: "POST",
      body: JSON.stringify({ evento }),
    }),
  );

describe("POST /api/auth/mfa-evento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: { getUser, mfa: { listFactors } },
    } as any);
    getUser.mockResolvedValue({ data: { user: { id: "auth-1" } } });
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 9n,
      TenantId: 5n,
      Nombre: "juan",
    } as any);
  });

  it("notifica la activación si el usuario realmente tiene 2FA", async () => {
    listFactors.mockResolvedValue({ data: { totp: [{ id: "f1" }] } });
    const res = await enviar("activado");
    expect(res.status).toBe(200);
    expect(notificarCambio2FA).toHaveBeenCalledWith({
      tenantId: 5n,
      usuarioId: 9n,
      username: "juan",
      activado: true,
    });
  });

  it("notifica la desactivación si ya no tiene factores", async () => {
    listFactors.mockResolvedValue({ data: { totp: [] } });
    expect((await enviar("desactivado")).status).toBe(200);
    expect(notificarCambio2FA).toHaveBeenCalledWith(expect.objectContaining({ activado: false }));
  });

  it("rechaza un aviso que no coincide con el estado real (409)", async () => {
    listFactors.mockResolvedValue({ data: { totp: [{ id: "f1" }] } });
    expect((await enviar("desactivado")).status).toBe(409);
    expect(notificarCambio2FA).not.toHaveBeenCalled();
  });

  it("401 sin sesión y 400 con evento inválido", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await enviar("activado")).status).toBe(401);
    expect((await enviar("otro")).status).toBe(400);
    expect(notificarCambio2FA).not.toHaveBeenCalled();
  });
});
