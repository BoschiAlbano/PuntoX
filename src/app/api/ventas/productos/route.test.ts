/**
 * Tests para la API de ventas/productos (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: {
    articulo: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) => {
    const msg = err instanceof PermisoError ? err.message : "Error interno";
    const status = err instanceof PermisoError ? err.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

const authOk = { tenantId: 1, sucursalId: 1 };

describe("GET /api/ventas/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.articulo.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Descripcion: "Producto 1",
        Codigo: 100,
        CodigoBarra: "123",
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
        Precio: { PrecioPublico: 100, PrecioPublico2: 95 },
        Iva: { Id: 1, Porcentaje: 21, Descripcion: "21%" },
        ArticuloStock: [{ Stock: 10, StockMinimo: 0, Ubicacion: null }],
      },
    ] as any);
    vi.mocked(prisma.articulo.count).mockResolvedValue(1);
  });

  it("retorna 403 sin permiso VENTAS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/ventas/productos");
    const res = await GET(req);
    expect((await res.json()).error).toBeDefined();
    expect(res.status).toBe(403);
  });

  it("retorna 200 con data y meta", async () => {
    const req = new NextRequest("http://localhost:3000/api/ventas/productos");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.meta).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });
});
