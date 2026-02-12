/**
 * Tests para la API de clientes en ventas (GET).
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
    persona: { findMany: vi.fn() },
    formaPago: { findMany: vi.fn() },
    comprobante: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: err instanceof PermisoError ? err.message : "Error interno" }), {
      status: err instanceof PermisoError ? 403 : 500,
    })
  ),
}));

describe("GET /api/ventas/clientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 si no tiene permiso CLIENTES", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
    const req = new NextRequest("http://localhost:3000/api/ventas/clientes");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it("retorna 200 con array de clientes cuando tiene permiso", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      usuarioId: 1,
      user: {} as any,
      sucursalId: 0,
      isSuperAdmin: false,
      permissions: ["clientes"],
    });
    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      {
        Id: BigInt(1),
        Nombre: "Juan",
        Apellido: "Pérez",
        Dni: "12345678",
        Mail: "juan@test.com",
        Direccion: "Calle 1",
        Persona_Cliente: {
          Id: 1,
          ActivarCtaCte: false,
          TieneLimiteCompra: false,
          MontoMaximoCtaCte: 0,
        },
      },
    ] as any);
    vi.mocked(prisma.formaPago.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.comprobante.findMany)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any);

    const req = new NextRequest("http://localhost:3000/api/ventas/clientes");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].nombre).toBe("Juan");
    expect(data[0].apellido).toBe("Pérez");
    expect(data[0].nombreCompleto).toBe("Juan Pérez");
  });
});
