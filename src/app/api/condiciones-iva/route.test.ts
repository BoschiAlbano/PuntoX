/**
 * Tests para la API de condiciones IVA (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: {
    condicionIva: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: "Error interno" }), { status: 500 })
  ),
}));

describe("GET /api/condiciones-iva", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 200 con array de condiciones", async () => {
    vi.mocked(prisma.condicionIva.findMany).mockResolvedValue([
      { Id: BigInt(1), Descripcion: "Responsable Inscripto" },
      { Id: BigInt(2), Descripcion: "Monotributista" },
    ] as any);

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0]).toEqual({ id: 1, descripcion: "Responsable Inscripto" });
  });

  it("crea condiciones por defecto cuando no hay ninguna", async () => {
    vi.mocked(prisma.condicionIva.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { Id: BigInt(1), Descripcion: "Responsable Inscripto" },
      ] as any);
    vi.mocked(prisma.condicionIva.create).mockResolvedValue({} as any);

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(prisma.condicionIva.create).toHaveBeenCalled();
    expect(Array.isArray(data)).toBe(true);
  });
});
