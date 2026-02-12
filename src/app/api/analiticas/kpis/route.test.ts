/**
 * Tests para la API de KPIs de analíticas (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    comprobante: { aggregate: vi.fn(), count: vi.fn() },
    gasto: { aggregate: vi.fn() },
    articulo: { count: vi.fn() },
    caja: { findFirst: vi.fn() },
    detalleComprobante: { aggregate: vi.fn() },
    comprobante_Factura: { groupBy: vi.fn() },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: err instanceof PermisoError ? err.message : "Error interno" }), {
      status: err instanceof PermisoError ? 403 : 500,
    })
  ),
}));

describe("GET /api/analiticas/kpis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const aggResult = {
      _sum: { Total: 1000, Descuento: 50, Iva21: 100, Iva105: 50, SubTotal: 900, Costo: 600, Cantidad: 50 },
    };
    vi.mocked(prisma.comprobante.aggregate).mockResolvedValue(aggResult as any);
    vi.mocked(prisma.comprobante.count).mockResolvedValue(10);
    vi.mocked(prisma.gasto.aggregate).mockResolvedValue({
      _sum: { Monto: 200 },
    } as any);
    vi.mocked(prisma.articulo.count).mockResolvedValue(100);
    vi.mocked(prisma.caja.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.detalleComprobante.aggregate).mockResolvedValue({
      _sum: { SubTotal: 900, Costo: 600, Cantidad: 50 },
    } as any);
    vi.mocked(prisma.comprobante_Factura.groupBy).mockResolvedValue([]);
  });

  it("retorna 403 si no tiene permiso ANALITICAS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/analiticas/kpis");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con KPIs cuando tiene permiso", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["analiticas"],
    });
    const req = new NextRequest("http://localhost:3000/api/analiticas/kpis");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toBeDefined();
    expect(typeof data).toBe("object");
  });
});
