/**
 * Tests para la API de registro de usuarios (POST).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";

vi.mock("@/DB/prisma", () => ({
  default: {
    tenant: { findUnique: vi.fn() },
    localidad: { findFirst: vi.fn() },
    persona: { findFirst: vi.fn() },
    usuario: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: vi.fn(),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: "Error interno" }), { status: 500 })
  ),
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEFAULT_TENANT_ID = "1";
  });

  it("retorna 400 cuando faltan campos obligatorios", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        apellido: "Test",
        nombre: "Usuario",
        direccion: "Calle 1",
        mail: "test@test.com",
        localidadId: 1,
        nombreUsuario: "testuser",
        // password faltante
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("requeridos");
  });

  it("retorna 400 cuando la contraseña tiene menos de 8 caracteres", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        apellido: "Test",
        nombre: "Usuario",
        direccion: "Calle 1",
        mail: "test@test.com",
        localidadId: 1,
        nombreUsuario: "testuser",
        password: "123", // muy corta
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("8 caracteres");
  });

  it("retorna 400 cuando el tenant no existe", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        apellido: "Test",
        nombre: "Usuario",
        direccion: "Calle 1",
        mail: "test@test.com",
        localidadId: 1,
        nombreUsuario: "testuser",
        password: "password123",
        tenantId: 999,
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("Tenant");
  });

  it("retorna 400 cuando el nombre de usuario ya está en uso, aunque sea de OTRO tenant", async () => {
    // El login (get-email-by-username) resuelve el username sin filtrar por
    // tenant, así que dos tenants con el mismo username romperían el login:
    // la unicidad tiene que chequearse de forma GLOBAL.
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ Id: BigInt(1) } as any);
    vi.mocked(prisma.localidad.findFirst).mockResolvedValue({ Id: BigInt(1) } as any);
    vi.mocked(prisma.persona.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: BigInt(99) } as any);

    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        apellido: "Test",
        nombre: "Usuario",
        direccion: "Calle 1",
        mail: "otro@test.com",
        localidadId: 1,
        nombreUsuario: "juan.perez",
        password: "password123",
        tenantId: 1,
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("nombre de usuario");
    expect(
      vi.mocked(prisma.usuario.findFirst).mock.calls[0][0],
    ).not.toHaveProperty("where.TenantId");
  });

  it("retorna 201 con userId y personaId cuando el registro es exitoso", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ Id: BigInt(1) } as any);
    vi.mocked(prisma.localidad.findFirst).mockResolvedValue({ Id: BigInt(1) } as any);
    vi.mocked(prisma.persona.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-123" } },
            error: null,
          }),
        },
      },
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        persona: { create: vi.fn().mockResolvedValue({ Id: BigInt(1) }) },
        persona_Empleado: { create: vi.fn().mockResolvedValue({ Id: BigInt(1) }) },
        usuario: { create: vi.fn().mockResolvedValue({ Id: BigInt(1) }) },
      };
      return fn(tx);
    });

    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        apellido: "Test",
        nombre: "Usuario",
        direccion: "Calle 1",
        mail: "nuevo@test.com",
        localidadId: 1,
        nombreUsuario: "nuevouser",
        password: "password123",
        tenantId: 1,
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.message).toContain("exitosamente");
    expect(data.userId).toBe(1);
    expect(data.personaId).toBe(1);
  });
});
