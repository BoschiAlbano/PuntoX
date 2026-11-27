/**
 * Tests para la API de preferencias de venta (GET, PUT).
 * Solo superadmin (requireSuperAdmin; el tenant sale de app_metadata).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET, PUT } from "./route";
import prisma from "@/DB/prisma";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/requireSuperAdmin", () => ({
  requireSuperAdmin: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    configuracion: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

describe("GET /api/admin/configuracion/preferencias-venta", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 sin sesión de superadmin", async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(
      NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    );
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("retorna 404 cuando no se encuentra configuración", async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue({ tenantId: 1, isSuperAdmin: true } as any);
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(null);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBeDefined();
    expect(data.existsConfiguracion).toBe(false);
  });

  it("retorna 200 con preferencias cuando existe configuración", async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue({ tenantId: 1, isSuperAdmin: true } as any);
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({
      Imprimir: true,
      UnificarRenglonesIngresarMismoProducto: false,
      TipoFormaPagoPorDefectoVenta: 0,
      FacturaDescuentaStock: true,
      PresupuestoDescuentaStock: false,
      RemitoDescuentaStock: true,
      IngresoManualCajaInicial: false,
      PuestoCajaSeparado: false,
      ActivarRetiroDeCaja: false,
      MontoMaximoRetiroCaja: 0,
      ActivarBascula: false,
      EtiquetaPorPeso: false,
      CodigoBascula: null,
      MostrarPreciosConIva: true,
      AbrirCajonEfectivo: true,
      NumerarPedidosPantalla: true,
    } as any);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.existsConfiguracion).toBe(true);
    expect(data.imprimir).toBeDefined();
  });
});

describe("PUT /api/admin/configuracion/preferencias-venta", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 sin sesión de superadmin", async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(
      NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    );
    const req = new NextRequest("http://localhost:3000/api/admin/configuracion/preferencias-venta", {
      method: "PUT",
      body: JSON.stringify({
        imprimir: true,
        unificarRenglonesProducto: false,
        tipoFormaPagoDefault: 0,
        facturaDescuentaStock: true,
        presupuestoDescuentaStock: false,
        remitoDescuentaStock: true,
        ingresoManualCajaInicial: false,
        puestoCajaSeparado: false,
        activarRetiroDeCaja: false,
        montoMaximoRetiroCaja: 0,
        activarBascula: false,
        etiquetaPorPeso: false,
        codigoBascula: null,
        mostrarPreciosConIva: true,
        abrirCajonEfectivo: true,
        numerarPedidosPantalla: true,
      }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("retorna 400 cuando el body es inválido", async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue({ tenantId: 1, isSuperAdmin: true } as any);
    const req = new NextRequest("http://localhost:3000/api/admin/configuracion/preferencias-venta", {
      method: "PUT",
      body: JSON.stringify({
        imprimir: "invalid",
      }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
  });

  it("retorna 200 con preferencias actualizadas cuando el body es válido", async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue({ tenantId: 1, isSuperAdmin: true } as any);
    const configMock = {
      Imprimir: true,
      UnificarRenglonesIngresarMismoProducto: false,
      TipoFormaPagoPorDefectoVenta: 0,
      FacturaDescuentaStock: true,
      PresupuestoDescuentaStock: false,
      RemitoDescuentaStock: true,
      IngresoManualCajaInicial: false,
      PuestoCajaSeparado: false,
      ActivarRetiroDeCaja: false,
      MontoMaximoRetiroCaja: 0,
      ActivarBascula: false,
      EtiquetaPorPeso: false,
      CodigoBascula: null,
      MostrarPreciosConIva: true,
      AbrirCajonEfectivo: true,
      NumerarPedidosPantalla: true,
    };
    vi.mocked(prisma.configuracion.findFirst)
      .mockResolvedValueOnce({ Id: BigInt(1), ...configMock } as any)
      .mockResolvedValueOnce(configMock as any);
    vi.mocked(prisma.configuracion.update).mockResolvedValue(configMock as any);
    const req = new NextRequest("http://localhost:3000/api/admin/configuracion/preferencias-venta", {
      method: "PUT",
      body: JSON.stringify({
        imprimir: true,
        unificarRenglonesProducto: false,
        tipoFormaPagoDefault: 0,
        facturaDescuentaStock: true,
        presupuestoDescuentaStock: false,
        remitoDescuentaStock: true,
        ingresoManualCajaInicial: false,
        puestoCajaSeparado: false,
        activarRetiroDeCaja: false,
        montoMaximoRetiroCaja: 0,
        activarBascula: false,
        etiquetaPorPeso: false,
        codigoBascula: null,
        mostrarPreciosConIva: true,
        abrirCajonEfectivo: true,
        numerarPedidosPantalla: true,
      }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.existsConfiguracion).toBe(true);
    expect(data.imprimir).toBe(true);
  });
});
