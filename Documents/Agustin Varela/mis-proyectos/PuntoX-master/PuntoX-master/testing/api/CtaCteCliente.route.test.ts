/**
 * Tests para la API de CtaCteCliente
 * - GET: timeline de movimientos (ventas, notas de crédito, pagos) y saldo corrido
 * - POST: registro de pago a cuenta corriente con caja abierta, sucursal default y validaciones de montos
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/CtaCteCliente/route";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { registrarPagoCuentaCorriente } from "@/lib/services/comprobantes";
import { createMockRequest } from "../utils/mocks";

// Mocks principales
vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@/DB/prisma", () => {
  const mockPrisma = {
    comprobante: {
      findMany: vi.fn(),
    },
    usuario: {
      findFirst: vi.fn(),
    },
    caja: {
      findFirst: vi.fn(),
    },
    contador: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    persona: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) => {
      return fn(mockPrisma);
    }),
  };
  return {
    default: mockPrisma,
  };
});

vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }),
}));

vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/services/comprobantes", () => {
  const zod = require("zod");
  return {
    registrarPagoCuentaCorriente: vi.fn(),
    formaPagoSchema: zod.z.object({
      tipoPago: zod.z.number(),
      monto: zod.z.number(),
    }),
  };
});

describe("GET /api/CtaCteCliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 400 cuando falta clienteId en los parámetros", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
    } as any);

    const req = createMockRequest(
      "http://localhost:3000/api/CtaCteCliente",
      "GET",
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Cliente ID es requerido");
  });

  it("debe construir timeline de movimientos con ventas, notas de crédito y pagos mezclados y saldo final correcto", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "10",
    } as any);

    // Facturas y NC con FormaPago CtaCte
    vi.mocked(prisma.comprobante.findMany)
      // primera llamada: facturas
      .mockResolvedValueOnce([
        {
          Id: BigInt(1),
          TenantId: BigInt(10),
          Numero: 1001,
          TipoComprobante: 1, // FACTURA_A
          Fecha: new Date("2026-02-01T10:00:00Z"),
          Total: 1000,
          FormaPago: [
            { Monto: 600 },
            { Monto: 400 },
          ],
        },
        {
          Id: BigInt(2),
          TenantId: BigInt(10),
          Numero: 1002,
          TipoComprobante: 6, // NOTA_CREDITO
          Fecha: new Date("2026-02-03T10:00:00Z"),
          Total: -200,
          FormaPago: [{ Monto: 200 }],
        },
      ] as any)
      // segunda llamada: pagos (Tipo 7)
      .mockResolvedValueOnce([
        {
          Id: BigInt(3),
          TenantId: BigInt(10),
          Numero: 5001,
          TipoComprobante: 7,
          Fecha: new Date("2026-02-05T10:00:00Z"),
          Total: 300,
        },
      ] as any);

    const req = createMockRequest(
      "http://localhost:3000/api/CtaCteCliente?clienteId=123",
      "GET",
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBe(3);

    const [mov1, mov2, mov3] = data.items;
    // Venta en debe por 1000 (600+400)
    expect(mov1.debe).toBe(1000);
    expect(mov1.haber).toBe(0);
    // NC en haber por 200
    expect(mov2.debe).toBe(0);
    expect(mov2.haber).toBe(200);
    // Pago en haber por 300
    expect(mov3.debe).toBe(0);
    expect(mov3.haber).toBe(300);

    // Saldo corrido: 1000 - 200 - 300 = 500
    expect(data.saldoTotal).toBe(500);
    expect(mov3.saldo).toBe(500);
  });

  it("debe delegar en handleError cuando ocurre un error inesperado al obtener movimientos", async () => {
    const unexpected = new Error("DB crash");
    vi.mocked(getAuthContext).mockRejectedValue(unexpected);

    const req = createMockRequest(
      "http://localhost:3000/api/CtaCteCliente?clienteId=1",
      "GET",
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(unexpected);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno");
  });
});

describe("POST /api/CtaCteCliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createBodyRequest = (
    url: string,
    body: any,
    method: string = "POST",
  ): NextRequest =>
    ({
      ...createMockRequest(url, method),
      json: async () => body,
    }) as any;

  it("debe retornar 401 cuando Supabase no retorna usuario autenticado", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
    } as any);

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    const req = createBodyRequest(
      "http://localhost:3000/api/CtaCteCliente",
      { clienteId: 1, monto: 100, formasPago: [] },
    );
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("debe retornar 401 cuando el usuario de aplicación no existe", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
    } as any);

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-1" } },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);

    const req = createBodyRequest(
      "http://localhost:3000/api/CtaCteCliente",
      { clienteId: 1, monto: 100, formasPago: [] },
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Usuario no encontrado");
  });

  it("debe retornar 400 cuando el usuario no tiene sucursal por defecto", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
    } as any);

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-2" } },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(10),
      Sucursales: [],
    } as any);

    const req = createBodyRequest(
      "http://localhost:3000/api/CtaCteCliente",
      { clienteId: 1, monto: 100, formasPago: [] },
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "El usuario no tiene una sucursal por defecto asignada",
    );
  });

  it("debe retornar 400 cuando no hay caja abierta para el usuario", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
    } as any);

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-3" } },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(20),
      Sucursales: [{ SucursalId: BigInt(5), EsDefault: true }],
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue(null);

    const req = createBodyRequest(
      "http://localhost:3000/api/CtaCteCliente",
      { clienteId: 1, monto: 100, formasPago: [] },
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "No tienes una caja abierta para registrar el pago",
    );
  });

  it("debe retornar 400 cuando el total de formas de pago no coincide con el monto", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "1",
    } as any);

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-4" } },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(30),
      Sucursales: [{ SucursalId: BigInt(7), EsDefault: true }],
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue({
      Id: BigInt(99),
    } as any);

    const req = createBodyRequest(
      "http://localhost:3000/api/CtaCteCliente",
      {
        clienteId: 1,
        monto: 100,
        formasPago: [
          { tipoPago: 1, monto: 60 },
          { tipoPago: 2, monto: 50 },
        ],
      },
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain(
      "El total de formas de pago (110) no coincide con el monto (100)",
    );
  });

  it("debe registrar un pago válido y devolver comprobanteId y numero", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "2",
    } as any);

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-5" } },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(40),
      Sucursales: [{ SucursalId: BigInt(8), EsDefault: true }],
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue({
      Id: BigInt(123),
    } as any);

    // contador: no existe -> create, numero = 1
    vi.mocked(prisma.contador.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.contador.create).mockResolvedValue({
      Id: BigInt(1),
      Valor: 1,
    } as any);

    // Mock persona para el cliente
    vi.mocked(prisma.persona.findUnique).mockResolvedValue({
      Id: BigInt(999),
      Nombre: "Cliente",
      Apellido: "Test",
    } as any);

    vi.mocked(registrarPagoCuentaCorriente).mockResolvedValue({
      Id: BigInt(1000),
      Numero: 1,
    } as any);

    const req = createBodyRequest(
      "http://localhost:3000/api/CtaCteCliente",
      {
        clienteId: 999,
        monto: 150,
        formasPago: [
          { tipoPago: 1, monto: 100 },
          { tipoPago: 2, monto: 50 },
        ],
      },
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.comprobanteId).toBe(1000);
    expect(data.numero).toBe(1);
  });
});

