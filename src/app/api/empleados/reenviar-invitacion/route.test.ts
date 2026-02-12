/**
 * Tests para la API de reenviar invitación (POST).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { requirePermiso } from "@/lib/requirePermiso";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/requirePermiso", async () => {
  const actual = await vi.importActual("@/lib/requirePermiso");
  return { ...actual, requirePermiso: vi.fn() };
});
vi.mock("@/DB/prisma", () => ({
  default: {
    persona: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/auditoria/registrarAuditoria", () => ({
  registrarAuditoria: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("POST /api/empleados/reenviar-invitacion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 si no tiene permiso empleados:admin", async () => {
    vi.mocked(requirePermiso).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/empleados/reenviar-invitacion", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", personaId: 1 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 cuando el body es inválido", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({ tenantId: 1, usuarioId: 1 });
    const req = new NextRequest("http://localhost:3000/api/empleados/reenviar-invitacion", {
      method: "POST",
      body: JSON.stringify({ email: "invalid", personaId: 1 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
  });

  it("retorna 400 cuando falta el body", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({ tenantId: 1, usuarioId: 1 });
    const req = new NextRequest("http://localhost:3000/api/empleados/reenviar-invitacion", {
      method: "POST",
      body: "invalid",
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("retorna 404 cuando la persona no existe", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({ tenantId: 1, usuarioId: 1 });
    vi.mocked(prisma.persona.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/empleados/reenviar-invitacion", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", personaId: 999 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toContain("Persona no encontrada");
  });

  it("retorna 404 cuando la persona no tiene empleado asociado", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({ tenantId: 1, usuarioId: 1 });
    vi.mocked(prisma.persona.findFirst).mockResolvedValue({
      Id: 1n,
      Nombre: "Juan",
      Apellido: "Perez",
      Mail: "juan@test.com",
      Persona_Empleado: null,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/empleados/reenviar-invitacion", {
      method: "POST",
      body: JSON.stringify({ email: "juan@test.com", personaId: 1 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toContain("No se encontró información de empleado");
  });

  it("retorna 200 con mensaje de éxito cuando la persona y empleado existen", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({ tenantId: 1, usuarioId: 1 });
    vi.mocked(prisma.persona.findFirst).mockResolvedValue({
      Id: 1n,
      Nombre: "Juan",
      Apellido: "Perez",
      Mail: "juan@test.com",
      Persona_Empleado: {
        Id: 1n,
        Usuario: [{ Id: 1 }],
      },
    } as any);
    const req = new NextRequest("http://localhost:3000/api/empleados/reenviar-invitacion", {
      method: "POST",
      body: JSON.stringify({ email: "juan@test.com", personaId: 1 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBe("Invitación reenviada exitosamente");
    expect(data.email).toBe("juan@test.com");
    expect(data.personaId).toBe(1);
  });
});
