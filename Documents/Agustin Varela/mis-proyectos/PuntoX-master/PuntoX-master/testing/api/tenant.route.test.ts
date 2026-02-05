/**
 * Tests para la API de tenant
 * - Valida resolución de tenantId desde Supabase y desde la base de datos
 * - Verifica respuestas para casos de no autenticado y tenant inexistente
 * - Comprueba actualización parcial de datos del tenant
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/tenant/route";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";

// Mock de Supabase
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));

// Mock de Prisma (solo los modelos usados en esta ruta)
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: {
      findFirst: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock de handleError para capturar errores
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    // Respuesta simplificada para tests
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }),
}));

describe("GET /api/tenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 401 cuando no hay usuario autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autenticado");
    expect(prisma.usuario.findFirst).not.toHaveBeenCalled();
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
  });

  it("debe obtener tenantId desde el metadata de Supabase y retornar el tenant", async () => {
    const mockUser = {
      id: "user-1",
      app_metadata: {
        tenantId: "10",
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Id: BigInt(10),
      Nombre: "Tenant Test",
      Dominio: "tenant.test",
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tenant).toBeDefined();
    expect(data.tenant.id).toBe(10);
    expect(data.tenant.nombre).toBe("Tenant Test");
    expect(data.tenant.dominio).toBe("tenant.test");
    expect(prisma.usuario.findFirst).not.toHaveBeenCalled();
    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
      where: { Id: 10 },
      select: {
        Id: true,
        Nombre: true,
        Dominio: true,
      },
    });
  });

  it("debe buscar tenantId en la base de datos cuando no está en metadata y retornar el tenant", async () => {
    const mockUser = {
      id: "user-2",
      app_metadata: {}, // sin tenant en metadata
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      TenantId: BigInt(20),
    } as any);

    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Id: BigInt(20),
      Nombre: "Tenant DB",
      Dominio: null,
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tenant).toBeDefined();
    expect(data.tenant.id).toBe(20);
    expect(data.tenant.nombre).toBe("Tenant DB");
    expect(data.tenant.dominio).toBe(""); // Dominio null -> ""
    expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
      where: { AuthUserId: "user-2", EstaEliminado: false },
      select: { TenantId: true },
    });
  });

  it("debe retornar 404 cuando el tenant no existe", async () => {
    const mockUser = {
      id: "user-3",
      app_metadata: {
        tenantId: "30",
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Tenant no encontrado");
  });

  it("debe delegar en handleError cuando ocurre un error inesperado al buscar el tenant", async () => {
    const mockUser = {
      id: "user-4",
      app_metadata: {
        tenantId: "40",
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    const mockError = new Error("DB error");
    vi.mocked(prisma.tenant.findUnique).mockRejectedValue(mockError);

    const response = await GET();
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(mockError);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno");
  });
});

describe("PUT /api/tenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper para crear un NextRequest simulado
  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as any;
  };

  it("debe retornar 401 cuando no hay usuario autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    const req = createMockRequest({});
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autenticado");
    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });

  it("debe retornar 400 cuando los datos son inválidos", async () => {
    const mockUser = {
      id: "user-5",
      app_metadata: {
        tenantId: "50",
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    // nombre vacío -> falla zod
    const req = createMockRequest({ nombre: "" });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos invalidos");
    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });

  it("debe actualizar solo el nombre cuando se envía nombre", async () => {
    const mockUser = {
      id: "user-6",
      app_metadata: {
        tenantId: "60",
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.tenant.update).mockResolvedValue({
      Id: BigInt(60),
      Nombre: "Nuevo Nombre",
      Dominio: "dominio.existente",
    } as any);

    const req = createMockRequest({ nombre: "Nuevo Nombre" });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tenant).toBeDefined();
    expect(data.tenant.id).toBe(60);
    expect(data.tenant.nombre).toBe("Nuevo Nombre");
    expect(data.tenant.dominio).toBe("dominio.existente");
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { Id: 60 },
      data: {
        Nombre: "Nuevo Nombre",
      },
      select: {
        Id: true,
        Nombre: true,
        Dominio: true,
      },
    });
  });

  it("debe actualizar dominio a null cuando se envía dominio vacío", async () => {
    const mockUser = {
      id: "user-7",
      app_metadata: {
        tenantId: "70",
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.tenant.update).mockResolvedValue({
      Id: BigInt(70),
      Nombre: "Tenant Sin Dominio",
      Dominio: null,
    } as any);

    const req = createMockRequest({ dominio: "" });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tenant).toBeDefined();
    expect(data.tenant.id).toBe(70);
    expect(data.tenant.nombre).toBe("Tenant Sin Dominio");
    expect(data.tenant.dominio).toBe("");
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { Id: 70 },
      data: {
        Dominio: null,
      },
      select: {
        Id: true,
        Nombre: true,
        Dominio: true,
      },
    });
  });

  it("debe retornar 404 cuando el tenant a actualizar no existe", async () => {
    const mockUser = {
      id: "user-8",
      app_metadata: {
        tenantId: "80",
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    const notFoundError = new Error("Record to update not found. Something");
    vi.mocked(prisma.tenant.update).mockRejectedValue(notFoundError);

    const req = createMockRequest({ nombre: "X" });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Tenant no encontrado");
  });

  it("debe delegar en handleError cuando ocurre un error inesperado al actualizar", async () => {
    const mockUser = {
      id: "user-9",
      app_metadata: {
        tenantId: "90",
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);

    const unexpectedError = new Error("DB crash");
    vi.mocked(prisma.tenant.update).mockRejectedValue(unexpectedError);

    const req = createMockRequest({ nombre: "Nuevo" });
    const response = await PUT(req);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(unexpectedError);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno");
  });
});

