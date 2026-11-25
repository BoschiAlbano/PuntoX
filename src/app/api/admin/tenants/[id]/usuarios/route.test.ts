/**
 * Tests para PATCH /api/admin/tenants/[id]/usuarios (acción resetPassword).
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
  default: { usuario: { findFirst: vi.fn() } },
}));
vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: vi.fn(),
}));

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
