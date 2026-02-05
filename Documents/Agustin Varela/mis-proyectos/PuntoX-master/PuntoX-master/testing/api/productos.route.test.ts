/**
 * Tests para la API de productos
 * - GET: Listado con paginación y búsqueda
 * - POST: Creación de productos
 * - PATCH: Actualización de productos
 * - DELETE: Eliminación de productos
 * - GET /api/productos/[id]: Detalle de producto
 * - GET /api/productos/ultimo-codigo: Último código disponible
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "@/app/api/productos/route";
import { GET as GETById } from "@/app/api/productos/[id]/route";
import { GET as GETUltimoCodigo } from "@/app/api/productos/ultimo-codigo/route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/auth/permissions";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";
import { createMockRequest } from "../utils/mocks";
import { createProductoSchema, updateProductoSchema } from "@/lib/validations/producto.schema";
import { Prisma } from "../../../prisma/generated/prisma";

// Mock de getAuthContext
vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));

// Mock de Prisma
vi.mock("@/DB/prisma", () => ({
  default: {
    articulo: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    precio: {
      create: vi.fn(),
      update: vi.fn(),
    },
    articuloStock: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock de createError
vi.mock("@/lib/errors/types", () => ({
  createError: {
    notFound: vi.fn((message: string) => {
      const error = new Error(message) as any;
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      return error;
    }),
    validation: vi.fn((message: string) => {
      const error = new Error(message) as any;
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      return error;
    }),
  },
  AppErrorClass: class {
    statusCode: number;
    code: string;
    message: string;
    constructor(code: string, message: string, statusCode: number) {
      this.code = code;
      this.message = message;
      this.statusCode = statusCode;
    }
  },
}));

// Mock de handleError que imita el comportamiento real
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const err = error as any;
    // Si es AppErrorClass, usar statusCode
    if (err && typeof err === "object" && "statusCode" in err) {
      return new Response(
        JSON.stringify({
          error: {
            code: err.code || "INTERNAL_ERROR",
            message: err.message || "Error interno",
          },
        }),
        { status: err.statusCode },
      );
    }
    // Log del error para debugging (solo en tests)
    if (process.env.NODE_ENV === "test") {
      console.error("Error no manejado en test:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    }
    // Error genérico
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }),
}));

// Mock de fotoDefault
vi.mock("@/utilities/fotoDefault", () => ({
  fotoDefault: vi.fn(() => Buffer.from("foto-default")),
}));

describe("GET /api/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createMockRequest("http://localhost:3000/api/productos");
    const response = await GET(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno");
  });

  it("debe listar productos con paginación por defecto", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    vi.mocked(prisma.articulo.count).mockResolvedValue(2);
    vi.mocked(prisma.articulo.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Codigo: 100,
        CodigoBarra: "1234567890123",
        Descripcion: "Producto 1",
        EstaEliminado: false,
        Stock: 50,
        Precio: {
          PrecioCosto: 100,
          PrecioPublico: 130,
          PrecioPublico2: 125,
        },
        ArticuloStock: [
          {
            Stock: BigInt(8),
            Sucursal: {
              Nombre: "Sucursal Centro",
            },
          },
        ],
      },
      {
        Id: BigInt(2),
        Codigo: 200,
        CodigoBarra: "9876543210987",
        Descripcion: "Producto 2",
        EstaEliminado: false,
        Stock: 30,
        Precio: {
          PrecioCosto: 50,
          PrecioPublico: 65,
          PrecioPublico2: 60,
        },
        ArticuloStock: [],
      },
    ] as any);

    const req = createMockRequest("http://localhost:3000/api/productos");
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
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    vi.mocked(prisma.articulo.count).mockResolvedValue(1);
    vi.mocked(prisma.articulo.findMany).mockResolvedValue([]);

    const req = createMockRequest(
      "http://localhost:3000/api/productos?q=test",
    );
    await GET(req as any);

    expect(prisma.articulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { Descripcion: { contains: "test", mode: "insensitive" } },
            { CodigoBarra: { contains: "test", mode: "insensitive" } },
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
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    vi.mocked(prisma.articulo.count).mockResolvedValue(100);
    vi.mocked(prisma.articulo.findMany).mockResolvedValue([]);

    const req = createMockRequest(
      "http://localhost:3000/api/productos?page=3&limit=25",
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(prisma.articulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 25,
        skip: 50, // (3 - 1) * 25
      }),
    );

    expect(data.pagination.page).toBe(3);
    expect(data.pagination.limit).toBe(25);
    expect(data.pagination.totalPages).toBe(4); // Math.ceil(100 / 25)
  });
});

describe("POST /api/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createPostRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/productos", {
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
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    const req = createPostRequest({
      // Datos inválidos - faltan campos requeridos
      Codigo: 123,
    });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
  });

  it("debe crear un producto exitosamente cuando todos los datos son válidos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    const body = {
      MarcaId: 1,
      RubroId: 1,
      UnidadMedidaId: 1,
      IvaId: 1,
      Codigo: 123,
      CodigoBarra: "1234567890123",
      Descripcion: "Producto Test",
      Stock: 10,
      StockMinimo: 5,
      Precio: {
        PrecioCosto: 100,
        PorcentajeGanancia: 30,
        PrecioPublico: 130,
        PorcentajeGanancia2: 25,
        PrecioPublico2: 125,
      },
    };

    const mockPrecio = {
      Id: 1,
      ArticuloId: 0,
      PrecioCosto: 100,
      PorcentajeGanancia: 30,
      PrecioPublico: 130,
      PorcentajeGanancia2: 25,
      PrecioPublico2: 125,
    };

    const mockProducto = {
      Id: 100,
      Codigo: 123,
      CodigoBarra: "1234567890123",
      Descripcion: "Producto Test",
      Stock: 10,
      Precio: mockPrecio,
    };

    vi.mocked(prisma.precio.create).mockResolvedValue(mockPrecio as any);
    vi.mocked(prisma.articulo.create).mockResolvedValue(mockProducto as any);
    vi.mocked(prisma.precio.update).mockResolvedValue({
      ...mockPrecio,
      ArticuloId: 100,
    } as any);
    vi.mocked(prisma.articuloStock.upsert).mockResolvedValue({} as any);

    vi.mocked(prisma.$transaction).mockImplementation(
      async (fn: any) => {
        const mockTx = {
          precio: {
            create: vi.mocked(prisma.precio.create),
            update: vi.mocked(prisma.precio.update),
          },
          articulo: {
            create: vi.mocked(prisma.articulo.create),
          },
          articuloStock: {
            upsert: vi.mocked(prisma.articuloStock.upsert),
          },
        };
        return await fn(mockTx);
      },
    );

    const req = createPostRequest(body);
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.producto).toBeDefined();
    expect(data.producto.Id).toBe(100);
    expect(data.producto.Codigo).toBe(123);
  });

  it("debe validar reglas de negocio (StockMinimo <= Stock)", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    const body = {
      MarcaId: 1,
      RubroId: 1,
      UnidadMedidaId: 1,
      IvaId: 1,
      Codigo: 123,
      CodigoBarra: "1234567890123",
      Descripcion: "Producto Test",
      Stock: 5,
      StockMinimo: 20, // Mayor que Stock - debe fallar
      Precio: {
        PrecioCosto: 100,
        PorcentajeGanancia: 30,
        PrecioPublico: 130,
        PorcentajeGanancia2: 25,
        PrecioPublico2: 125,
      },
    };

    const req = createPostRequest(body);
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
    expect(
      data.details.some((d: any) =>
        d.message.includes("stock mínimo no puede ser mayor"),
      ),
    ).toBe(true);
  });
});

describe("PATCH /api/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createPatchRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/productos", {
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

  it("debe retornar 400 cuando se intenta actualizar sin campos (solo Id)", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    const req = createPatchRequest({ Id: 1 });
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(
      data.details.some((d: any) =>
        d.message.includes("al menos un campo para actualizar"),
      ),
    ).toBe(true);
  });

  it("debe actualizar un producto exitosamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    const body = {
      Id: 100,
      Descripcion: "Producto Actualizado",
      Stock: 20,
    };

    const mockArticulo = {
      Id: 100,
      Codigo: 123,
      CodigoBarra: "1234567890123",
      Descripcion: "Producto Original",
      Stock: 10,
      Precio: {
        Id: 1,
        PrecioPublico: 130,
      },
    };

    vi.mocked(prisma.articulo.findFirst).mockResolvedValue(mockArticulo as any);
    vi.mocked(prisma.articulo.update).mockResolvedValue({
      ...mockArticulo,
      Descripcion: "Producto Actualizado",
    } as any);
    vi.mocked(prisma.articuloStock.upsert).mockResolvedValue({} as any);

    vi.mocked(prisma.$transaction).mockImplementation(
      async (fn: any) => {
        const mockTx = {
          articulo: {
            update: vi.mocked(prisma.articulo.update),
          },
          articuloStock: {
            upsert: vi.mocked(prisma.articuloStock.upsert),
          },
        };
        return await fn(mockTx);
      },
    );

    const req = createPatchRequest(body);
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.producto).toBeDefined();
    expect(data.producto.Descripcion).toBe("Producto Actualizado");
    expect(data.producto.Id).toBe(100);
  });

  it("debe retornar 404 cuando el producto no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    vi.mocked(prisma.articulo.findFirst).mockResolvedValue(null);

    const req = createPatchRequest({
      Id: 999,
      Descripcion: "Producto Inexistente",
    });
    const response = await PATCH(req as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
  });
});

describe("DELETE /api/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createDeleteRequest = (id: string) =>
    new NextRequest(`http://localhost:3000/api/productos?Id=${id}`, {
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

  it("debe eliminar un producto exitosamente", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    const mockProducto = {
      Id: 100,
      Codigo: 123,
      CodigoBarra: "1234567890123",
      Descripcion: "Producto a Eliminar",
    };

    vi.mocked(prisma.articulo.delete).mockResolvedValue(mockProducto as any);

    const req = createDeleteRequest("100");
    const response = await DELETE(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.producto).toBeDefined();
    expect(prisma.articulo.delete).toHaveBeenCalledWith({
      where: {
        Id: 100,
        TenantId: BigInt(1),
      },
    });
  });
});

describe("GET /api/productos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createGetByIdRequest = (id: string) =>
    new NextRequest(`http://localhost:3000/api/productos/${id}`, {
      method: "GET",
    } as any);

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createGetByIdRequest("1");
    const response = await GETById(req as any, {
      params: Promise.resolve({ id: "1" }),
    } as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe retornar el detalle de un producto", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    const mockProducto = {
      Id: 100,
      TenantId: 1,
      Codigo: 123,
      CodigoBarra: "1234567890123",
      Descripcion: "Producto Test",
      Abreviatura: null,
      Detalle: null,
      Stock: 10,
      StockMinimo: 5,
      ActivarLimiteVenta: true,
      LimiteVenta: 10,
      ActivarHoraVenta: true,
      HoraLimiteVentaDesde: new Date("2026-01-01T10:00:00Z"),
      HoraLimiteVentaHasta: new Date("2026-01-01T18:00:00Z"),
      TipoVenta: "UNIDAD",
      DescuentaStock: true,
      PermiteStockNegativo: false,
      VencimientoDias: 0,
      Ubicacion: null,
      PorcentajeGanancia: 30,
      Foto: Buffer.from("foto"),
      EstaEliminado: false,
      MarcaId: 1,
      RubroId: 1,
      UnidadMedidaId: 1,
      IvaId: 1,
      PrecioId: 1,
      Precio: {
        Id: 1,
        ArticuloId: 100,
        PrecioCosto: 100,
        PorcentajeGanancia: 30,
        PrecioPublico: 130,
        PorcentajeGanancia2: 25,
        PrecioPublico2: 125,
        FechaActualizacion: new Date(),
      },
      ArticuloStock: [
        {
          Stock: 8,
          StockMinimo: 3,
          Sucursal: {
            Nombre: "Sucursal Centro",
          },
        },
      ],
    };

    vi.mocked(prisma.articulo.findFirst).mockResolvedValue(mockProducto as any);

    const req = createGetByIdRequest("100");
    const response = await GETById(req as any, {
      params: Promise.resolve({ id: "100" }),
    } as any);
    
    const data = await response.json();
    
    if (response.status !== 200) {
      console.log("Error en test - Status:", response.status);
      console.log("Error en test - Data:", JSON.stringify(data, null, 2));
    }

    expect(response.status).toBe(200);
    expect(data.Id).toBe(100);
    expect(data.Descripcion).toBe("Producto Test");
    expect(data.Stock).toBe(8); // Stock de sucursal
    expect(data.StockMinimo).toBe(3); // StockMinimo de sucursal
    expect(data.Precio.PrecioPublico).toBe(130);
  });

  it("debe retornar 404 cuando el producto no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    vi.mocked(prisma.articulo.findFirst).mockResolvedValue(null);

    const req = createGetByIdRequest("999");
    const response = await GETById(req as any, {
      params: Promise.resolve({ id: "999" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
    expect(data.error.message || data.error).toContain("no encontrado");
  });
});

describe("GET /api/productos/ultimo-codigo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 500 cuando getAuthContext lanza un error", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createMockRequest(
      "http://localhost:3000/api/productos/ultimo-codigo",
    );
    const response = await GETUltimoCodigo(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
  });

  it("debe retornar el último código + 1 cuando hay productos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    vi.mocked(prisma.articulo.findFirst).mockResolvedValue({
      Codigo: 500,
    } as any);

    const req = createMockRequest(
      "http://localhost:3000/api/productos/ultimo-codigo",
    );
    const response = await GETUltimoCodigo(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ultimoCodigo).toBe(501);
  });

  it("debe retornar 1 cuando no hay productos", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: [PERMISSIONS.PRODUCTOS],
    } as any);

    vi.mocked(prisma.articulo.findFirst).mockResolvedValue(null);

    const req = createMockRequest(
      "http://localhost:3000/api/productos/ultimo-codigo",
    );
    const response = await GETUltimoCodigo(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ultimoCodigo).toBe(1);
  });
});
