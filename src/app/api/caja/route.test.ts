/**
 * Tests para la API de caja (GET, POST abrir, PATCH cerrar).
 * Estructura de referencia: src/app/api/marcas/route.test.ts
 * Usa getAuthContext; mismo patrón de mocks y casos 401/400/200.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, after } from "next/server";
import { enviarEmailCierreCaja } from "@/lib/caja/emailCierre";
import { GET, POST, PATCH } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    caja: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    usuario: { findFirst: vi.fn() },
    // Guard de cierre: comprobantes pendientes de cobro
    comprobante: { count: vi.fn() },
    // Al cerrar, se marcan como leídas las notificaciones de la caja
    notificacion: { updateMany: vi.fn() },
  },
}));
// after() de Next solo funciona dentro de un request real: se captura el callback.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: vi.fn(),
}));
vi.mock("@/lib/caja/emailCierre", () => ({ enviarEmailCierreCaja: vi.fn() }));
vi.mock("@/lib/sucursal/verifyUserBranch", () => ({
  verifyUserBranchAccess: vi.fn(),
}));
vi.mock("@/lib/pagination", () => ({
  parsePaginationParams: vi.fn(() => ({ page: 1, limit: 20, skip: 0 })),
  createPaginationResponse: vi.fn((data: unknown[], total: number) => ({
    data,
    pagination: {
      page: 1,
      limit: 20,
      total,
      totalPages: total ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  })),
}));
const authOk = {
  user: { id: "auth-1" },
  tenantId: 1,
};

describe("GET /api/caja", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 si no está autenticado", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("No autenticado", 401),
    );
    const req = new NextRequest("http://localhost:3000/api/caja");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error ?? data.message).toBeDefined();
  });

  it("retorna 200 con data y pagination cuando está autenticado", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.caja.count).mockResolvedValue(0);
    vi.mocked(prisma.caja.findMany).mockResolvedValue([]);
    const req = new NextRequest("http://localhost:3000/api/caja");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });
});

describe("POST /api/caja", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 si no está autenticado", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("No autenticado", 401),
    );
    const req = new NextRequest("http://localhost:3000/api/caja", {
      method: "POST",
      body: JSON.stringify({ montoInicial: 0 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 con error cuando el body es inválido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1 } as any);
    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: 1n, Nombre: "Suc1" },
    } as any);
    vi.mocked(prisma.caja.findFirst).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/caja", {
      method: "POST",
      body: JSON.stringify({ montoInicial: -100 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con caja creada cuando el body es válido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1 } as any);
    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: 1n, Nombre: "Suc1" },
    } as any);
    vi.mocked(prisma.caja.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.caja.create).mockResolvedValue({
      Id: 1,
      TenantId: 1,
      UsuarioAperturaId: 1,
      MontoInicial: 0,
      Usuario_Caja_UsuarioAperturaIdToUsuario: null,
    } as any);
    const req = new NextRequest("http://localhost:3000/api/caja", {
      method: "POST",
      body: JSON.stringify({ montoInicial: 0 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.caja).toBeDefined();
    expect(data.caja.Id).toBe(1);
  });
});

describe("PATCH /api/caja", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Por defecto no hay comprobantes pendientes de cobro (no bloquea el cierre)
    vi.mocked(prisma.comprobante.count).mockResolvedValue(0);
  });

  it("retorna 401 si no está autenticado", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("No autenticado", 401),
    );
    const req = new NextRequest(
      "http://localhost:3000/api/caja?accion=cerrar",
      {
        method: "PATCH",
        body: JSON.stringify({ montoCierre: 100 }),
      },
    );
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 cuando no tiene caja abierta", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1 } as any);
    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: 1n, Nombre: "Suc1" },
    } as any);
    vi.mocked(prisma.caja.findFirst).mockResolvedValue(null);
    const req = new NextRequest(
      "http://localhost:3000/api/caja?accion=cerrar",
      {
        method: "PATCH",
        body: JSON.stringify({ montoCierre: 100 }),
      },
    );
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("No hay una caja abierta en esta sucursal");
  });

  it("retorna 400 cuando hay comprobantes pendientes de cobro", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1 } as any);
    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: 1n, Nombre: "Suc1" },
    } as any);
    vi.mocked(prisma.caja.findFirst).mockResolvedValue({ Id: 1 } as any);
    vi.mocked(prisma.comprobante.count).mockResolvedValue(2);
    const req = new NextRequest(
      "http://localhost:3000/api/caja?accion=cerrar",
      {
        method: "PATCH",
        body: JSON.stringify({ montoCierre: 100 }),
      },
    );
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.pendientesCount).toBe(2);
    expect(prisma.caja.update).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it("retorna 400 con error cuando el body para cerrar es inválido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1 } as any);
    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: 1n, Nombre: "Suc1" },
    } as any);
    vi.mocked(prisma.caja.findFirst).mockResolvedValue({
      Id: 1,
      UsuarioAperturaId: 1,
      Usuario_Caja_UsuarioCierreIdToUsuario: null,
    } as any);
    const req = new NextRequest(
      "http://localhost:3000/api/caja?accion=cerrar",
      {
        method: "PATCH",
        body: JSON.stringify({ montoCierre: -50 }),
      },
    );
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con caja cerrada cuando el body es válido", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authOk as any);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({ Id: 1 } as any);
    vi.mocked(verifyUserBranchAccess).mockResolvedValue({
      sucursal: { Id: 1n, Nombre: "Suc1" },
    } as any);
    vi.mocked(prisma.caja.findFirst)
      .mockResolvedValueOnce({
        Id: 1,
        TenantId: 1,
        UsuarioAperturaId: 1,
        UsuarioCierreId: null,
        Usuario_Caja_UsuarioCierreIdToUsuario: null,
      } as any)
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.caja.update).mockResolvedValue({
      Id: 1,
      TenantId: 1,
      UsuarioAperturaId: 1,
      UsuarioCierreId: 1,
      Usuario_Caja_UsuarioCierreIdToUsuario: { Id: 1, Nombre: "user" },
    } as any);
    const req = new NextRequest(
      "http://localhost:3000/api/caja?accion=cerrar",
      {
        method: "PATCH",
        body: JSON.stringify({ montoCierre: 100 }),
      },
    );
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.caja).toBeDefined();
    expect(data.caja.UsuarioCierreId).toBe(1);
    // El email de cierre se programa en segundo plano para la caja cerrada
    expect(after).toHaveBeenCalledTimes(1);
    await (vi.mocked(after).mock.calls[0][0] as () => Promise<unknown>)();
    expect(enviarEmailCierreCaja).toHaveBeenCalledWith(1, 1n);
  });
});
