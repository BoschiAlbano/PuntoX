/**
 * Tests para la API de provincias (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: {
    provincia: {
      findMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: "Error interno" }), { status: 500 })
  ),
}));

describe("GET /api/provincias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.provincia.findMany).mockResolvedValue([
      { Id: 1, Descripcion: "Buenos Aires" },
      { Id: 2, Descripcion: "Córdoba" },
    ] as any);
  });

  it("retorna 200 con array de provincias", async () => {
    const req = new NextRequest("http://localhost:3000/api/provincias");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].Descripcion).toBe("Buenos Aires");
  });

  it("filtra por búsqueda cuando se pasa q", async () => {
    const req = new NextRequest("http://localhost:3000/api/provincias?q=cord");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(prisma.provincia.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          Descripcion: expect.objectContaining({ contains: "cord" }),
        }),
      })
    );
  });
});
