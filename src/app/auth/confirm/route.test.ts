/**
 * Tests para GET /auth/confirm (destino de los links de email de Supabase).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

// redirect() de Next lanza una excepción; se imita para cortar el flujo.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));

const verifyOtp = vi.fn();

const abrir = async (query: string) => {
  try {
    await GET(new NextRequest(`http://localhost:3000/auth/confirm?${query}`));
  } catch (e) {
    return (e as Error).message.replace("REDIRECT:", "");
  }
  throw new Error("La ruta no redirigió");
};

describe("GET /auth/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: { verifyOtp },
    } as any);
    verifyOtp.mockResolvedValue({ error: null });
  });

  it("valida el token de recuperación y va a /restablecer-contrasena", async () => {
    const destino = await abrir("token_hash=abc&type=recovery");
    expect(verifyOtp).toHaveBeenCalledWith({ type: "recovery", token_hash: "abc" });
    expect(destino).toBe("/restablecer-contrasena");
  });

  it("las invitaciones van a crear la contraseña en modo invitación", async () => {
    expect(await abrir("token_hash=abc&type=invite")).toBe(
      "/restablecer-contrasena?modo=invitacion",
    );
  });

  it("respeta un `next` interno", async () => {
    expect(await abrir("token_hash=abc&type=email_change&next=/perfil")).toBe(
      "/perfil",
    );
  });

  it("ignora un `next` externo (redirección abierta)", async () => {
    expect(
      await abrir("token_hash=abc&type=recovery&next=//evil.com"),
    ).toBe("/restablecer-contrasena");
    expect(
      await abrir("token_hash=abc&type=recovery&next=https://evil.com"),
    ).toBe("/restablecer-contrasena");
  });

  it("manda a pedir un link nuevo si el token es inválido o venció", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "Token has expired" } });
    expect(await abrir("token_hash=viejo&type=recovery")).toBe(
      "/recuperar-contrasena?error=link_invalido",
    );
  });

  it("rechaza links sin token o con un tipo desconocido", async () => {
    expect(await abrir("type=recovery")).toBe(
      "/recuperar-contrasena?error=link_invalido",
    );
    expect(await abrir("token_hash=abc&type=otro")).toBe(
      "/recuperar-contrasena?error=link_invalido",
    );
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});
