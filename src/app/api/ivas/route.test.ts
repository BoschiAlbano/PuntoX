/**
 * Tests para la API de IVAs (GET, POST, PATCH, DELETE).
 * Usa getAuthUser (no getAuthContext).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "./route";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import prisma from "@/DB/prisma";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthUser: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    iva: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((err: unknown) =>
    new Response(JSON.stringify({ error: "Error interno" }), { status: 500 }),
  ),
}));
vi.mock("@/lib/pagination", () => ({
  parsePaginationParams: vi.fn(() => ({ page: 1, limit: 20, skip: 0 })),
  createPaginationResponse: vi.fn((data: unknown[], total: number) => ({
    data,
    pagination: { page: 1, limit: 20, total, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  })),
}));

describe("GET /api/ivas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue({ tenantId: 1 } as any);
    vi.mocked(prisma.iva.count).mockResolvedValue(1);
    vi.mocked(prisma.iva.findMany).mockResolvedValue([
      { Id: 1, Descripcion: "IVA 21", Porcentaje: 21, EstaEliminado: false },
    ] as any);
  });

  it("retorna 401 cuando getAuthUser devuelve error", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 }),
    } as any);
    const req = new NextRequest("http://localhost:3000/api/ivas");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("retorna 200 con data y pagination", async () => {
    const req = new NextRequest("http://localhost:3000/api/ivas?limit=20");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
  });
});

describe("POST /api/ivas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue({ tenantId: 1 } as any);
    vi.mocked(prisma.iva.create).mockResolvedValue({
      Id: BigInt(1),
      Descripcion: "IVA 21",
      Porcentaje: 21,
      EstaEliminado: false,
    } as any);
  });

  it("retorna 400 con error y details cuando body inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/ivas", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "", Porcentaje: -1 }),
    });
    const res = await POST(req as any);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
    expect(data.details).toBeDefined();
  });

  it("retorna 201 con iva creado", async () => {
    const req = new NextRequest("http://localhost:3000/api/ivas", {
      method: "POST",
      body: JSON.stringify({ Descripcion: "IVA 21", Porcentaje: 21 }),
    });
    const res = await POST(req as any);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.Id).toBe(1);
    expect(data.Descripcion).toBe("IVA 21");
  });
});

describe("PATCH /api/ivas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue({ tenantId: 1 } as any);
    vi.mocked(prisma.iva.update).mockResolvedValue({
      Id: BigInt(1),
      Descripcion: "IVA 10.5",
      Porcentaje: 10.5,
    } as any);
  });

  it("retorna 400 con details cuando body inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/ivas", {
      method: "PATCH",
      body: JSON.stringify({ Id: 1, Descripcion: "", Porcentaje: -1 }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.details).toBeDefined();
  });

  it("retorna 201 con iva actualizado", async () => {
    const req = new NextRequest("http://localhost:3000/api/ivas", {
      method: "PATCH",
      body: JSON.stringify({ Id: 1, Descripcion: "IVA 10.5", Porcentaje: 10.5 }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.Id).toBe(1);
  });
});

describe("DELETE /api/ivas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue({ tenantId: 1 } as any);
  });

  it("retorna 400 cuando id inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/ivas?id=abc", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("invalido");
  });

  it("retorna 404 cuando iva no existe", async () => {
    vi.mocked(prisma.iva.delete).mockRejectedValue(new Error("Record to update not found"));
    const req = new NextRequest("http://localhost:3000/api/ivas?Id=999", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(404);
  });

  it("retorna 200 con success e Id", async () => {
    vi.mocked(prisma.iva.delete).mockResolvedValue({ Id: BigInt(1) } as any);
    const req = new NextRequest("http://localhost:3000/api/ivas?Id=1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.Id).toBe(1);
  });
});
