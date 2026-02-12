/**
 * Tests para la API de gastos (POST, DELETE).
 * Estructura alineada con marcas/route.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, DELETE } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";
import { PermisoError } from "@/lib/requirePermiso";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findFirst: vi.fn() },
    caja: { findFirst: vi.fn(), update: vi.fn() },
    conceptoGastos: { findFirst: vi.fn() },
    gasto: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    formaPago: { updateMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/sucursal/verifyUserBranch", () => ({
  verifyUserBranchAccess: vi.fn(),
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    const msg = error instanceof PermisoError ? error.message : "Error interno";
    const status = error instanceof PermisoError ? error.status : 500;
    return new Response(JSON.stringify({ error: msg }), { status });
  }),
}));

const authOk = {
  tenantId: 1,
  user: { id: "auth-user-1" },
};
const cajaAbierta = {
  Id: BigInt(1),
  TenantId: BigInt(1),
  SucursalId: BigInt(1),
  UsuarioAperturaId: 1,
  FechaCierre: null,
  EstaEliminado: false,
};
const conceptoValido = {
  Id: BigInt(1),
  TenantId: BigInt(1),
  EstaEliminado: false,
};

describe("POST /api/gastos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1 } as any);
    vi.mocked(prisma.caja.findFirst).mockResolvedValue(cajaAbierta as any);
    vi.mocked(prisma.conceptoGastos.findFirst).mockResolvedValue(
      conceptoValido as any,
    );
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      const tx = {
        gasto: {
          create: vi.fn().mockResolvedValue({
            Id: BigInt(10),
            CajaId: BigInt(1),
            ConceptoGastoId: BigInt(1),
            TenantId: BigInt(1),
            Monto: 100,
            Descripcion: "Gasto test",
          }),
        },
        formaPago: { createMany: vi.fn().mockResolvedValue({}) },
        caja: { update: vi.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });
  });

  it("retorna 403 si no tiene permiso CAJA", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("Permiso denegado", 403),
    );
    const req = new NextRequest("http://localhost:3000/api/gastos", {
      method: "POST",
      body: JSON.stringify({
        conceptoGastoId: 1,
        descripcion: "Gasto válido",
        pagos: [{ tipoPago: TIPO_PAGO.EFECTIVO, monto: 100 }],
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 con error cuando el body es inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/gastos", {
      method: "POST",
      body: JSON.stringify({
        conceptoGastoId: 1,
        descripcion: "",
        pagos: [],
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 sin caja abierta", async () => {
    vi.mocked(prisma.caja.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/gastos", {
      method: "POST",
      body: JSON.stringify({
        conceptoGastoId: 1,
        descripcion: "Gasto válido",
        pagos: [{ tipoPago: TIPO_PAGO.EFECTIVO, monto: 100 }],
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("caja abierta");
  });

  it("retorna 404 cuando el concepto no existe", async () => {
    vi.mocked(prisma.conceptoGastos.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/gastos", {
      method: "POST",
      body: JSON.stringify({
        conceptoGastoId: 999,
        descripcion: "Gasto válido",
        pagos: [{ tipoPago: TIPO_PAGO.EFECTIVO, monto: 100 }],
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toContain("Concepto");
  });

  it("retorna 200/201 con gasto creado cuando todo es válido", async () => {
    const req = new NextRequest("http://localhost:3000/api/gastos", {
      method: "POST",
      body: JSON.stringify({
        conceptoGastoId: 1,
        descripcion: "Gasto válido",
        pagos: [{ tipoPago: TIPO_PAGO.EFECTIVO, monto: 100 }],
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect([200, 201]).toContain(res.status);
    expect(data.gasto).toBeDefined();
    expect(data.gasto.Id).toBe(10);
    expect(data.gasto.Descripcion).toBe("Gasto test");
  });
});

describe("DELETE /api/gastos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.gasto.findFirst).mockResolvedValue({
      Id: BigInt(1),
      CajaId: BigInt(1),
      FormaPago: [{ TipoPago: TIPO_PAGO.EFECTIVO, Monto: 100 }],
      Caja: { FechaCierre: null },
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      const tx = {
        caja: { update: vi.fn().mockResolvedValue({}) },
        formaPago: { updateMany: vi.fn().mockResolvedValue({}) },
        gasto: { update: vi.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });
  });

  it("retorna 403 si no tiene permiso CAJA", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("Permiso denegado", 403),
    );
    const req = new NextRequest("http://localhost:3000/api/gastos?id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 400 cuando el id no se proporciona", async () => {
    const req = new NextRequest("http://localhost:3000/api/gastos", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("ID");
  });

  it("retorna 404 cuando el gasto no existe", async () => {
    vi.mocked(prisma.gasto.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/gastos?id=999", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toContain("no encontrado");
  });

  it("retorna 200 cuando el gasto se elimina correctamente", async () => {
    const req = new NextRequest("http://localhost:3000/api/gastos?id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBeDefined();
  });
});
