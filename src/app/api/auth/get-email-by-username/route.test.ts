/**
 * Tests para la API get-email-by-username (POST).
 * Endpoint público usado durante el login para convertir username a email.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) =>
    new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  ),
}));

describe("POST /api/auth/get-email-by-username", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 400 cuando falta el username", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/get-email-by-username", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Nombre de usuario requerido");
  });

  it("retorna 400 cuando username no es string", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/get-email-by-username", {
      method: "POST",
      body: JSON.stringify({ username: 123 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Nombre de usuario requerido");
  });

  it("retorna 404 cuando el usuario no existe", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/auth/get-email-by-username", {
      method: "POST",
      body: JSON.stringify({ username: "noexiste" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Usuario no encontrado");
  });

  it("retorna 200 con email y tenantId cuando el usuario tiene email en Persona", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Persona_Empleado: { Persona: { Mail: "juan@empresa.com", TenantId: 1n } },
      TenantId: 1n,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/auth/get-email-by-username", {
      method: "POST",
      body: JSON.stringify({ username: "juan" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.email).toBe("juan@empresa.com");
    expect(data.tenantId).toBe(1);
    expect(data.isInternal).toBe(false);
  });

  it("retorna 200 con email interno cuando no tiene Persona.Mail", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Persona_Empleado: { Persona: { Mail: null, TenantId: 1n } },
      TenantId: 1n,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/auth/get-email-by-username", {
      method: "POST",
      body: JSON.stringify({ username: "juan" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.email).toContain("@puntox.com");
    expect(data.isInternal).toBe(true);
    expect(data.tenantId).toBe(1);
  });
});
