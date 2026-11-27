/**
 * Login del lado del servidor: resuelve el email sin exponerlo, aplica el
 * bloqueo por intentos fallidos y devuelve los tokens para el navegador.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/DB/prisma";
import { aplicarLimites, respuestaLimiteExcedido } from "@/lib/rateLimit";
import { registrarIntentoFallido } from "@/lib/auth/intentosFallidos";

const signInWithPassword = vi.fn();
const createClient = vi.fn((url: string, key: string, opciones: unknown) => {
  void url; void key; void opciones;
  return { auth: { signInWithPassword } };
});
vi.mock("@supabase/supabase-js", () => ({
  createClient: (url: string, key: string, opciones: unknown) => createClient(url, key, opciones),
}));

const getUserById = vi.fn();
const adminSignOut = vi.fn();
vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: () => ({
    auth: { admin: { getUserById, signOut: adminSignOut } },
  }),
}));

vi.mock("@/DB/prisma", () => ({
  default: { usuario: { findFirst: vi.fn(), update: vi.fn() } },
}));
vi.mock("@/lib/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rateLimit")>()),
  aplicarLimites: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/auth/intentosFallidos", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/intentosFallidos")>()),
  registrarIntentoFallido: vi.fn().mockResolvedValue({ bloqueado: false }),
}));

const usuarioBase = {
  Id: 7n,
  TenantId: 1n,
  AuthUserId: "auth-7",
  EstaBloqueado: false,
  IntentosFallidos: 0,
  FechaUltimoIntento: null,
  Persona_Empleado: null,
  PerfilUsuario: [],
};

const login = (body: unknown, ip = "1.2.3.4") =>
  POST(
    new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test");
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(usuarioBase as any);
    getUserById.mockResolvedValue({ data: { user: { email: "juan@empresa.com" } } });
    signInWithPassword.mockResolvedValue({
      data: { session: { access_token: "at", refresh_token: "rt" } },
      error: null,
    });
  });

  it("400 si falta usuario o contraseña, sin consultar nada", async () => {
    const res = await login({ username: "juan" });
    expect(res.status).toBe(400);
    expect(aplicarLimites).not.toHaveBeenCalled();
  });

  it("aplica el límite por IP y por usuario; 429 sin tocar la base", async () => {
    vi.mocked(aplicarLimites).mockResolvedValueOnce(respuestaLimiteExcedido(30));
    const res = await login({ username: " Juan ", password: "secreta" });
    expect(res.status).toBe(429);
    const reglas = vi.mocked(aplicarLimites).mock.calls[0][0];
    expect(reglas.map((r) => r.valor)).toEqual(["1.2.3.4", "juan"]);
    expect(prisma.usuario.findFirst).not.toHaveBeenCalled();
  });

  it("200 con los tokens; el email se resuelve en el servidor y nunca se devuelve", async () => {
    const res = await login({ username: "Juan", password: "secreta" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ access_token: "at", refresh_token: "rt" });
    expect(JSON.stringify(data)).not.toContain("@");
    expect(getUserById).toHaveBeenCalledWith("auth-7");
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "juan@empresa.com",
      password: "secreta",
    });
  });

  it("reenvía la IP del usuario a Supabase (Sb-Forwarded-For) con la clave secreta", async () => {
    await login({ username: "juan", password: "secreta" }, "9.9.9.9");
    const [, clave, opcionesRaw] = createClient.mock.calls[0];
    const opciones = opcionesRaw as {
      global: { headers: Record<string, string> };
      auth: { persistSession: boolean };
    };
    expect(clave).toBe("sb_secret_test");
    expect(opciones.global.headers["Sb-Forwarded-For"]).toBe("9.9.9.9");
    expect(opciones.auth.persistSession).toBe(false);
  });

  it("usuario inexistente responde igual que contraseña incorrecta", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
    const res = await login({ username: "nadie", password: "secreta" });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Nombre de usuario o contraseña incorrectos");
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("contraseña incorrecta: cuenta el intento y responde 401", async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { status: 400, code: "invalid_credentials", message: "Invalid login credentials" },
    });
    const res = await login({ username: "juan", password: "mala" });
    expect(res.status).toBe(401);
    expect(registrarIntentoFallido).toHaveBeenCalledWith(
      expect.objectContaining({ Id: 7n }),
      "juan",
      expect.anything(),
    );
  });

  it("si ese intento bloquea la cuenta, responde 403 bloqueado", async () => {
    vi.mocked(registrarIntentoFallido).mockResolvedValueOnce({ bloqueado: true });
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { status: 400, code: "invalid_credentials", message: "Invalid login credentials" },
    });
    const res = await login({ username: "juan", password: "mala" });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ bloqueado: true });
  });

  it("cuenta bloqueada con contraseña correcta: revoca la sesión y responde 403 sin tokens", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      ...usuarioBase,
      EstaBloqueado: true,
    } as any);
    adminSignOut.mockResolvedValue({ error: null });
    const res = await login({ username: "juan", password: "secreta" });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data).not.toHaveProperty("access_token");
    expect(adminSignOut).toHaveBeenCalledWith("at", "local");
  });

  it("login correcto reinicia el contador de intentos fallidos", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      ...usuarioBase,
      IntentosFallidos: 2,
    } as any);
    await login({ username: "juan", password: "secreta" });
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { Id: 7n },
      data: { IntentosFallidos: 0, FechaUltimoIntento: null },
    });
  });

  it("si Supabase limita (429), no cuenta un intento fallido", async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { status: 429, code: "over_request_rate_limit", message: "Too many requests" },
    });
    const res = await login({ username: "juan", password: "secreta" });
    expect(res.status).toBe(429);
    expect(registrarIntentoFallido).not.toHaveBeenCalled();
  });
});
