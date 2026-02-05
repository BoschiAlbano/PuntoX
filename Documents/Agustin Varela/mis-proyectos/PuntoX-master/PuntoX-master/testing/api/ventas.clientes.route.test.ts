/**
 * Tests para la API de ventas/clientes
 * - Valida permisos y obtención de tenantId desde getAuthContext
 * - Verifica filtros de búsqueda, límite de 50 resultados y orden
 * - Calcula saldos de cuenta corriente y márgenes disponibles con escenarios normales y extremos
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/ventas/clientes/route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { createMockRequest } from "../utils/mocks";

// Mock de getAuthContext (similar a otros tests de API)
vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));

// Mock de Prisma: solo los modelos usados en esta ruta
vi.mock("@/DB/prisma", () => ({
  default: {
    persona: {
      findMany: vi.fn(),
    },
    formaPago: {
      findMany: vi.fn(),
    },
    comprobante: {
      findMany: vi.fn(),
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

describe("GET /api/ventas/clientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 500 y delegar en handleError cuando getAuthContext lanza un error (sin permisos)", async () => {
    const permisoError = new Error("Sin permisos CLIENTES");
    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createMockRequest("http://localhost:3000/api/ventas/clientes");
    const response = await GET(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(permisoError);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno");
    expect(prisma.persona.findMany).not.toHaveBeenCalled();
  });

  it("debe listar hasta 50 clientes ordenados por apellido y sin movimientos (saldo 0, margen null o monto según límite)", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "10",
      sucursalId: "1",
      usuarioId: "1",
    } as any);

    // 2 clientes básicos sin movimientos de cuenta corriente
    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Ana",
        Apellido: "Zapata",
        Dni: "11111111",
        Mail: "ana@test.com",
        Direccion: "Calle 1",
        Persona_Cliente: {
          Id: BigInt(1),
          ActivarCtaCte: true,
          TieneLimiteCompra: true,
          MontoMaximoCtaCte: 1000,
        },
      },
      {
        Id: BigInt(2),
        Nombre: "Bruno",
        Apellido: "Alvarez",
        Dni: "22222222",
        Mail: "bruno@test.com",
        Direccion: "Calle 2",
        Persona_Cliente: {
          Id: BigInt(2),
          ActivarCtaCte: false,
          TieneLimiteCompra: false,
          MontoMaximoCtaCte: null,
        },
      },
    ] as any);

    vi.mocked(prisma.formaPago.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.comprobante.findMany).mockResolvedValue([] as any);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/clientes",
      "GET"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);

    const ana = data.find((c: any) => c.id === 1);
    const bruno = data.find((c: any) => c.id === 2);

    // Saldos en cero sin movimientos
    expect(ana.saldoActual).toBe(0);
    expect(bruno.saldoActual).toBe(0);

    // Ana tiene límite y sin saldo -> margen = monto máximo
    expect(ana.activarCtaCte).toBe(true);
    expect(ana.tieneLimiteCompra).toBe(true);
    expect(ana.montoMaximoCtaCte).toBe(1000);
    expect(ana.margenDisponible).toBe(1000);

    // Bruno sin límite -> margen null
    expect(bruno.activarCtaCte).toBe(false);
    expect(bruno.tieneLimiteCompra).toBe(false);
    expect(bruno.margenDisponible).toBeNull();

    // Verificar que se use take: 50 y filtro por tenant
    expect(prisma.persona.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          TenantId: BigInt(10),
          EstaEliminado: false,
        }),
        take: 50,
        orderBy: { Apellido: "asc" },
      })
    );
  });

  it("debe aplicar filtro de búsqueda por nombre, apellido, mail o dni cuando se usa q", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "20",
      sucursalId: "1",
      usuarioId: "1",
    } as any);

    vi.mocked(prisma.persona.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.formaPago.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.comprobante.findMany).mockResolvedValue([] as any);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/clientes?q=juan",
      "GET"
    );
    const response = await GET(req as any);
    await response.json();

    expect(response.status).toBe(200);
    expect(prisma.persona.findMany).toHaveBeenCalled();

    const args = vi.mocked(prisma.persona.findMany).mock.calls[0][0];
    expect(args.where.OR).toBeDefined();
    expect(Array.isArray(args.where.OR)).toBe(true);

    const hasNombre = args.where.OR.some(
      (c: any) => c.Nombre && c.Nombre.contains === "juan"
    );
    const hasApellido = args.where.OR.some(
      (c: any) => c.Apellido && c.Apellido.contains === "juan"
    );
    const hasMail = args.where.OR.some(
      (c: any) => c.Mail && c.Mail.contains === "juan"
    );
    const hasDni = args.where.OR.some(
      (c: any) => c.Dni && c.Dni.contains === "juan"
    );

    expect(hasNombre || hasApellido || hasMail || hasDni).toBe(true);
  });

  it("debe calcular saldos positivos y márgenes disponibles mezclando ventas, pagos y notas de crédito", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "30",
      sucursalId: "1",
      usuarioId: "1",
    } as any);

    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Carlos",
        Apellido: "Saldo",
        Dni: "33333333",
        Mail: "carlos@test.com",
        Direccion: "Calle 3",
        Persona_Cliente: {
          Id: BigInt(3),
          ActivarCtaCte: true,
          TieneLimiteCompra: true,
          MontoMaximoCtaCte: 2000,
        },
      },
    ] as any);

    // Ventas en cuenta corriente (débitos)
    vi.mocked(prisma.formaPago.findMany).mockResolvedValueOnce([
      {
        Monto: 1500,
        FormaPago_CtaCte: { ClienteId: BigInt(1) },
        Comprobante: null,
      },
    ] as any);

    // Pagos en cuenta corriente (créditos)
    vi.mocked(prisma.comprobante.findMany).mockResolvedValueOnce([
      {
        Total: 400,
        Comprobante_CuentaCorriente: { ClienteId: BigInt(1) },
      },
    ] as any);

    // Notas de crédito a cuenta corriente (créditos adicionales)
    vi.mocked(prisma.formaPago.findMany).mockResolvedValueOnce([
      {
        Monto: 100,
        FormaPago_CtaCte: { ClienteId: BigInt(1) },
      },
    ] as any);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/clientes",
      "GET"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    const cliente = data[0];

    // Saldo = 1500 (ventas) - 400 (pagos) - 100 (NC) = 1000
    expect(cliente.saldoActual).toBe(1000);

    // Margen disponible = 2000 - 1000 = 1000
    expect(cliente.montoMaximoCtaCte).toBe(2000);
    expect(cliente.margenDisponible).toBe(1000);
  });

  it("debe soportar escenarios extremos con montos muy grandes y producir saldos/márgenes redondeados a 2 decimales", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "40",
      sucursalId: "1",
      usuarioId: "1",
    } as any);

    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Big",
        Apellido: "Numbers",
        Dni: "44444444",
        Mail: "big@test.com",
        Direccion: "Calle 4",
        Persona_Cliente: {
          Id: BigInt(4),
          ActivarCtaCte: true,
          TieneLimiteCompra: true,
          MontoMaximoCtaCte: 99999999.99,
        },
      },
    ] as any);

    // Una venta enorme con muchos decimales
    vi.mocked(prisma.formaPago.findMany).mockResolvedValueOnce([
      {
        Monto: 12345678.9876,
        FormaPago_CtaCte: { ClienteId: BigInt(1) },
        Comprobante: null,
      },
    ] as any);

    // Ningún pago ni nota de crédito
    vi.mocked(prisma.comprobante.findMany).mockResolvedValueOnce([] as any);
    vi.mocked(prisma.formaPago.findMany).mockResolvedValueOnce([] as any);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/clientes",
      "GET"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    const cliente = data[0];

    // La ruta usa saldo.toFixed(2), por lo que esperamos 2 decimales
    expect(typeof cliente.saldoActual).toBe("number");
    expect(cliente.saldoActual.toString()).toMatch(/^-?\d+(\.\d{1,2})?$/);

    if (cliente.margenDisponible !== null) {
      expect(cliente.margenDisponible.toString()).toMatch(
        /^-?\d+(\.\d{1,2})?$/
      );
    }
  });

  it("debe manejar clientes con saldos negativos y dejar margenDisponible en negativo cuando el saldo supera el límite", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "50",
      sucursalId: "1",
      usuarioId: "1",
    } as any);

    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Cliente Riesgoso",
        Apellido: "Negativo",
        Dni: "55555555",
        Mail: "riesgo@test.com",
        Direccion: "Calle Riesgo",
        Persona_Cliente: {
          Id: BigInt(10),
          ActivarCtaCte: true,
          TieneLimiteCompra: true,
          MontoMaximoCtaCte: 1000,
        },
      },
    ] as any);

    // Ventas históricas muy grandes
    vi.mocked(prisma.formaPago.findMany).mockResolvedValueOnce([
      {
        Monto: 3000,
        FormaPago_CtaCte: { ClienteId: BigInt(1) },
        Comprobante: null,
      },
    ] as any);

    // Pagos y notas de crédito menores al total → saldo positivo alto
    vi.mocked(prisma.comprobante.findMany).mockResolvedValueOnce([
      {
        Total: 500,
        Comprobante_CuentaCorriente: { ClienteId: BigInt(1) },
      },
    ] as any);

    vi.mocked(prisma.formaPago.findMany).mockResolvedValueOnce([
      {
        Monto: 200,
        FormaPago_CtaCte: { ClienteId: BigInt(1) },
      },
    ] as any);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/clientes",
      "GET"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    const cliente = data[0];

    // Saldo = 3000 - 500 - 200 = 2300 (por encima del límite)
    expect(cliente.saldoActual).toBe(2300);

    // Comportamiento actual: margenDisponible = limite - saldo → valor negativo
    expect(cliente.montoMaximoCtaCte).toBe(1000);
    expect(cliente.margenDisponible).toBeLessThan(0);
  });

  it("documenta comportamiento actual para clientes dados de baja: siguen apareciendo en listado si la ruta no filtra por estado", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: "60",
      sucursalId: "1",
      usuarioId: "1",
    } as any);

    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Cliente Activo",
        Apellido: "Vigente",
        Dni: "10101010",
        Mail: "activo@test.com",
        Direccion: "Calle 1",
        EstaEliminado: false,
        Persona_Cliente: {
          Id: BigInt(1),
          ActivarCtaCte: true,
          TieneLimiteCompra: true,
          MontoMaximoCtaCte: 500,
        },
      },
      {
        Id: BigInt(2),
        Nombre: "Cliente Baja",
        Apellido: "Eliminado",
        Dni: "20202020",
        Mail: "baja@test.com",
        Direccion: "Calle 2",
        EstaEliminado: true,
        Persona_Cliente: {
          Id: BigInt(2),
          ActivarCtaCte: true,
          TieneLimiteCompra: true,
          MontoMaximoCtaCte: 300,
        },
      },
    ] as any);

    vi.mocked(prisma.formaPago.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.comprobante.findMany).mockResolvedValue([] as any);

    const req = createMockRequest(
      "http://localhost:3000/api/ventas/clientes",
      "GET"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);

    // El comportamiento actual de la ruta (según mocks) es exponer ambas entradas tal como vienen de persona.findMany
    const ids = data.map((c: any) => c.id);
    expect(ids).toContain(1);
    expect(ids).toContain(2);
    // La responsabilidad de ocultar clientes de baja podría recaer en el where de la ruta o en capas superiores;
    // por ahora solo se documenta el comportamiento observado.
  });
});

