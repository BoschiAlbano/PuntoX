/**
 * Tests para la API de sucursales
 * - GET /api/sucursales: Listar sucursales
 * - POST /api/sucursales: Crear sucursal
 * - GET /api/sucursales/[id]: Obtener sucursal
 * - PATCH /api/sucursales/[id]: Actualizar sucursal
 * - DELETE /api/sucursales/[id]: Eliminar sucursal
 * - POST /api/sucursales/cambiar: Cambiar sucursal activa
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/sucursales/route";
import { GET as GETById, PATCH, DELETE } from "@/app/api/sucursales/[id]/route";
import { POST as CambiarPOST } from "@/app/api/sucursales/cambiar/route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/auth/permissions";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";
import { createMockRequest } from "../utils/mocks";

// Mock de getAuthContext
vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));

// Mock de Prisma
vi.mock("@/DB/prisma", () => ({
  default: {
    sucursal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    usuarioSucursal: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    caja: {
      count: vi.fn(),
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

// Mock de verifyUserBranchAccess
vi.mock("@/lib/sucursal/verifyUserBranch", () => ({
  verifyUserBranchAccess: vi.fn(),
}));

describe("GET /api/sucursales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createMockRequest("http://localhost:3000/api/sucursales");
    const response = await GET(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe listar sucursales activas por defecto", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Sucursal Centro",
        Direccion: "Calle 1",
        Telefono: "1234567890",
        EsPrincipal: true,
        EstaActiva: true,
        FechaCreacion: new Date("2026-01-01"),
        _count: {
          UsuariosSucursales: 5,
        },
      },
      {
        Id: BigInt(2),
        Nombre: "Sucursal Norte",
        Direccion: "Calle 2",
        Telefono: "0987654321",
        EsPrincipal: false,
        EstaActiva: true,
        FechaCreacion: new Date("2026-01-02"),
        _count: {
          UsuariosSucursales: 3,
        },
      },
    ] as any);

    const req = createMockRequest("http://localhost:3000/api/sucursales");
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.sucursales)).toBe(true);
    expect(data.sucursales.length).toBe(2);
    expect(data.sucursales[0].id).toBe(1);
    expect(data.sucursales[0].nombre).toBe("Sucursal Centro");
    expect(data.sucursales[0].esPrincipal).toBe(true);
    expect(data.sucursales[0].cantidadUsuarios).toBe(5);
  });

  it("debe filtrar solo activas cuando soloActivas=true", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findMany).mockResolvedValue([]);

    const req = createMockRequest(
      "http://localhost:3000/api/sucursales?soloActivas=true",
    );
    await GET(req as any);

    expect(prisma.sucursal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          EstaActiva: true,
        }),
      }),
    );
  });

  it("debe incluir eliminadas cuando incluirEliminadas=true", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findMany).mockResolvedValue([]);

    const req = createMockRequest(
      "http://localhost:3000/api/sucursales?incluirEliminadas=true",
    );
    await GET(req as any);

    expect(prisma.sucursal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          EstaEliminado: false,
        }),
      }),
    );
  });
});

describe("POST /api/sucursales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createPostRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/sucursales", {
      method: "POST",
      body: JSON.stringify(body),
    } as any);

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createPostRequest({ nombre: "Nueva Sucursal" });
    const response = await POST(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe retornar 400 cuando faltan campos requeridos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    const req = createPostRequest({});
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("debe retornar 400 cuando ya existe una sucursal con ese nombre", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: BigInt(1),
      Nombre: "Sucursal Existente",
    } as any);

    const req = createPostRequest({
      nombre: "Sucursal Existente",
      direccion: "Calle 1",
    });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Ya existe una sucursal con ese nombre");
  });

  it("debe crear una sucursal exitosamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.sucursal.updateMany).mockResolvedValue({ count: 0 } as any);

    const mockSucursal = {
      Id: BigInt(100),
      Nombre: "Nueva Sucursal",
      Direccion: "Calle 1",
      Telefono: "1234567890",
      EsPrincipal: false,
      EstaActiva: true,
    };

    vi.mocked(prisma.sucursal.create).mockResolvedValue(mockSucursal as any);

    const req = createPostRequest({
      nombre: "Nueva Sucursal",
      direccion: "Calle 1",
      telefono: "1234567890",
      esPrincipal: false,
    });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.sucursal).toBeDefined();
    expect(data.sucursal.id).toBe(100);
    expect(data.sucursal.nombre).toBe("Nueva Sucursal");
  });

  it("debe quitar el flag principal de otras sucursales cuando se crea una principal", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.sucursal.updateMany).mockResolvedValue({ count: 2 } as any);

    const mockSucursal = {
      Id: BigInt(100),
      Nombre: "Nueva Principal",
      Direccion: "Calle 1",
      Telefono: null,
      EsPrincipal: true,
      EstaActiva: true,
    };

    vi.mocked(prisma.sucursal.create).mockResolvedValue(mockSucursal as any);

    const req = createPostRequest({
      nombre: "Nueva Principal",
      esPrincipal: true,
    });
    await POST(req as any);

    expect(prisma.sucursal.updateMany).toHaveBeenCalledWith({
      where: {
        TenantId: BigInt(1),
        EsPrincipal: true,
      },
      data: {
        EsPrincipal: false,
      },
    });
  });
});

describe("GET /api/sucursales/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createMockRequest("http://localhost:3000/api/sucursales/1");
    const response = await GETById(req as any, {
      params: Promise.resolve({ id: "1" }),
    } as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe retornar el detalle de una sucursal", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    const mockSucursal = {
      Id: BigInt(1),
      Nombre: "Sucursal Centro",
      Direccion: "Calle 1",
      Telefono: "1234567890",
      EsPrincipal: true,
      EstaActiva: true,
      FechaCreacion: new Date("2026-01-01"),
      UsuariosSucursales: [
        {
          EsDefault: true,
          Usuario: {
            Id: BigInt(10),
            Nombre: "juan",
            Persona_Empleado: {
              Persona: {
                Nombre: "Juan",
                Apellido: "Pérez",
              },
            },
          },
        },
      ],
      _count: {
        Cajas: 5,
        Comprobantes: 100,
      },
    };

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue(mockSucursal as any);

    const req = createMockRequest("http://localhost:3000/api/sucursales/1");
    const response = await GETById(req as any, {
      params: Promise.resolve({ id: "1" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sucursal).toBeDefined();
    expect(data.sucursal.id).toBe(1);
    expect(data.sucursal.nombre).toBe("Sucursal Centro");
    expect(data.sucursal.usuarios).toBeDefined();
    expect(data.sucursal.estadisticas.totalCajas).toBe(5);
  });

  it("debe retornar 404 cuando la sucursal no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue(null);

    const req = createMockRequest("http://localhost:3000/api/sucursales/999");
    const response = await GETById(req as any, {
      params: Promise.resolve({ id: "999" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Sucursal no encontrada");
  });
});

describe("PATCH /api/sucursales/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createPatchRequest = (id: string, body: any) =>
    new NextRequest(`http://localhost:3000/api/sucursales/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    } as any);

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createPatchRequest("1", { nombre: "Actualizado" });
    const response = await PATCH(req as any, {
      params: Promise.resolve({ id: "1" }),
    } as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe retornar 404 cuando la sucursal no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue(null);

    const req = createPatchRequest("999", { nombre: "Actualizado" });
    const response = await PATCH(req as any, {
      params: Promise.resolve({ id: "999" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Sucursal no encontrada");
  });

  it("debe retornar 400 cuando el nuevo nombre ya existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    const mockSucursal = {
      Id: BigInt(1),
      Nombre: "Sucursal Original",
      EsPrincipal: false,
    };

    vi.mocked(prisma.sucursal.findFirst)
      .mockResolvedValueOnce(mockSucursal as any) // Primera llamada: verificar existencia
      .mockResolvedValueOnce({
        Id: BigInt(2),
        Nombre: "Nombre Duplicado",
      } as any); // Segunda llamada: verificar duplicado

    const req = createPatchRequest("1", { nombre: "Nombre Duplicado" });
    const response = await PATCH(req as any, {
      params: Promise.resolve({ id: "1" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Ya existe una sucursal con ese nombre");
  });

  it("debe actualizar una sucursal exitosamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    const mockSucursal = {
      Id: BigInt(1),
      Nombre: "Sucursal Original",
      Direccion: "Calle 1",
      Telefono: "1234567890",
      EsPrincipal: false,
      EstaActiva: true,
    };

    vi.mocked(prisma.sucursal.findFirst)
      .mockResolvedValueOnce(mockSucursal as any) // Verificar existencia
      .mockResolvedValueOnce(null); // Verificar duplicado (no existe)

    vi.mocked(prisma.sucursal.updateMany).mockResolvedValue({ count: 0 } as any);

    const mockSucursalActualizada = {
      ...mockSucursal,
      Nombre: "Sucursal Actualizada",
    };

    vi.mocked(prisma.sucursal.update).mockResolvedValue(
      mockSucursalActualizada as any,
    );

    const req = createPatchRequest("1", { nombre: "Sucursal Actualizada" });
    const response = await PATCH(req as any, {
      params: Promise.resolve({ id: "1" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sucursal).toBeDefined();
    expect(data.sucursal.nombre).toBe("Sucursal Actualizada");
  });
});

describe("DELETE /api/sucursales/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createDeleteRequest = (id: string) =>
    new NextRequest(`http://localhost:3000/api/sucursales/${id}`, {
      method: "DELETE",
    } as any);

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createDeleteRequest("1");
    const response = await DELETE(req as any, {
      params: Promise.resolve({ id: "1" }),
    } as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe retornar 404 cuando la sucursal no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue(null);

    const req = createDeleteRequest("999");
    const response = await DELETE(req as any, {
      params: Promise.resolve({ id: "999" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Sucursal no encontrada");
  });

  it("debe retornar 400 cuando se intenta eliminar la sucursal principal", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: BigInt(1),
      EsPrincipal: true,
    } as any);

    const req = createDeleteRequest("1");
    const response = await DELETE(req as any, {
      params: Promise.resolve({ id: "1" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No se puede eliminar la sucursal principal");
  });

  it("debe retornar 400 cuando hay cajas abiertas", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: BigInt(1),
      EsPrincipal: false,
    } as any);

    vi.mocked(prisma.caja.count).mockResolvedValue(2); // Hay 2 cajas abiertas

    const req = createDeleteRequest("1");
    const response = await DELETE(req as any, {
      params: Promise.resolve({ id: "1" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No se puede eliminar una sucursal con cajas abiertas");
  });

  it("debe eliminar una sucursal exitosamente (soft delete)", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: BigInt(1),
      EsPrincipal: false,
    } as any);

    vi.mocked(prisma.caja.count).mockResolvedValue(0); // No hay cajas abiertas
    vi.mocked(prisma.sucursal.update).mockResolvedValue({
      Id: BigInt(1),
      EstaEliminado: true,
      EstaActiva: false,
    } as any);

    const req = createDeleteRequest("1");
    const response = await DELETE(req as any, {
      params: Promise.resolve({ id: "1" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.sucursal.update).toHaveBeenCalledWith({
      where: { Id: BigInt(1) },
      data: {
        EstaEliminado: true,
        EstaActiva: false,
      },
    });
  });
});

describe("POST /api/sucursales/cambiar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createCambiarRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/sucursales/cambiar", {
      method: "POST",
      body: JSON.stringify(body),
    } as any);

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createCambiarRequest({ sucursalId: 1 });
    const response = await CambiarPOST(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe retornar 400 cuando faltan datos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [],
    } as any);

    const req = createCambiarRequest({});
    const response = await CambiarPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("debe retornar 403 cuando el usuario no tiene acceso a la sucursal", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [],
    } as any);

    vi.mocked(verifyUserBranchAccess).mockResolvedValue(null);

    const req = createCambiarRequest({ sucursalId: 999 });
    const response = await CambiarPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No tiene acceso a esta sucursal");
  });

  it("debe cambiar la sucursal activa exitosamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [],
    } as any);

    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      usuarioId: BigInt(1),
      tieneAcceso: true,
    } as any);

    vi.mocked(prisma.usuarioSucursal.updateMany).mockResolvedValue({
      count: 2,
    } as any);
    vi.mocked(prisma.usuarioSucursal.update).mockResolvedValue({
      EsDefault: true,
    } as any);

    vi.mocked(prisma.$transaction).mockResolvedValue([
      { count: 2 },
      { EsDefault: true },
    ] as any);

    const req = createCambiarRequest({ sucursalId: 3 });
    const response = await CambiarPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
