/**
 * Utilidades y mocks para testing
 */

import { vi } from "vitest";

/**
 * Mock del contexto de autenticación
 */
export const mockAuthContext = {
  tenantId: "1",
  sucursalId: "1",
  usuarioId: "1",
  permissions: ["PRODUCTOS", "VENTAS", "CAJA", "CLIENTES"],
  roles: [{ Tipo: "ADMINISTRADOR" }],
};

/**
 * Mock de Prisma Client
 */
export const createMockPrisma = () => ({
  articulo: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  persona: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  rubro: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  marca: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  iva: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  caja: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  comprobante: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  tenant: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  usuario: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  sucursal: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
});

/**
 * Mock de NextRequest
 */
export const createMockRequest = (
  url: string = "http://localhost:3000/api/test",
  method: string = "GET",
  body?: any
) => {
  const searchParams = new URLSearchParams();
  const urlObj = new URL(url);
  
  urlObj.searchParams.forEach((value, key) => {
    searchParams.set(key, value);
  });

  return {
    nextUrl: {
      pathname: urlObj.pathname,
      searchParams,
    },
    method,
    json: async () => body || {},
    headers: new Headers(),
  } as any;
};

/**
 * Mock de NextResponse
 */
export const mockNextResponse = {
  json: vi.fn((data: any, init?: ResponseInit) => {
    return new Response(JSON.stringify(data), init);
  }),
  redirect: vi.fn((url: string) => {
    return new Response(null, { status: 302, headers: { Location: url } });
  }),
};

/**
 * Helper para crear datos de prueba de productos
 */
export const createMockProducto = (overrides?: Partial<any>) => ({
  MarcaId: 1,
  RubroId: 1,
  UnidadMedidaId: 1,
  IvaId: 1,
  Codigo: 12345,
  CodigoBarra: "1234567890123",
  Abreviatura: "PROD",
  Descripcion: "Producto de prueba",
  Detalle: "Detalle del producto",
  Ubicacion: "A1-B2",
  ActivarLimiteVenta: false,
  LimiteVenta: 0,
  ActivarHoraVenta: false,
  HoraLimiteVentaDesde: null,
  HoraLimiteVentaHasta: null,
  TipoVenta: "UNIDAD",
  PermiteStockNegativo: false,
  DescuentaStock: true,
  StockMinimo: 10,
  VencimientoDias: 0,
  Stock: 100,
  EstaEliminado: false,
  Precio: {
    PrecioCosto: 100,
    PorcentajeGanancia: 30,
    PrecioPublico: 130,
    PorcentajeGanancia2: 25,
    PrecioPublico2: 125,
  },
  ...overrides,
});
