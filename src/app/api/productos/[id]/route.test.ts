/**
 * Tests para la API de productos por ID (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { getArticuloFoto } from "@/lib/services/productos";
import { PermisoError } from "@/lib/requirePermiso";
import { createError } from "@/lib/errors/types";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    articulo: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock("@/lib/services/productos", () => ({
  getArticuloFoto: vi.fn(),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) => {
    if (err instanceof PermisoError) {
      return new Response(JSON.stringify({ error: err.message }), { status: 403 });
    }
    if (err && typeof err === "object" && "statusCode" in err) {
      const e = err as { statusCode: number; message: string };
      return new Response(JSON.stringify({ error: e.message }), { status: e.statusCode });
    }
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
  }),
}));

describe("GET /api/productos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 si no tiene permiso PRODUCTOS", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/productos/1");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 404 cuando el producto no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 1,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    vi.mocked(prisma.articulo.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/productos/999");
    const res = await GET(req, { params: Promise.resolve({ id: "999" }) });
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error || data.message).toContain("Producto");
  });

  it("retorna 200 con producto cuando existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 1,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    const mockProducto = {
      Id: 1,
      Codigo: "001",
      Descripcion: "Producto Test",
      TenantId: 1,
      PrecioId: 1,
      Precio: {
        Id: 1,
        ArticuloId: 1,
        PrecioCosto: 100,
        PorcentajeGanancia: 30,
        PrecioPublico: 130,
        PorcentajeGanancia2: 0,
        PrecioPublico2: 0,
        FechaActualizacion: new Date(),
      },
      ArticuloStock: [],
      StockMinimo: 0,
      HoraLimiteVentaDesde: null,
      HoraLimiteVentaHasta: null,
      ActivarLimiteVenta: false,
      LimiteVenta: 0,
      Numero: 1,
      Fecha: new Date(),
      TipoComprobante: 1,
      EstaEliminado: false,
    };
    vi.mocked(prisma.articulo.findFirst).mockResolvedValue(mockProducto as any);
    const req = new NextRequest("http://localhost:3000/api/productos/1");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.Id).toBe(1);
    expect(data.Descripcion).toBe("Producto Test");
  });

  it("retorna imagen cuando ?foto=1", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 1,
      isSuperAdmin: false,
      permissions: ["productos"],
    });
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0x00, 0x01]); // magic bytes JPEG
    vi.mocked(getArticuloFoto).mockResolvedValue({
      buffer: jpegBuffer,
      contentType: "image/jpeg",
    });
    const req = new NextRequest("http://localhost:3000/api/productos/1?foto=1");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    const body = await res.arrayBuffer();
    expect(body.byteLength).toBe(4);
  });
});
