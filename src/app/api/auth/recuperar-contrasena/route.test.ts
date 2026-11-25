/**
 * Tests para POST /api/auth/recuperar-contrasena.
 * Siempre responde lo mismo (anti-enumeración) y solo envía el email cuando
 * el usuario existe, no está bloqueado y tiene un email real.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";

const resetPasswordForEmail = vi.fn();
const getUserById = vi.fn();

vi.mock("@/DB/prisma", () => ({
  default: { usuario: { findFirst: vi.fn() } },
}));
vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { resetPasswordForEmail } })),
}));

const pedir = (body: unknown) =>
  POST(
    new NextRequest("http://localhost:3000/api/auth/recuperar-contrasena", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/auth/recuperar-contrasena", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: { admin: { getUserById } },
    } as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      AuthUserId: "auth-1",
      EstaBloqueado: false,
    } as any);
    getUserById.mockResolvedValue({
      data: { user: { email: "Ana@Comercio.com" } },
      error: null,
    });
    resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it("envía el email de recuperación al email real del usuario", async () => {
    const res = await pedir({ username: "  Ana " });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(prisma.usuario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { Nombre: "ana", EstaEliminado: false },
      }),
    );
    expect(resetPasswordForEmail).toHaveBeenCalledWith("ana@comercio.com");
  });

  it("responde lo mismo sin enviar nada si el usuario no existe", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValueOnce(null);
    const res = await pedir({ username: "nadie" });
    const conUsuario = await pedir({ username: "ana" });
    expect(await res.json()).toEqual(await conUsuario.json());
    expect(resetPasswordForEmail).toHaveBeenCalledTimes(1); // solo el de "ana"
  });

  it("no envía si la cuenta está bloqueada", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      AuthUserId: "auth-1",
      EstaBloqueado: true,
    } as any);
    const res = await pedir({ username: "ana" });
    expect(res.status).toBe(200);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("no envía si el email es interno (@puntox.com)", async () => {
    getUserById.mockResolvedValue({
      data: { user: { email: "ana2026@puntox.com" } },
      error: null,
    });
    const res = await pedir({ username: "ana" });
    expect(res.status).toBe(200);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("no expone errores de Supabase (ej. límite de envíos)", async () => {
    resetPasswordForEmail.mockResolvedValue({
      error: { message: "email rate limit exceeded" },
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await pedir({ username: "ana" });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    errorSpy.mockRestore();
  });

  it("retorna 400 si falta el nombre de usuario", async () => {
    const res = await pedir({ username: " " });
    expect(res.status).toBe(400);
    expect(prisma.usuario.findFirst).not.toHaveBeenCalled();
  });
});
