/**
 * Tests para la API de localidades (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: { localidad: { findMany: vi.fn() } },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: "Error interno" }), { status: 500 })
  ),
}));

describe("GET /api/localidades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.localidad.findMany).mockResolvedValue([
      { Id: 1, Descripcion: "CABA", DepartamentoId: 1 },
    ] as any);
  });

  it("retorna 400 cuando departamentoId inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/localidades?departamentoId=xyz");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("Departamento");
  });

  it("retorna 200 con array de localidades", async () => {
    const req = new NextRequest("http://localhost:3000/api/localidades");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});
