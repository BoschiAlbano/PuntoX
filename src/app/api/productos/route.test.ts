/**
 * Tests para la API de productos (GET, POST, PATCH, DELETE).
 * Estructura alineada con marcas/route.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";
vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    articulo: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    precio: { create: vi.fn(), update: vi.fn() },
    articuloStock: { upsert: vi.fn() },
    $transaction: vi.fn(),
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
vi.mock("@/utilities/fotoDefault", () => ({
  fotoDefault: vi.fn(() => Buffer.from("")),
}));

const authOk = {
  tenantId: 1,
  sucursalId: 1,
};

const productoValidoPost = {
  MarcaId: 1,
  RubroId: 1,
  UnidadMedidaId: 1,
  IvaId: 1,
  Codigo: 100,
  CodigoBarra: "1234567890",
  Descripcion: "Producto test",
  Precio: {
    PrecioCosto: 50,
    PorcentajeGanancia: 20,
    PrecioPublico: 60,
    PorcentajeGanancia2: 15,
    PrecioPublico2: 58,
  },
  Stock: 10,
  TipoVenta: "UNIDAD",
};

const articuloConPrecio = {
  Id: BigInt(1),
  Codigo: 100,
  CodigoBarra: "1234567890",
  Descripcion: "Producto test",
  EstaEliminado: false,
  Stock: 10,
  Precio: {
    PrecioCosto: 50,
    PrecioPublico: 60,
    PrecioPublico2: 58,
  },
  ArticuloStock: [
    {
      Stock: 10,
      Sucursal: { Nombre: "Sucursal 1" },
    },
  ],
};

describe("GET /api/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.articulo.count).mockResolvedValue(1);
    vi.mocked(prisma.articulo.findMany).mockResolvedValue([
      articuloConPrecio,
    ] as any);
  });

  it("retorna 403 si no tiene permiso PRODUCTOS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("Permiso denegado", 403),
    );
    const req = new NextRequest("http://localhost:3000/api/productos");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con data y pagination cuando tiene permiso", async () => {
    const req = new NextRequest("http://localhost:3000/api/productos?limit=20");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });
});

describe("POST /api/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      const tx = {
        precio: {
          create: vi.fn().mockResolvedValue({
            Id: BigInt(1),
            PrecioCosto: 50,
            PrecioPublico: 60,
            PrecioPublico2: 58,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        articulo: {
          create: vi.fn().mockResolvedValue({
            Id: BigInt(1),
            Codigo: 100,
            Descripcion: "Producto test",
            Precio: {},
          }),
        },
        articuloStock: { upsert: vi.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });
  });

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("Permiso denegado", 403),
    );
    const req = new NextRequest("http://localhost:3000/api/productos", {
      method: "POST",
      body: JSON.stringify(productoValidoPost),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 con error y details cuando el body es inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/productos", {
      method: "POST",
      body: JSON.stringify({
        MarcaId: 1,
        Descripcion: "",
        CodigoBarra: "",
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
  });

  it("retorna 201 con producto creado cuando el body es válido", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      const tx = {
        precio: {
          create: vi.fn().mockResolvedValue({ Id: BigInt(1) }),
          update: vi.fn().mockResolvedValue({}),
        },
        articulo: {
          create: vi.fn().mockResolvedValue({
            Id: 10,
            Codigo: 100,
            Descripcion: "Producto test",
            Precio: { Id: 1 },
          }),
        },
        articuloStock: { upsert: vi.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });
    const req = new NextRequest("http://localhost:3000/api/productos", {
      method: "POST",
      body: JSON.stringify(productoValidoPost),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.producto).toBeDefined();
    expect(data.producto.Id).toBe(10);
  });
});

describe("PATCH /api/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.articulo.findFirst).mockResolvedValue({
      Id: BigInt(1),
      Precio: { Id: BigInt(1) },
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      const tx = {
        precio: { update: vi.fn().mockResolvedValue({}) },
        articulo: {
          update: vi.fn().mockResolvedValue({
            Id: 1,
            Descripcion: "Producto actualizado",
          }),
        },
        articuloStock: { upsert: vi.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });
  });

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("Permiso denegado", 403),
    );
    const req = new NextRequest("http://localhost:3000/api/productos", {
      method: "PATCH",
      body: JSON.stringify({
        Id: 1,
        Descripcion: "Actualizado",
      }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 con error y details cuando el body es inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/productos", {
      method: "PATCH",
      body: JSON.stringify({
        Id: "no-numero",
        Descripcion: "",
      }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
  });

  it("retorna 201 con producto actualizado cuando el body es válido", async () => {
    const req = new NextRequest("http://localhost:3000/api/productos", {
      method: "PATCH",
      body: JSON.stringify({
        Id: 1,
        Descripcion: "Producto actualizado",
      }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.producto).toBeDefined();
  });
});

describe("DELETE /api/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.articulo.delete).mockResolvedValue({
      Id: 1,
      Descripcion: "Eliminado",
    } as any);
  });

  it("retorna 403 si no tiene permiso", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("Permiso denegado", 403),
    );
    const req = new NextRequest("http://localhost:3000/api/productos?Id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 201 cuando el producto se elimina correctamente", async () => {
    const req = new NextRequest("http://localhost:3000/api/productos?Id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect([200, 201]).toContain(res.status);
    expect(data.producto).toBeDefined();
  });
});
