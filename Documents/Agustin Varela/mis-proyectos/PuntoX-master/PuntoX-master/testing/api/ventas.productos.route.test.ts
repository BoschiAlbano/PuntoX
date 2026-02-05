/**
 * Tests para la API de ventas/productos
 * - Valida permisos y obtención de contexto (tenantId, sucursalId)
 * - Verifica filtros de búsqueda, paginación y mapeo de datos
 * - Simula escenarios de stock por sucursal y reglas de negocio básicas
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/ventas/productos/route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { createMockRequest } from "../utils/mocks";

// Mock de getAuthContext (similar a tests de empleados/permisos)
vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));

// Mock de Prisma (solo modelo articulo)
vi.mock("@/DB/prisma", () => ({
  default: {
    articulo: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock de handleError para capturar errores
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }),
}));

describe("GET /api/ventas/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 500 y delegar en handleError cuando getAuthContext lanza un error de permisos", async () => {
    const permisoError = new Error("Sin permisos");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createMockRequest("http://localhost:3000/api/ventas/productos");
    const response = await GET(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno");
    expect(prisma.articulo.findMany).not.toHaveBeenCalled();
  });

  it("debe listar productos con paginación por defecto y stock de sucursal cuando existe ArticuloStock", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "2",
      usuarioId: 1,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: ["ventas"], // Permiso necesario para acceder a esta ruta
    } as any);

    vi.mocked(prisma.articulo.findMany).mockResolvedValue([
      {
        Id: 1,
        Codigo: 100,
        CodigoBarra: "1234567890123",
        Descripcion: "Producto Sucursal",
        DescuentaStock: true,
        PermiteStockNegativo: false,
        StockMinimo: 5,
        ActivarLimiteVenta: true,
        LimiteVenta: 10,
        ActivarHoraVenta: true,
        HoraLimiteVentaDesde: new Date("2026-01-01T10:00:00Z"),
        HoraLimiteVentaHasta: new Date("2026-01-01T18:30:00Z"),
        TipoVenta: "UNIDAD",
        Stock: 50,
        Precio: {
          PrecioPublico: 130,
          PrecioPublico2: 125,
        },
        Iva: {
          Id: 1,
          Porcentaje: 21,
          Descripcion: "IVA 21%",
        },
        ArticuloStock: [
          {
            Stock: 8,
            StockMinimo: 3,
            Ubicacion: "A1-B2",
          },
        ],
      },
    ] as any);

    vi.mocked(prisma.articulo.count).mockResolvedValue(1);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/productos",
      "GET"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(1);

    const producto = data.data[0];
    expect(producto.Id).toBe(1);
    expect(producto.Codigo).toBe(100);
    expect(producto.CodigoBarra).toBe("1234567890123");
    expect(producto.Descripcion).toBe("Producto Sucursal");

    // Stock debe salir de ArticuloStock de la sucursal
    expect(producto.Stock).toBe(8);
    // StockMinimo también prioriza el de sucursal
    expect(producto.StockMinimo).toBe(3);

    expect(producto.DescuentaStock).toBe(true);
    expect(producto.PermiteStockNegativo).toBe(false);
    expect(producto.ActivarLimiteVenta).toBe(true);
    expect(producto.LimiteVenta).toBe(10);
    expect(producto.ActivarHoraVenta).toBe(true);

    // Horarios formateados a HH:mm
    expect(producto.HoraLimiteVentaDesde).toMatch(/^\d{2}:\d{2}$/);
    expect(producto.HoraLimiteVentaHasta).toMatch(/^\d{2}:\d{2}$/);

    expect(producto.Precio.PrecioPublico).toBe(130);
    expect(producto.Precio.PrecioPublico2).toBe(125);
    expect(producto.Iva.Porcentaje).toBe(21);

    // Meta de paginación por defecto
    expect(data.meta.total).toBe(1);
    expect(data.meta.page).toBe(1);
    expect(data.meta.totalPages).toBe(1);

    // Verificar parámetros usados en Prisma
    expect(prisma.articulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          TenantId: BigInt(1),
          EstaEliminado: false,
        }),
        take: 20,
        skip: 0,
      })
    );
  });

  it("debe aplicar filtro de búsqueda por descripcion/codigoBarra y por código numérico cuando q es número válido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "1",
      usuarioId: "1",
    } as any);

    vi.mocked(prisma.articulo.findMany).mockResolvedValue([]);
    vi.mocked(prisma.articulo.count).mockResolvedValue(0);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/productos?q=123",
      "GET"
    );
    const response = await GET(req as any);
    await response.json();

    expect(prisma.articulo.findMany).toHaveBeenCalled();

    const args = vi.mocked(prisma.articulo.findMany).mock.calls[0][0];
    expect(args.where.OR).toBeDefined();
    expect(Array.isArray(args.where.OR)).toBe(true);

    const hasDescripcionFilter = args.where.OR.some(
      (c: any) => c.Descripcion && c.Descripcion.contains === "123"
    );
    const hasCodigoBarraFilter = args.where.OR.some(
      (c: any) => c.CodigoBarra && c.CodigoBarra.contains === "123"
    );
    const hasCodigoFilter = args.where.OR.some(
      (c: any) => typeof c.Codigo === "number" && c.Codigo === 123
    );

    expect(hasDescripcionFilter).toBe(true);
    expect(hasCodigoBarraFilter).toBe(true);
    expect(hasCodigoFilter).toBe(true);
  });

  it("no debe agregar filtro por Código cuando q es un número muy grande (mayor a MAX_ARTICLE_CODE)", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "1",
      usuarioId: "1",
    } as any);

    vi.mocked(prisma.articulo.findMany).mockResolvedValue([]);
    vi.mocked(prisma.articulo.count).mockResolvedValue(0);

    // Forzamos MAX_ARTICLE_CODE bajo para el test
    const originalMax = process.env.MAX_ARTICLE_CODE;
    process.env.MAX_ARTICLE_CODE = "10";

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/productos?q=999",
      "GET"
    );
    const response = await GET(req as any);
    await response.json();

    const args = vi.mocked(prisma.articulo.findMany).mock.calls[0][0];
    const hasCodigoFilter = args.where.OR?.some(
      (c: any) => typeof c.Codigo === "number"
    );

    expect(hasCodigoFilter).toBeFalsy();

    // Restaurar valor original
    if (originalMax === undefined) {
      delete process.env.MAX_ARTICLE_CODE;
    } else {
      process.env.MAX_ARTICLE_CODE = originalMax;
    }
  });

  it("debe respetar parámetros de paginación page y limit en la consulta", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "5",
      sucursalId: "3",
      usuarioId: "9",
    } as any);

    vi.mocked(prisma.articulo.findMany).mockResolvedValue([]);
    vi.mocked(prisma.articulo.count).mockResolvedValue(100);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/productos?page=3&limit=25",
      "GET"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(prisma.articulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 25,
        skip: 50, // (3 - 1) * 25
      })
    );

    expect(data.meta.total).toBe(100);
    expect(data.meta.page).toBe(3);
    expect(data.meta.totalPages).toBe(Math.ceil(100 / 25));
  });

  it("debe soportar productos con precios extremos e IVA 0/21/sin IVA manteniendo el mapeo actual", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "99",
      sucursalId: "5",
      usuarioId: 7,
      user: { id: "user-1" } as any,
      isSuperAdmin: false,
      permissions: ["ventas"], // Permiso necesario para acceder a esta ruta
    } as any);

    vi.mocked(prisma.articulo.findMany).mockResolvedValue([
      {
        Id: 1,
        Codigo: 1,
        CodigoBarra: "0000000000000",
        Descripcion: "Producto Gratis",
        DescuentaStock: false,
        PermiteStockNegativo: true,
        StockMinimo: 0,
        ActivarLimiteVenta: false,
        LimiteVenta: 0,
        ActivarHoraVenta: false,
        HoraLimiteVentaDesde: null,
        HoraLimiteVentaHasta: null,
        TipoVenta: "UNIDAD",
        Stock: 100,
        Precio: {
          PrecioPublico: 0,
          PrecioPublico2: 0,
        },
        Iva: {
          Id: 1,
          Porcentaje: 0,
          Descripcion: "IVA 0%",
        },
        ArticuloStock: [
          {
            Stock: 100,
            StockMinimo: 0,
            Ubicacion: "A0-0",
          },
        ],
      },
      {
        Id: 2,
        Codigo: 2,
        CodigoBarra: "9999999999999",
        Descripcion: "Producto Carísimo",
        DescuentaStock: true,
        PermiteStockNegativo: false,
        StockMinimo: 1,
        ActivarLimiteVenta: true,
        LimiteVenta: 2,
        ActivarHoraVenta: false,
        HoraLimiteVentaDesde: null,
        HoraLimiteVentaHasta: null,
        TipoVenta: "UNIDAD",
        Stock: 5,
        Precio: {
          PrecioPublico: 9999999.99,
          PrecioPublico2: 9999999.99,
        },
        Iva: {
          Id: 2,
          Porcentaje: 21,
          Descripcion: "IVA 21%",
        },
        ArticuloStock: [
          {
            Stock: 5,
            StockMinimo: 1,
            Ubicacion: "B1-1",
          },
        ],
      },
      {
        Id: 3,
        Codigo: 3,
        CodigoBarra: "8888888888888",
        Descripcion: "Producto sin IVA cargado",
        DescuentaStock: true,
        PermiteStockNegativo: false,
        StockMinimo: 0,
        ActivarLimiteVenta: false,
        LimiteVenta: 0,
        ActivarHoraVenta: false,
        HoraLimiteVentaDesde: null,
        HoraLimiteVentaHasta: null,
        TipoVenta: "UNIDAD",
        Stock: 10,
        Precio: {
          PrecioPublico: 123.45,
          PrecioPublico2: 100,
        },
        Iva: null,
        ArticuloStock: [
          {
            Stock: 10,
            StockMinimo: 0,
            Ubicacion: "C1-2",
          },
        ],
      },
    ] as any);

    vi.mocked(prisma.articulo.count).mockResolvedValue(3);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/productos?page=1&limit=10",
      "GET"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(3);

    const gratis = data.data.find((p: any) => p.Id === 1);
    const caro = data.data.find((p: any) => p.Id === 2);
    const sinIva = data.data.find((p: any) => p.Id === 3);

    // Producto gratis
    expect(gratis.Precio.PrecioPublico).toBe(0);
    expect(gratis.Iva.Porcentaje).toBe(0);

    // Producto con precio muy alto
    expect(caro.Precio.PrecioPublico).toBeCloseTo(9999999.99, 2);
    expect(caro.Iva.Porcentaje).toBe(21);

    // Producto sin IVA: la ruta actual propaga Iva: null → el adaptador de frontend debe manejarlo
    expect(sinIva.Iva).toBeNull();
  });

  it("debe usar stock 0 cuando no existe ArticuloStock para la sucursal (stock global ignorado)", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
      sucursalId: "10",
      usuarioId: "1",
    } as any);

    vi.mocked(prisma.articulo.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Codigo: 200,
        CodigoBarra: "9999999999999",
        Descripcion: "Producto sin stock de sucursal",
        DescuentaStock: true,
        PermiteStockNegativo: false,
        StockMinimo: 5,
        ActivarLimiteVenta: false,
        LimiteVenta: 0,
        ActivarHoraVenta: false,
        HoraLimiteVentaDesde: null,
        HoraLimiteVentaHasta: null,
        TipoVenta: "UNIDAD",
        Stock: 50, // Stock global que actualmente NO se usa
        Precio: null,
        Iva: null,
        ArticuloStock: [],
      },
    ] as any);

    vi.mocked(prisma.articulo.count).mockResolvedValue(1);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/productos",
      "GET"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    const producto = data.data[0];

    // Comportamiento actual: si no hay ArticuloStock, stockReal = 0
    expect(producto.Stock).toBe(0);
    // Este escenario se documenta como potencial problema de negocio en PROBLEMAS_PENDIENTES.md
  });
});

