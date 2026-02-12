/**
 * Tests para la API de empleados (GET, POST, PATCH).
 * Estructura de referencia: src/app/api/marcas/route.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PATCH } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/lib/auditoria/registrarAuditoria", () => ({
  registrarAuditoria: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    persona: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    localidad: { findFirst: vi.fn() },
    persona_Empleado: { create: vi.fn() },
    usuario: { findFirst: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));
vi.mock("@/lib/pagination", () => ({
  parsePaginationParams: vi.fn(() => ({ page: 1, limit: 20, skip: 0 })),
  createPaginationResponse: vi.fn((data: unknown[], total: number) => ({
    data,
    pagination: {
      page: 1,
      limit: 20,
      total,
      totalPages: total ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  })),
}));

describe("GET /api/empleados", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso EMPLEADOS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/empleados");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con data y pagination cuando tiene permiso", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    vi.mocked(prisma.persona.count).mockResolvedValue(1);
    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      {
        Id: 1,
        Nombre: "Juan",
        Apellido: "Pérez",
        Mail: "juan@test.com",
        Dni: "12345678",
        Direccion: "Calle 123",
        Telefono: "1234567890",
        LocalidadId: 1,
        Localidad: {
          Descripcion: "Buenos Aires",
          EstaEliminado: false,
          Departamento: null,
        },
        Persona_Empleado: {
          Legajo: 1,
          Usuario: [
            {
              Id: 1,
              Nombre: "juan.perez",
              EstaBloqueado: false,
              PerfilUsuario: [{ Perfiles: { Id: 1, Descripcion: "Empleado", Tipo: "EMPLEADO" } }],
              Sucursales: [],
            },
          ],
        },
      },
    ] as any);
    const req = new NextRequest("http://localhost:3000/api/empleados");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });
});

describe("POST /api/empleados", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "POST",
      body: JSON.stringify({
        nombre: "Juan",
        apellido: "Pérez",
        direccion: "Calle 123",
        localidadId: 1,
        nombreUsuario: "juan.perez",
        password: "password123",
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 con error cuando el body es inválido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "POST",
      body: JSON.stringify({
        nombre: "",
        apellido: "Pérez",
        direccion: "Calle 123",
        localidadId: 1,
        nombreUsuario: "juan.perez",
        password: "password123",
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});

describe("PATCH /api/empleados", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "PATCH",
      body: JSON.stringify({ usuarioId: 1, bloquear: true }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 con error cuando falta usuarioId o bloquear en body", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "PATCH",
      body: JSON.stringify({ bloquear: true }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con estado Suspendido al bloquear usuario cuando el body es válido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["empleados"],
    });
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 1,
      EstaBloqueado: false,
    } as any);
    vi.mocked(prisma.usuario.update).mockResolvedValue({
      Id: 1,
      EstaBloqueado: true,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "PATCH",
      body: JSON.stringify({ usuarioId: 1, bloquear: true }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.estado).toBe("Suspendido");
  });
});
