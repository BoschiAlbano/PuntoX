/**
 * Tests para la API de empleados
 * Verifica permisos, validación de datos y manejo de errores
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PATCH } from "./route";
import { requirePermiso, PermisoError } from "@/lib/requirePermiso";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";

// Mock de dependencias
vi.mock("@/lib/requirePermiso", () => ({
  requirePermiso: vi.fn(),
  PermisoError: class PermisoError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
      this.name = "PermisoError";
    }
  },
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
    perfiles: {
      findFirst: vi.fn(),
    },
    localidad: {
      findFirst: vi.fn(),
    },
    persona_Empleado: {
      create: vi.fn(),
    },
    usuario: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error) => {
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }),
}));

vi.mock("@/lib/pagination", () => ({
  parsePaginationParams: vi.fn(() => ({
    page: 1,
    limit: 20,
    skip: 0,
  })),
  createPaginationResponse: vi.fn((data, total, pagination) => ({
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      hasNextPage: pagination.page * pagination.limit < total,
      hasPreviousPage: pagination.page > 1,
    },
  })),
}));

describe("GET /api/empleados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 403 si el usuario no tiene permisos", async () => {
    vi.mocked(requirePermiso).mockRejectedValue(
      new PermisoError("Sin permisos", 403)
    );

    const req = new NextRequest("http://localhost:3000/api/empleados");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("debe retornar lista de empleados con paginación", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({
      tenantId: 100,
      usuarioId: 1,
    });

    vi.mocked(prisma.persona.count).mockResolvedValue(5);
    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Juan",
        Apellido: "Pérez",
        Mail: "juan@test.com",
        Dni: "12345678",
        Direccion: "Calle 123",
        Telefono: "1234567890",
        LocalidadId: BigInt(1),
        Localidad: {
          Descripcion: "Buenos Aires",
          EstaEliminado: false,
        },
        Persona_Empleado: {
          Legajo: 1,
          Usuario: [
            {
              Id: BigInt(1),
              Nombre: "juan.perez",
              EstaBloqueado: false,
              PerfilUsuario: [
                {
                  Perfiles: {
                    Id: BigInt(1),
                    Descripcion: "Empleado",
                    Tipo: "EMPLEADO",
                  },
                },
              ],
            },
          ],
        },
      },
    ] as any);

    const req = new NextRequest("http://localhost:3000/api/empleados");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("debe aplicar filtros de rol y estado correctamente", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({
      tenantId: 100,
      usuarioId: 1,
    });

    vi.mocked(prisma.persona.count).mockResolvedValue(2);
    vi.mocked(prisma.persona.findMany).mockResolvedValue([]);

    const req = new NextRequest(
      "http://localhost:3000/api/empleados?rol=1&estado=Activo"
    );
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(prisma.persona.findMany).toHaveBeenCalled();
  });

  it("debe aplicar filtro de búsqueda correctamente", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({
      tenantId: 100,
      usuarioId: 1,
    });

    vi.mocked(prisma.persona.count).mockResolvedValue(1);
    vi.mocked(prisma.persona.findMany).mockResolvedValue([]);

    const req = new NextRequest(
      "http://localhost:3000/api/empleados?busqueda=juan"
    );
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(prisma.persona.findMany).toHaveBeenCalled();
  });
});

describe("POST /api/empleados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 403 si el usuario no tiene permisos", async () => {
    vi.mocked(requirePermiso).mockRejectedValue(
      new PermisoError("Sin permisos", 403)
    );

    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("debe retornar 400 si los datos son inválidos", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({
      tenantId: 100,
      usuarioId: 1,
    });

    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "POST",
      body: JSON.stringify({
        nombre: "", // Inválido: nombre vacío
      }),
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("debe retornar 400 si la localidad no existe", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({
      tenantId: 100,
      usuarioId: 1,
    });

    vi.mocked(prisma.localidad.findFirst).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "POST",
      body: JSON.stringify({
        nombre: "Juan",
        apellido: "Pérez",
        mail: "juan@test.com",
        direccion: "Calle 123",
        localidadId: 999, // Localidad inexistente
        nombreUsuario: "juan.perez",
        password: "password123",
      }),
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.toLowerCase()).toContain("localidad");
  });
});

describe("PATCH /api/empleados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 403 si el usuario no tiene permisos", async () => {
    vi.mocked(requirePermiso).mockRejectedValue(
      new PermisoError("Sin permisos", 403)
    );

    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("debe retornar 400 si falta usuarioId", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({
      tenantId: 100,
      usuarioId: 1,
    });

    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "PATCH",
      body: JSON.stringify({
        bloquear: true,
        // Falta usuarioId
      }),
    });
    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("debe actualizar el estado del usuario correctamente", async () => {
    vi.mocked(requirePermiso).mockResolvedValue({
      tenantId: 100,
      usuarioId: 1,
    });

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(1),
      EstaBloqueado: false,
    } as any);

    vi.mocked(prisma.usuario.update).mockResolvedValue({
      Id: BigInt(1),
      EstaBloqueado: true,
    } as any);

    const req = new NextRequest("http://localhost:3000/api/empleados", {
      method: "PATCH",
      body: JSON.stringify({
        usuarioId: 1,
        bloquear: true,
      }),
    });
    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estado).toBe("Suspendido");
  });
});

