/**
 * Tests para la API de roles
 * - GET /api/roles: Listar roles
 * - POST /api/roles: Crear rol
 * - PATCH /api/roles: Actualizar rol
 * - DELETE /api/roles: Eliminar rol
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "@/app/api/roles/route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/auth/permissions";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { PermisoError } from "@/lib/requirePermiso";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { createMockRequest } from "../utils/mocks";

// Mock de getAuthContext
vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));

// Mock de Prisma
vi.mock("@/DB/prisma", () => ({
  default: {
    perfiles: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    permiso: {
      upsert: vi.fn(),
    },
    perfilPermiso: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
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

// Mock de registrarAuditoria
vi.mock("@/lib/auditoria/registrarAuditoria", () => ({
  registrarAuditoria: vi.fn(),
}));

// Mock de actualizarPermisosUsuariosDelRol
vi.mock("@/lib/auth/updateUserPermissions", () => ({
  actualizarPermisosUsuariosDelRol: vi.fn(),
}));

describe("GET /api/roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createMockRequest("http://localhost:3000/api/roles");
    const response = await GET(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe listar roles del tenant", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.perfiles.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Descripcion: "Administrador",
        Tipo: "ADMINISTRADOR",
        PerfilUsuario: [{ Usuario_Id: BigInt(1) }, { Usuario_Id: BigInt(2) }],
        PerfilPermiso: [
          {
            Permiso: {
              Clave: "empleados:admin",
              Descripcion: "Administrar Empleados",
              EstaEliminado: false,
            },
          },
        ],
      },
      {
        Id: BigInt(2),
        Descripcion: "Vendedor",
        Tipo: "EMPLEADO",
        PerfilUsuario: [{ Usuario_Id: BigInt(3) }],
        PerfilPermiso: [
          {
            Permiso: {
              Clave: "ventas",
              Descripcion: "Ventas",
              EstaEliminado: false,
            },
          },
        ],
      },
    ] as any);

    const req = createMockRequest("http://localhost:3000/api/roles");
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.roles)).toBe(true);
    expect(data.roles.length).toBe(2);
    expect(data.roles[0].id).toBe(1);
    expect(data.roles[0].nombre).toBe("Administrador");
    expect(data.roles[0].tipo).toBe("ADMINISTRADOR");
    expect(data.roles[0].usuarios).toBe(2);
    expect(data.roles[0].permisos).toContain("Administrar Empleados");
  });
});

describe("POST /api/roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createPostRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/roles", {
      method: "POST",
      body: JSON.stringify(body),
    } as any);

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createPostRequest({ nombre: "Nuevo Rol" });
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
    expect(data.error).toBe("Datos invalidos");
  });

  it("debe retornar 400 cuando ya existe un rol con ese nombre", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue({
      Id: BigInt(1),
      Descripcion: "Rol Existente",
    } as any);

    const req = createPostRequest({
      nombre: "Rol Existente",
      tipo: "EMPLEADO",
    });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Ya existe un rol con ese nombre");
  });

  it("debe crear un rol exitosamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue(null);

    const mockRol = {
      Id: BigInt(100),
      Descripcion: "Nuevo Rol",
      Tipo: "EMPLEADO",
    };

    const mockPermiso = {
      Id: BigInt(1),
      Clave: "ventas",
      Descripcion: "Ventas",
    };

    vi.mocked(prisma.perfiles.create).mockResolvedValue(mockRol as any);
    vi.mocked(prisma.permiso.upsert).mockResolvedValue(mockPermiso as any);
    vi.mocked(prisma.perfilPermiso.createMany).mockResolvedValue({
      count: 1,
    } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const mockTx = {
        perfiles: {
          create: vi.mocked(prisma.perfiles.create),
        },
        permiso: {
          upsert: vi.mocked(prisma.permiso.upsert),
        },
        perfilPermiso: {
          createMany: vi.mocked(prisma.perfilPermiso.createMany),
        },
      };
      return await fn(mockTx);
    });

    const req = createPostRequest({
      nombre: "Nuevo Rol",
      tipo: "EMPLEADO",
      permisos: ["Ventas"],
    });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.rol).toBeDefined();
    expect(data.rol.id).toBe(100);
    expect(data.rol.nombre).toBe("Nuevo Rol");
    expect(data.rol.tipo).toBe("EMPLEADO");
    expect(registrarAuditoria).toHaveBeenCalled();
  });

  it("debe agregar automáticamente empleados:admin cuando el tipo es ADMINISTRADOR", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue(null);

    const mockRol = {
      Id: BigInt(100),
      Descripcion: "Admin",
      Tipo: "ADMINISTRADOR",
    };

    const mockPermiso1 = {
      Id: BigInt(1),
      Clave: "empleados:admin",
      Descripcion: "Administrar Empleados",
    };

    const mockPermiso2 = {
      Id: BigInt(2),
      Clave: "ventas:admin",
      Descripcion: "Administrar Ventas",
    };

    vi.mocked(prisma.perfiles.create).mockResolvedValue(mockRol as any);
    vi.mocked(prisma.permiso.upsert)
      .mockResolvedValueOnce(mockPermiso1 as any)
      .mockResolvedValueOnce(mockPermiso2 as any);
    vi.mocked(prisma.perfilPermiso.createMany).mockResolvedValue({
      count: 2,
    } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const mockTx = {
        perfiles: {
          create: vi.mocked(prisma.perfiles.create),
        },
        permiso: {
          upsert: vi.mocked(prisma.permiso.upsert),
        },
        perfilPermiso: {
          createMany: vi.mocked(prisma.perfilPermiso.createMany),
        },
      };
      return await fn(mockTx);
    });

    const req = createPostRequest({
      nombre: "Admin",
      tipo: "ADMINISTRADOR",
      permisos: ["Administrar Ventas"],
    });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    // Verificar que se agregó empleados:admin automáticamente
    expect(prisma.permiso.upsert).toHaveBeenCalledTimes(2);
  });
});

describe("PATCH /api/roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createPatchRequest = (id: string, body: any) =>
    new NextRequest(`http://localhost:3000/api/roles?id=${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    } as any);

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createPatchRequest("1", { nombre: "Rol Actualizado" });
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe retornar 400 cuando no se proporciona ID", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    const req = new NextRequest("http://localhost:3000/api/roles", {
      method: "PATCH",
      body: JSON.stringify({ nombre: "Rol Actualizado" }),
    } as any);
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("ID de rol requerido");
  });

  it("debe retornar 404 cuando el rol no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue(null);

    const req = createPatchRequest("999", { nombre: "Rol Inexistente" });
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Rol no encontrado o no pertenece a este tenant");
  });

  it("debe retornar 400 cuando se intenta modificar un rol del sistema", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    const mockRolSistema = {
      Id: BigInt(1),
      Descripcion: "Administrador",
      Tipo: "ADMINISTRADOR",
      PerfilPermiso: [],
    };

    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue(mockRolSistema as any);

    const req = createPatchRequest("1", {
      nombre: "Admin Modificado",
      tipo: "EMPLEADO",
    });
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "No se puede modificar el nombre o tipo de un rol del sistema",
    );
  });

  it("debe actualizar un rol exitosamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    const mockRolExistente = {
      Id: BigInt(100),
      Descripcion: "Vendedor",
      Tipo: "EMPLEADO",
      PerfilPermiso: [
        {
          Permiso: {
            Clave: "ventas",
            Descripcion: "Ventas",
            EstaEliminado: false,
          },
        },
      ],
    };

    const mockRolActualizado = {
      Id: BigInt(100),
      Descripcion: "Vendedor Senior",
      Tipo: "EMPLEADO",
      PerfilUsuario: [],
      PerfilPermiso: [
        {
          Permiso: {
            Clave: "ventas",
            Descripcion: "Ventas",
            EstaEliminado: false,
          },
        },
        {
          Permiso: {
            Clave: "ventas:admin",
            Descripcion: "Administrar Ventas",
            EstaEliminado: false,
          },
        },
      ],
    };

    vi.mocked(prisma.perfiles.findFirst)
      .mockResolvedValueOnce(mockRolExistente as any) // Verificar existencia
      .mockResolvedValueOnce(null) // Verificar duplicado (no existe)
      .mockResolvedValueOnce(mockRolActualizado as any); // Obtener actualizado

    vi.mocked(prisma.perfiles.update).mockResolvedValue({
      Id: BigInt(100),
      Descripcion: "Vendedor Senior",
      Tipo: "EMPLEADO",
    } as any);

    const mockPermiso = {
      Id: BigInt(1),
      Clave: "ventas",
      Descripcion: "Ventas",
    };

    vi.mocked(prisma.permiso.upsert).mockResolvedValue(mockPermiso as any);
    vi.mocked(prisma.perfilPermiso.deleteMany).mockResolvedValue({
      count: 1,
    } as any);
    vi.mocked(prisma.perfilPermiso.createMany).mockResolvedValue({
      count: 1,
    } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const mockTx = {
        perfiles: {
          update: vi.mocked(prisma.perfiles.update),
          findFirst: vi.mocked(prisma.perfiles.findFirst),
        },
        permiso: {
          upsert: vi.mocked(prisma.permiso.upsert),
        },
        perfilPermiso: {
          deleteMany: vi.mocked(prisma.perfilPermiso.deleteMany),
          createMany: vi.mocked(prisma.perfilPermiso.createMany),
        },
      };
      return await fn(mockTx);
    });

    const req = createPatchRequest("100", {
      nombre: "Vendedor Senior",
      tipo: "EMPLEADO",
      permisos: ["Ventas", "Administrar Ventas"],
    });
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rol).toBeDefined();
    expect(data.rol.nombre).toBe("Vendedor Senior");
    expect(registrarAuditoria).toHaveBeenCalled();
  });
});

describe("DELETE /api/roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createDeleteRequest = (id: string) =>
    new NextRequest(`http://localhost:3000/api/roles?id=${id}`, {
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

  it("debe retornar 400 cuando no se proporciona ID", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    const req = new NextRequest("http://localhost:3000/api/roles", {
      method: "DELETE",
    } as any);
    const response = await DELETE(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("ID de rol requerido");
  });

  it("debe retornar 404 cuando el rol no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue(null);

    const req = createDeleteRequest("999");
    const response = await DELETE(req as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Rol no encontrado o no pertenece a este tenant");
  });

  it("debe retornar 400 cuando el rol tiene usuarios asignados", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue({
      Id: BigInt(100),
      Descripcion: "Rol con Usuarios",
      PerfilUsuario: [
        { Usuario_Id: BigInt(1) },
        { Usuario_Id: BigInt(2) },
      ],
    } as any);

    const req = createDeleteRequest("100");
    const response = await DELETE(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("No se puede eliminar el rol porque tiene");
  });

  it("debe retornar 400 cuando se intenta eliminar un rol del sistema", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue({
      Id: BigInt(-1), // ID negativo = rol del sistema
      Descripcion: "Administrador",
      PerfilUsuario: [],
    } as any);

    const req = createDeleteRequest("-1");
    const response = await DELETE(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No se puede eliminar un rol del sistema");
  });

  it("debe eliminar un rol exitosamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.EMPLEADOS_ADMIN],
    } as any);

    vi.mocked(prisma.perfiles.findFirst).mockResolvedValue({
      Id: BigInt(100),
      Descripcion: "Rol a Eliminar",
      PerfilUsuario: [],
    } as any);

    vi.mocked(prisma.perfilPermiso.deleteMany).mockResolvedValue({
      count: 2,
    } as any);
    vi.mocked(prisma.perfiles.delete).mockResolvedValue({
      Id: BigInt(100),
    } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const mockTx = {
        perfilPermiso: {
          deleteMany: vi.mocked(prisma.perfilPermiso.deleteMany),
        },
        perfiles: {
          delete: vi.mocked(prisma.perfiles.delete),
        },
      };
      return await fn(mockTx);
    });

    const req = createDeleteRequest("100");
    const response = await DELETE(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Rol eliminado correctamente");
    expect(registrarAuditoria).toHaveBeenCalled();
  });
});
