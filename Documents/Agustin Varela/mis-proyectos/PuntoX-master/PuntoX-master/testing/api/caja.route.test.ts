/**
 * Tests para la API de caja
 * - Valida autenticación y acceso por sucursal
 * - Verifica apertura, cierre y registro de gastos de caja
 * - Cubre obtención de caja actual, historial y resumen diario
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { GET, POST, PATCH } from "@/app/api/caja/route";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";
import { createMockRequest } from "../utils/mocks";

// Mock de getAuthUser
vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthUser: vi.fn(),
}));

// Mock de Prisma (solo modelos usados en esta ruta)
vi.mock("@/DB/prisma", () => ({
  default: {
    caja: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    usuario: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    gasto: {
      create: vi.fn(),
    },
    conceptoGastos: {
      findFirst: vi.fn(),
    },
    sucursal: {
      findFirst: vi.fn(),
    },
    usuarioSucursal: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock de verifyUserBranchAccess
vi.mock("@/lib/sucursal/verifyUserBranch", () => ({
  verifyUserBranchAccess: vi.fn(),
}));

// Mock de handleError
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    // Log del error para debugging
    if (error instanceof Error) {
      console.error("handleError called with:", error.message, error.stack);
    } else {
      console.error("handleError called with:", error);
    }
    return new Response(JSON.stringify({ 
      error: "Error interno",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
    });
  }),
}));

describe("GET /api/caja", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configurar mocks de Prisma para verifyUserBranchAccess por si se ejecuta realmente
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: 10,
      Nombre: "Sucursal Centro",
      TenantId: 1,
      EstaEliminado: false,
      EstaActiva: true,
    } as any);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      Id: 1,
      TenantId: 1,
    } as any);
    vi.mocked(prisma.usuarioSucursal.findFirst).mockResolvedValue({
      UsuarioId: 1,
      SucursalId: 10,
      TenantId: 1,
    } as any);
    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: 10, Nombre: "Sucursal Centro" },
      usuarioId: 1,
    } as any);
  });

  it("debe retornar el historial paginado de cajas para una sucursal (escenario normal)", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: { id: "user-1" },
      error: null,
    } as any);

    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: 10, Nombre: "Sucursal Centro" },
      usuarioId: 1,
    } as any);

    vi.mocked(prisma.caja.count).mockResolvedValue(2);
    vi.mocked(prisma.caja.findMany).mockResolvedValue([
      {
        Id: 1,
        TenantId: 1,
        SucursalId: 10,
        UsuarioAperturaId: 100,
        UsuarioCierreId: 101,
        FechaApertura: new Date("2026-02-01T09:00:00Z"),
        FechaCierre: new Date("2026-02-01T18:00:00Z"),
        EstaEliminado: false,
        MontoInicial: 0,
        MontoCierre: null,
        TotalEntradaEfectivo: 0,
        TotalSalidaEfectivo: 0,
        TotalEntradaTarjeta: 0,
        TotalSalidaTarjeta: 0,
        TotalEntradaCheque: 0,
        TotalSalidaCheque: 0,
        TotalEntradaCtaCte: 0,
        TotalSalidaCtaCte: 0,
        TotalEntradaTransf: 0,
        TotalSalidaTransf: 0,
        Ganancia: 0,
        Usuario_Caja_UsuarioAperturaIdToUsuario: {
          Id: 100,
          Nombre: "cajero1",
          Persona_Empleado: [
            {
              Persona: {
                Nombre: "Juan",
                Apellido: "Pérez",
              },
            },
          ],
        },
        Usuario_Caja_UsuarioCierreIdToUsuario: {
          Id: 101,
          Nombre: "cajero2",
          Persona_Empleado: [
            {
              Persona: {
                Nombre: "Ana",
                Apellido: "García",
              },
            },
          ],
        },
      },
      {
        Id: 2,
        TenantId: 1,
        SucursalId: 10,
        UsuarioAperturaId: 100,
        UsuarioCierreId: 100,
        FechaApertura: new Date("2026-02-02T09:00:00Z"),
        FechaCierre: new Date("2026-02-02T18:00:00Z"), // Debe tener FechaCierre para historial
        EstaEliminado: false,
        MontoInicial: 0,
        MontoCierre: null,
        TotalEntradaEfectivo: 0,
        TotalSalidaEfectivo: 0,
        TotalEntradaTarjeta: 0,
        TotalSalidaTarjeta: 0,
        TotalEntradaCheque: 0,
        TotalSalidaCheque: 0,
        TotalEntradaCtaCte: 0,
        TotalSalidaCtaCte: 0,
        TotalEntradaTransf: 0,
        TotalSalidaTransf: 0,
        Ganancia: 0,
        Usuario_Caja_UsuarioAperturaIdToUsuario: {
          Id: 100,
          Nombre: "cajero1",
          Persona_Empleado: [
            {
              Persona: {
                Nombre: "Juan",
                Apellido: "Pérez",
              },
            },
          ],
        },
        Usuario_Caja_UsuarioCierreIdToUsuario: {
          Id: 100,
          Nombre: "cajero1",
          Persona_Empleado: [
            {
              Persona: {
                Nombre: "Juan",
                Apellido: "Pérez",
              },
            },
          ],
        },
      },
    ] as any);

    const req = createMockRequest(
      "http://localhost:3000/api/caja?sucursalId=10&historial=true&page=1&limit=20",
      "GET",
    );
    const response = await GET(req as any);
    const data = await response.json();

    if (response.status !== 200) {
      console.error("Error response:", JSON.stringify(data, null, 2));
      console.error("handleError was called:", vi.mocked(handleError).mock.calls);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBe(2);
    expect(data.pagination.total).toBe(2);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(20);
  });

  it("debe retornar caja abierta de la sucursal cuando soloAbierta=true", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: { id: "user-2" },
      error: null,
    } as any);

    // Configurar mocks de Prisma para este test específico
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: 20,
      Nombre: "Sucursal Norte",
      TenantId: 1,
      EstaEliminado: false,
      EstaActiva: true,
    } as any);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      Id: 2,
      TenantId: 1,
    } as any);
    vi.mocked(prisma.usuarioSucursal.findFirst).mockResolvedValue({
      UsuarioId: 2,
      SucursalId: 20,
      TenantId: 1,
    } as any);

    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: 20, Nombre: "Sucursal Norte" },
      usuarioId: 2,
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue({
      Id: 5,
      TenantId: 1,
      SucursalId: 20,
      UsuarioAperturaId: 200,
      UsuarioCierreId: null,
      FechaApertura: new Date("2026-02-05T08:00:00Z"),
      FechaCierre: null,
      EstaEliminado: false,
      MontoInicial: 0,
      MontoCierre: null,
      TotalEntradaEfectivo: 0,
      TotalSalidaEfectivo: 0,
      TotalEntradaTarjeta: 0,
      TotalSalidaTarjeta: 0,
      TotalEntradaCheque: 0,
      TotalSalidaCheque: 0,
      TotalEntradaCtaCte: 0,
      TotalSalidaCtaCte: 0,
      TotalEntradaTransf: 0,
      TotalSalidaTransf: 0,
      Ganancia: 0,
      DetalleCaja: [],
      Gasto: [],
      Movimiento: [],
      Usuario_Caja_UsuarioAperturaIdToUsuario: {
        Id: 200,
        Nombre: "cajeroNorte",
        Persona_Empleado: [
          {
            Persona: {
              Nombre: "Laura",
              Apellido: "López",
            },
          },
        ],
      },
    } as any);

    const req = createMockRequest(
      "http://localhost:3000/api/caja?sucursalId=20&soloAbierta=true",
      "GET",
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.caja).toBeDefined();
    expect(data.caja.Id).toBe(5);
    expect(data.caja.UsuarioApertura.Id).toBe(200);
  });

  it("debe retornar resumen del día con totales agregados y múltiples cajas", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: { id: "user-3" },
      error: null,
    } as any);

    const ahora = new Date("2026-02-05T12:00:00Z");
    vi.setSystemTime(ahora);

    vi.mocked(prisma.caja.findMany).mockResolvedValue([
      {
        Id: 1,
        TenantId: 1,
        UsuarioAperturaId: 100,
        UsuarioCierreId: 100,
        FechaApertura: new Date("2026-02-05T08:00:00Z"),
        FechaCierre: new Date("2026-02-05T12:00:00Z"),
        EstaEliminado: false,
        MontoInicial: 100,
        TotalEntradaEfectivo: 500,
        TotalSalidaEfectivo: 50,
        TotalEntradaTarjeta: 200,
        TotalSalidaTarjeta: 0,
        TotalEntradaCheque: 0,
        TotalSalidaCheque: 0,
        TotalEntradaCtaCte: 0,
        TotalSalidaCtaCte: 0,
        TotalEntradaTransf: 0,
        TotalSalidaTransf: 0,
        Ganancia: 150,
        Usuario_Caja_UsuarioAperturaIdToUsuario: null,
        Usuario_Caja_UsuarioCierreIdToUsuario: null,
      },
      {
        Id: BigInt(2),
        TenantId: BigInt(1),
        UsuarioAperturaId: BigInt(101),
        UsuarioCierreId: null,
        FechaApertura: new Date("2026-02-05T10:00:00Z"),
        FechaCierre: null,
        EstaEliminado: false,
        MontoInicial: 50,
        TotalEntradaEfectivo: 300,
        TotalSalidaEfectivo: 20,
        TotalEntradaTarjeta: 100,
        TotalSalidaTarjeta: 0,
        TotalEntradaCheque: 0,
        TotalSalidaCheque: 0,
        TotalEntradaCtaCte: 0,
        TotalSalidaCtaCte: 0,
        TotalEntradaTransf: 0,
        TotalSalidaTransf: 0,
        Ganancia: 80,
        Usuario_Caja_UsuarioAperturaIdToUsuario: null,
        Usuario_Caja_UsuarioCierreIdToUsuario: null,
      },
    ] as any);

    const req = createMockRequest(
      "http://localhost:3000/api/caja?resumenDia=true",
      "GET",
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resumenDia).toBeDefined();
    expect(data.resumenDia.cantidadCajas).toBe(2);
    expect(data.resumenDia.totales.montoInicial).toBe(150);
    // Fórmula: montoInicial + totalEntradaEfectivo - totalSalidaEfectivo
    // (100 + 500 - 50) + (50 + 300 - 20) = 550 + 330 = 880
    expect(data.resumenDia.totales.efectivo).toBe(880);
    expect(data.resumenDia.totales.totalCaja).toBeGreaterThan(0);
  });

  it("debe delegar en handleError cuando ocurre un error inesperado", async () => {
    const unexpected = new Error("DB crash");
    vi.mocked(getAuthUser).mockRejectedValue(unexpected);

    const req = createMockRequest(
      "http://localhost:3000/api/caja?sucursalId=1",
      "GET",
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(unexpected);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno");
  });
});

describe("POST /api/caja", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper para NextRequest simulado con body
  const createBodyRequest = (
    url: string,
    body: any,
    method: string = "POST",
  ): NextRequest =>
    ({
      ...createMockRequest(url, method),
      json: async () => body,
    }) as any;

  it("debe retornar 401 cuando no hay usuario autenticado", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: null,
      error: null,
    } as any);

    const req = createBodyRequest(
      "http://localhost:3000/api/caja?sucursalId=1",
      { montoInicial: 100 },
    );
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("debe retornar 400 si ya hay una caja abierta en la sucursal", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: { id: "user-1" },
      error: null,
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(200),
    } as any);

    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: BigInt(1), Nombre: "Sucursal 1" },
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue({
      Id: BigInt(10),
    } as any);

    const req = createBodyRequest(
      "http://localhost:3000/api/caja?sucursalId=1",
      { montoInicial: 100 },
    );
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Ya existe una caja abierta en esta sucursal");
  });

  it("debe abrir una nueva caja con monto inicial válido", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: { id: "user-2" },
      error: null,
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(300),
    } as any);

    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: BigInt(5), Nombre: "Sucursal 5" },
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue(null);

    vi.mocked(prisma.caja.create).mockResolvedValue({
      Id: BigInt(99),
      TenantId: BigInt(1),
      UsuarioAperturaId: BigInt(300),
      MontoInicial: 500,
      FechaApertura: new Date("2026-02-05T09:00:00Z"),
      EstaEliminado: false,
      Usuario_Caja_UsuarioAperturaIdToUsuario: null,
    } as any);

    const req = createBodyRequest(
      "http://localhost:3000/api/caja?sucursalId=5",
      { montoInicial: 500 },
    );
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.caja).toBeDefined();
    expect(data.caja.Id).toBe(99);
    expect(data.caja.UsuarioAperturaId).toBe(300);
  });

  it("debe retornar 400 cuando el montoInicial es negativo (validación Zod)", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: { id: "user-3" },
      error: null,
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(400),
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue(null);

    const req = createBodyRequest(
      "http://localhost:3000/api/caja?sucursalId=1",
      { montoInicial: -10 },
    );
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "El monto inicial debe ser mayor o igual a 0",
    );
  });
});

describe("PATCH /api/caja", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createBodyRequest = (
    url: string,
    body: any,
    method: string = "PATCH",
  ): NextRequest =>
    ({
      ...createMockRequest(url, method),
      json: async () => body,
    }) as any;

  it("debe retornar 400 cuando se intenta cerrar caja y no hay caja abierta", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: { id: "user-1" },
      error: null,
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(500),
    } as any);

    // Mock de verifyUserBranchAccess
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: BigInt(2),
      Nombre: "Sucursal 2",
      TenantId: BigInt(1),
      EstaEliminado: false,
      EstaActiva: true,
    } as any);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      Id: BigInt(500),
      TenantId: BigInt(1),
    } as any);
    vi.mocked(prisma.usuarioSucursal.findFirst).mockResolvedValue({
      UsuarioId: BigInt(500),
      SucursalId: BigInt(2),
      TenantId: BigInt(1),
    } as any);

    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: BigInt(2), Nombre: "Sucursal 2" },
      usuarioId: BigInt(500),
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue(null);

    const req = createBodyRequest(
      "http://localhost:3000/api/caja?sucursalId=2&accion=cerrar",
      { montoCierre: 1000 },
    );
    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No hay una caja abierta");
  });

  it("debe cerrar una caja abierta cuando se envía accion=cerrar y montoCierre válido", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: { id: "user-2" },
      error: null,
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(600),
    } as any);

    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: BigInt(3), Nombre: "Sucursal 3" },
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue({
      Id: BigInt(77),
      TenantId: BigInt(1),
      UsuarioAperturaId: BigInt(600),
      FechaApertura: new Date("2026-02-05T09:00:00Z"),
      FechaCierre: null,
      EstaEliminado: false,
    } as any);

    vi.mocked(prisma.caja.update).mockResolvedValue({
      Id: BigInt(77),
      TenantId: BigInt(1),
      UsuarioAperturaId: BigInt(600),
      UsuarioCierreId: BigInt(600),
      FechaApertura: new Date("2026-02-05T09:00:00Z"),
      FechaCierre: new Date("2026-02-05T18:00:00Z"),
      MontoCierre: 1500,
      EstaEliminado: false,
      Usuario_Caja_UsuarioCierreIdToUsuario: null,
    } as any);

    const req = createBodyRequest(
      "http://localhost:3000/api/caja?sucursalId=3&accion=cerrar",
      { montoCierre: 1500 },
    );
    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.caja).toBeDefined();
    expect(data.caja.Id).toBe(77);
    expect(data.caja.MontoCierre).toBe(1500);
  });

  it("debe retornar 404 cuando se intenta registrar un gasto con concepto inexistente", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: { id: "user-3" },
      error: null,
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(700),
    } as any);

    // Mock de verifyUserBranchAccess
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: BigInt(4),
      Nombre: "Sucursal 4",
      TenantId: BigInt(1),
      EstaEliminado: false,
      EstaActiva: true,
    } as any);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      Id: BigInt(700),
      TenantId: BigInt(1),
    } as any);
    vi.mocked(prisma.usuarioSucursal.findFirst).mockResolvedValue({
      UsuarioId: BigInt(700),
      SucursalId: BigInt(4),
      TenantId: BigInt(1),
    } as any);

    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: BigInt(4), Nombre: "Sucursal 4" },
      usuarioId: BigInt(700),
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue({
      Id: BigInt(88),
      TenantId: BigInt(1),
      FechaCierre: null,
      EstaEliminado: false,
    } as any);

    vi.mocked(prisma.conceptoGastos.findFirst).mockResolvedValue(null);

    const req = createBodyRequest(
      "http://localhost:3000/api/caja?sucursalId=4&accion=gasto",
      {
        conceptoGastoId: 999,
        descripcion: "Gasto desconocido",
        monto: 100,
      },
    );
    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Concepto de gasto no encontrado");
  });

  it("debe registrar un gasto y actualizar la salida de efectivo cuando accion=gasto es válida", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      tenantId: "1",
      user: { id: "user-4" },
      error: null,
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: 800,
    } as any);

    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: 5,
      Nombre: "Sucursal 5",
      TenantId: 1,
      EstaEliminado: false,
      EstaActiva: true,
    } as any);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      Id: 800,
      TenantId: 1,
    } as any);
    vi.mocked(prisma.usuarioSucursal.findFirst).mockResolvedValue({
      UsuarioId: 800,
      SucursalId: 5,
      TenantId: 1,
    } as any);

    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: 5, Nombre: "Sucursal 5" },
      usuarioId: 800,
    } as any);

    vi.mocked(prisma.caja.findFirst).mockResolvedValue({
      Id: 90,
      TenantId: 1,
      SucursalId: 5,
      FechaCierre: null,
      EstaEliminado: false,
    } as any);

    vi.mocked(prisma.conceptoGastos.findFirst).mockResolvedValue({
      Id: 1,
      Descripcion: "Luz",
      TenantId: 1,
      EstaEliminado: false,
    } as any);

    vi.mocked(prisma.gasto.create).mockResolvedValue({
      Id: 1,
      TenantId: 1,
      SucursalId: 5,
      CajaId: 90,
      ConceptoGastoId: 1,
      Fecha: new Date("2026-02-05T10:00:00Z"),
      Descripcion: "Pago de luz",
      Monto: 200,
      EstaEliminado: false,
      ConceptoGastos: {
        Id: 1,
        Descripcion: "Luz",
      },
    } as any);

    vi.mocked(prisma.caja.update).mockResolvedValue({} as any);

    const req = createBodyRequest(
      "http://localhost:3000/api/caja?sucursalId=5&accion=gasto",
      {
        conceptoGastoId: 1,
        descripcion: "Pago de luz",
        monto: 200,
      },
    );
    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.gasto).toBeDefined();
    expect(data.gasto.Monto).toBe(200);
    expect(prisma.caja.update).toHaveBeenCalledWith({
      where: { Id: 90 },
      data: {
        TotalSalidaEfectivo: {
          increment: 200,
        },
      },
    });
  });
});

