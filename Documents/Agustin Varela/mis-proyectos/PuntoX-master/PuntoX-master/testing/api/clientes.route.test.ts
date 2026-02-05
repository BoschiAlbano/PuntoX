/**
 * Tests para la API de clientes
 * - GET: Listado con paginación y búsqueda
 * - POST: Creación de clientes
 * - PATCH: Actualización de clientes
 * - DELETE: Eliminación de clientes
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "@/app/api/clientes/route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/auth/permissions";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { createMockRequest } from "../utils/mocks";
import { Prisma } from "../../../prisma/generated/prisma";

// Mock de getAuthContext
vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));

// Mock de Prisma
vi.mock("@/DB/prisma", () => ({
  default: {
    persona: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    persona_Cliente: {
      create: vi.fn(),
      update: vi.fn(),
    },
    localidad: {
      findFirst: vi.fn(),
    },
    condicionIva: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock de handleError
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }),
}));

describe("GET /api/clientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createMockRequest("http://localhost:3000/api/clientes");
    const response = await GET(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno");
  });

  it("debe listar clientes con paginación por defecto", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    vi.mocked(prisma.persona.count).mockResolvedValue(2);
    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Juan",
        Apellido: "Pérez",
        Dni: "12345678",
        Direccion: "Calle 1",
        Telefono: "1234567890",
        Mail: "juan@test.com",
        LocalidadId: BigInt(1),
        Localidad: {
          Id: BigInt(1),
          Descripcion: "Localidad 1",
          Departamento: {
            Id: BigInt(1),
            Descripcion: "Departamento 1",
            Provincia: {
              Id: BigInt(1),
              Descripcion: "Provincia 1",
            },
          },
        },
        Persona_Cliente: {
          CondicionIvaId: BigInt(1),
          ActivarCtaCte: true,
          TieneLimiteCompra: true,
          MontoMaximoCtaCte: new Prisma.Decimal(1000),
          CondicionIva: {
            Id: BigInt(1),
            Descripcion: "Responsable Inscripto",
          },
        },
      },
      {
        Id: BigInt(2),
        Nombre: "Ana",
        Apellido: "García",
        Dni: "87654321",
        Direccion: "Calle 2",
        Telefono: "0987654321",
        Mail: "ana@test.com",
        LocalidadId: BigInt(2),
        Localidad: {
          Id: BigInt(2),
          Descripcion: "Localidad 2",
          Departamento: {
            Id: BigInt(2),
            Descripcion: "Departamento 2",
            Provincia: {
              Id: BigInt(2),
              Descripcion: "Provincia 2",
            },
          },
        },
        Persona_Cliente: {
          CondicionIvaId: BigInt(2),
          ActivarCtaCte: false,
          TieneLimiteCompra: false,
          MontoMaximoCtaCte: null,
          CondicionIva: {
            Id: BigInt(2),
            Descripcion: "Consumidor Final",
          },
        },
      },
    ] as any);

    const req = createMockRequest("http://localhost:3000/api/clientes");
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBe(2);
    expect(data.pagination.total).toBe(2);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(20);
  });

  it("debe aplicar filtro de búsqueda cuando se proporciona parámetro q", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    vi.mocked(prisma.persona.count).mockResolvedValue(1);
    vi.mocked(prisma.persona.findMany).mockResolvedValue([]);

    const req = createMockRequest("http://localhost:3000/api/clientes?q=Juan");
    await GET(req as any);

    expect(prisma.persona.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { Nombre: { contains: "Juan", mode: "insensitive" } },
            { Apellido: { contains: "Juan", mode: "insensitive" } },
            { Mail: { contains: "Juan", mode: "insensitive" } },
            { Dni: { contains: "Juan", mode: "insensitive" } },
          ]),
        }),
      }),
    );
  });

  it("debe respetar parámetros de paginación", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    vi.mocked(prisma.persona.count).mockResolvedValue(100);
    vi.mocked(prisma.persona.findMany).mockResolvedValue([]);

    const req = createMockRequest(
      "http://localhost:3000/api/clientes?page=2&limit=25",
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(prisma.persona.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 25,
        skip: 25, // (2 - 1) * 25
      }),
    );

    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(25);
    expect(data.pagination.totalPages).toBe(4); // Math.ceil(100 / 25)
  });
});

describe("POST /api/clientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createPostRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/clientes", {
      method: "POST",
      body: JSON.stringify(body),
    } as any);

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createPostRequest({});
    const response = await POST(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe retornar 400 cuando los datos son inválidos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    const req = createPostRequest({
      // Datos inválidos - faltan campos requeridos
      Nombre: "Test",
    });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
  });

  it("debe retornar 400 cuando la localidad no es válida", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    vi.mocked(prisma.localidad.findFirst).mockResolvedValue(null);

    const body = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Dni: "12345678",
      Direccion: "Calle 1",
      Mail: "juan@test.com",
      LocalidadId: 999, // Localidad inexistente
      CondicionIvaId: 1,
    };

    const req = createPostRequest(body);
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Localidad no válida");
  });

  it("debe retornar 400 cuando el email ya está registrado", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    vi.mocked(prisma.localidad.findFirst).mockResolvedValue({
      Id: BigInt(1),
      EstaEliminado: false,
    } as any);
    vi.mocked(prisma.condicionIva.findFirst).mockResolvedValue({
      Id: BigInt(1),
      EstaEliminado: false,
    } as any);
    vi.mocked(prisma.persona.findFirst).mockResolvedValue({
      Id: BigInt(1),
      Mail: "juan@test.com",
    } as any);

    const body = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Dni: "12345678",
      Direccion: "Calle 1",
      Mail: "juan@test.com", // Email duplicado
      LocalidadId: 1,
      CondicionIvaId: 1,
    };

    const req = createPostRequest(body);
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("El correo ya está registrado");
  });

  it("debe crear un cliente exitosamente cuando todos los datos son válidos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    const body = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Dni: "12345678",
      Direccion: "Calle 1",
      Telefono: "1234567890",
      Mail: "juan@test.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
      ActivarCtaCte: true,
      TieneLimiteCompra: true,
      MontoMaximoCtaCte: 1000,
    };

    const mockLocalidad = {
      Id: BigInt(1),
      EstaEliminado: false,
    };

    const mockCondicionIva = {
      Id: BigInt(1),
      EstaEliminado: false,
    };

    const mockPersona = {
      Id: BigInt(100),
      Nombre: "Juan",
      Apellido: "Pérez",
      Dni: "12345678",
      Direccion: "Calle 1",
      Telefono: "1234567890",
      Mail: "juan@test.com",
      LocalidadId: BigInt(1),
      Localidad: {
        Id: BigInt(1),
        Descripcion: "Localidad 1",
        Departamento: {
          Id: BigInt(1),
          Descripcion: "Departamento 1",
          Provincia: {
            Id: BigInt(1),
            Descripcion: "Provincia 1",
          },
        },
      },
      Persona_Cliente: {
        CondicionIvaId: BigInt(1),
        ActivarCtaCte: true,
        TieneLimiteCompra: true,
        MontoMaximoCtaCte: new Prisma.Decimal(1000),
        CondicionIva: {
          Id: BigInt(1),
          Descripcion: "Responsable Inscripto",
        },
      },
    };

    vi.mocked(prisma.localidad.findFirst).mockResolvedValue(mockLocalidad as any);
    vi.mocked(prisma.condicionIva.findFirst).mockResolvedValue(
      mockCondicionIva as any,
    );
    vi.mocked(prisma.persona.findFirst).mockResolvedValue(null); // Email no existe

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const mockTx = {
        persona: {
          create: vi.fn().mockResolvedValue(mockPersona),
          findFirst: vi.mocked(prisma.persona.findFirst),
        },
        persona_Cliente: {
          create: vi.fn().mockResolvedValue({}),
        },
      };
      const result = await fn(mockTx);
      return mockPersona;
    });

    const req = createPostRequest(body);
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.cliente).toBeDefined();
    expect(data.cliente.id).toBe(100);
    expect(data.cliente.nombre).toBe("Juan");
    expect(data.cliente.apellido).toBe("Pérez");
  });
});

describe("PATCH /api/clientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createPatchRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/clientes", {
      method: "PATCH",
      body: JSON.stringify(body),
    } as any);

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createPatchRequest({ Id: 1 });
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe retornar 400 cuando los datos son inválidos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    const req = createPatchRequest({
      Id: 1,
      Mail: "invalid-email", // Email inválido
    });
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("debe actualizar un cliente exitosamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    const body = {
      Id: 100,
      Nombre: "Juan Actualizado",
      Apellido: "Pérez Actualizado",
    };

    const mockPersona = {
      Id: BigInt(100),
      Nombre: "Juan",
      Apellido: "Pérez",
      Dni: "12345678",
      Direccion: "Calle 1",
      Telefono: "1234567890",
      Mail: "juan@test.com",
      LocalidadId: BigInt(1),
      EstaEliminado: false,
      Persona_Cliente: {
        CondicionIvaId: BigInt(1),
        ActivarCtaCte: true,
        TieneLimiteCompra: true,
        MontoMaximoCtaCte: new Prisma.Decimal(1000),
      },
    };

    vi.mocked(prisma.persona.findFirst).mockResolvedValue(mockPersona as any);
    vi.mocked(prisma.persona.update).mockResolvedValue({
      ...mockPersona,
      Nombre: "Juan Actualizado",
      Apellido: "Pérez Actualizado",
    } as any);
    vi.mocked(prisma.persona_Cliente.update).mockResolvedValue({} as any);

    const mockClienteCompleto = {
      Id: BigInt(100),
      Nombre: "Juan Actualizado",
      Apellido: "Pérez Actualizado",
      Dni: "12345678",
      Direccion: "Calle 1",
      Telefono: "1234567890",
      Mail: "juan@test.com",
      LocalidadId: BigInt(1),
      Localidad: {
        Descripcion: "Localidad 1",
        Departamento: {
          Descripcion: "Departamento 1",
          Provincia: {
            Descripcion: "Provincia 1",
          },
        },
      },
      Persona_Cliente: {
        CondicionIvaId: BigInt(1),
        ActivarCtaCte: true,
        TieneLimiteCompra: true,
        MontoMaximoCtaCte: new Prisma.Decimal(1000),
        CondicionIva: {
          Descripcion: "Responsable Inscripto",
        },
      },
    };

    vi.mocked(prisma.persona.findUnique).mockResolvedValue(mockClienteCompleto as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const mockTx = {
        persona: {
          update: vi.mocked(prisma.persona.update),
          findUnique: vi.mocked(prisma.persona.findUnique),
        },
        persona_Cliente: {
          update: vi.mocked(prisma.persona_Cliente.update),
        },
      };
      return await fn(mockTx);
    });

    const req = createPatchRequest(body);
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cliente).toBeDefined();
    expect(data.cliente.nombre).toBe("Juan Actualizado");
  });

  it("debe retornar 404 cuando el cliente no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    vi.mocked(prisma.persona.findFirst).mockResolvedValue(null);

    const req = createPatchRequest({
      Id: 999,
      Nombre: "Cliente Inexistente",
    });
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
  });
});

describe("DELETE /api/clientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createDeleteRequest = (id: string) =>
    new NextRequest(`http://localhost:3000/api/clientes?Id=${id}`, {
      method: "DELETE",
    } as any);

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createDeleteRequest("1");
    const response = await DELETE(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe eliminar un cliente exitosamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.CLIENTES],
    } as any);

    const mockCliente = {
      Id: BigInt(100),
    };

    vi.mocked(prisma.persona.findFirst).mockResolvedValue(mockCliente as any);
    vi.mocked(prisma.persona.update).mockResolvedValue({
      ...mockCliente,
      EstaEliminado: true,
    } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const mockTx = {
        persona: {
          update: vi.mocked(prisma.persona.update),
        },
      };
      return await fn(mockTx);
    });

    const req = createDeleteRequest("100");
    const response = await DELETE(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.clienteId).toBe(100);
  });
});
