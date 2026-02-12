/**
 * Tests para la API de departamentos (GET).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: { departamento: { findMany: vi.fn() } },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: "Error interno" }), { status: 500 })
  ),
}));

describe("GET /api/departamentos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.departamento.findMany).mockResolvedValue([
      { Id: 1, Descripcion: "Capital", ProvinciaId: 1 },
    ] as any);
  });

  it("retorna 400 cuando provinciaId inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/departamentos?provinciaId=abc");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("Provincia");
  });

  it("retorna 200 con array de departamentos", async () => {
    const req = new NextRequest("http://localhost:3000/api/departamentos");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});
