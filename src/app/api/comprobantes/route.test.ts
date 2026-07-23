/**
 * Tests para la API de comprobantes (GET, POST).
 * Estructura de referencia: src/app/api/marcas/route.test.ts
 * Usa getAuthContext para autenticación.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";
import { isFacturacionElectronicaHabilitada } from "@/lib/services/facturacion.service";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    comprobante: { findUnique: vi.fn(), findFirst: vi.fn() },
    usuario: { findFirst: vi.fn() },
    articulo: { findMany: vi.fn() },
    configuracion: { findFirst: vi.fn() },
    caja: { findFirst: vi.fn() },
    persona: { findUnique: vi.fn() },
    facturaElectronica: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/services/facturacion.service", () => ({
  isFacturacionElectronicaHabilitada: vi.fn(),
  autorizarComprobante: vi.fn(),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

const authOk = {
  user: { id: "auth-1" },
  tenantId: 1,
};

describe("GET /api/comprobantes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 si no está autenticado", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("No autenticado", 401),
    );
    const req = new NextRequest("http://localhost:3000/api/comprobantes");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error ?? data.message).toBeDefined();
  });

  it("retorna 400 cuando no se envía id", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    const req = new NextRequest("http://localhost:3000/api/comprobantes");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("ID requerido");
  });

  it("retorna 404 cuando el comprobante no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.comprobante.findUnique).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/comprobantes?id=99");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Comprobante no encontrado");
  });

  it("retorna 200 con comprobante cuando existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    const comprobante = {
      Id: 1,
      TenantId: 1,
      Numero: "0001-00001234",
      TipoComprobante: 1,
      Total: 100,
      Fecha: new Date("2025-01-01"),
      Comprobante_Factura: null,
      Comprobante_CuentaCorriente: null,
    };
    vi.mocked(prisma.comprobante.findUnique).mockResolvedValue(
      comprobante as any,
    );
    const req = new NextRequest("http://localhost:3000/api/comprobantes?id=1");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.Id).toBe(1);
    expect(data.Numero).toBe("0001-00001234");
  });
});

describe("POST /api/comprobantes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 si no está autenticado", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("No autenticado", 401),
    );
    const req = new NextRequest("http://localhost:3000/api/comprobantes", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 con error y details cuando el body es inválido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 1,
      EmpleadoId: 1,
      Sucursales: [{ EsDefault: true, SucursalId: 1 }],
    } as any);
    const req = new NextRequest("http://localhost:3000/api/comprobantes", {
      method: "POST",
      body: JSON.stringify({
        tipoComprobante: 1,
        detalles: [],
        formasPago: [],
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
  });
});

describe("POST /api/comprobantes — Nota de Crédito y AFIP", () => {
  beforeEach(() => vi.clearAllMocks());

  function baseNCBody(overrides: Record<string, unknown> = {}) {
    return {
      tipoComprobante: 6, // NOTA_CREDITO
      clienteId: 0,
      detalles: [
        {
          articuloId: 1,
          codigo: "001",
          descripcion: "Producto",
          cantidad: 1,
          precio: 100,
          iva: 21,
          subtotal: 100,
        },
      ],
      formasPago: [{ tipoPago: 1, monto: 100 }],
      numeroComprobanteAsociado: 55,
      ...overrides,
    };
  }

  function mockCommonSetup() {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 1,
      EmpleadoId: 1,
      Sucursales: [{ EsDefault: true, SucursalId: 1 }],
    } as any);
    vi.mocked(prisma.articulo.findMany).mockResolvedValue([
      {
        Id: 1n,
        Descripcion: "Producto",
        DescuentaStock: false,
        EsCombo: false,
        ArticulosCombo: [],
        ArticuloStock: [{ Stock: 100 }],
        Iva: { Porcentaje: 21 },
      },
    ] as any);
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({
      PuestoCajaSeparado: false,
    } as any);
    vi.mocked(prisma.caja.findFirst).mockResolvedValue({ Id: 10n } as any);
  }

  it("retorna 400 cuando no existe una factura con el número asociado", async () => {
    mockCommonSetup();
    vi.mocked(prisma.comprobante.findFirst).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/comprobantes", {
      method: "POST",
      body: JSON.stringify(baseNCBody()),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("No se encontró una factura");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("retorna 400 cuando la tienda tiene AFIP habilitado y la factura asociada NO fue autorizada", async () => {
    mockCommonSetup();
    vi.mocked(prisma.comprobante.findFirst).mockResolvedValue({
      Id: 99n,
    } as any);
    vi.mocked(isFacturacionElectronicaHabilitada).mockResolvedValue(true);
    vi.mocked(prisma.facturaElectronica.findUnique).mockResolvedValue({
      Estado: "PENDIENTE",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/comprobantes", {
      method: "POST",
      body: JSON.stringify(baseNCBody()),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("no fue autorizada por AFIP");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("permite crear la NC cuando la tienda NO tiene AFIP habilitado, sin chequear FacturaElectronica", async () => {
    mockCommonSetup();
    vi.mocked(prisma.comprobante.findFirst).mockResolvedValue({
      Id: 99n,
    } as any);
    vi.mocked(isFacturacionElectronicaHabilitada).mockResolvedValue(false);
    vi.mocked(prisma.$transaction).mockResolvedValue({
      Id: 1n,
      Numero: 1,
      TipoComprobante: 6,
      Total: 100,
      Fecha: new Date(),
    } as any);

    const req = new NextRequest("http://localhost:3000/api/comprobantes", {
      method: "POST",
      body: JSON.stringify(baseNCBody()),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.facturaElectronica.findUnique).not.toHaveBeenCalled();
  });
});
