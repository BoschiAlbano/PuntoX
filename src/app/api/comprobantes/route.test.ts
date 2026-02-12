/**
 * Tests para la API de comprobantes (GET, POST).
 * Estructura de referencia: src/app/api/marcas/route.test.ts
 * (Esta ruta usa getAuthUser en lugar de getAuthContext; mismo patrón de mocks y casos.)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthUser: vi.fn(),
}));
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    comprobante: { findUnique: vi.fn() },
    usuario: { findFirst: vi.fn() },
    articulo: { findMany: vi.fn() },
    configuracion: { findFirst: vi.fn() },
    caja: { findFirst: vi.fn() },
    persona: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
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
  error: null,
};
const authError = {
  user: null,
  tenantId: null,
  error: new Response(JSON.stringify({ message: "No autenticado" }), { status: 401 }),
};

describe("GET /api/comprobantes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 si no está autenticado", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(authError as any);
    const req = new NextRequest("http://localhost:3000/api/comprobantes");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error ?? data.message).toBeDefined();
  });

  it("retorna 400 cuando no se envía id", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(authOk as any);
    const req = new NextRequest("http://localhost:3000/api/comprobantes");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("ID requerido");
  });

  it("retorna 404 cuando el comprobante no existe", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(authOk as any);
    vi.mocked(prisma.comprobante.findUnique).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/comprobantes?id=99");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Comprobante no encontrado");
  });

  it("retorna 200 con comprobante cuando existe", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(authOk as any);
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
    vi.mocked(prisma.comprobante.findUnique).mockResolvedValue(comprobante as any);
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
    vi.mocked(getAuthUser).mockResolvedValue({
      user: null,
      tenantId: null,
      error: new Response(JSON.stringify({ message: "No autenticado" }), { status: 401 }),
    } as any);
    const req = new NextRequest("http://localhost:3000/api/comprobantes", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 con error y details cuando el body es inválido", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(authOk as any);
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-1" } }, error: null }) },
    } as any);
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
