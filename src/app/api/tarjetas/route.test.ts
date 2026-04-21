/**
 * Tests para la API de tarjetas (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: {
    tarjeta: {
      findMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn(
    (err: unknown) =>
      new Response(JSON.stringify({ error: "Error interno" }), { status: 500 }),
  ),
}));

describe("GET /api/tarjetas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue({ tenantId: 1 } as any);
    vi.mocked(prisma.tarjeta.findMany).mockResolvedValue([
      { Id: BigInt(1), Descripcion: "Visa" },
      { Id: BigInt(2), Descripcion: "Mastercard" },
    ] as any);
  });

  it("retorna 401 cuando getAuthContext rechaza por no autenticado", async () => {
    vi.mocked(getAuthContext).mockRejectedValue(
      new PermisoError("No autenticado", 401),
    );
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("retorna 200 con tarjetas", async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.tarjetas).toBeDefined();
    expect(Array.isArray(data.tarjetas)).toBe(true);
    expect(data.tarjetas[0]).toEqual({ id: 1, descripcion: "Visa" });
  });
});
