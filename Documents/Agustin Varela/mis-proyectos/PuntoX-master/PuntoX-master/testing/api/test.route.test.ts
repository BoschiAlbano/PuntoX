import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/test/route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/auth/permissions";
import prisma from "@/DB/prisma";
import { createMockRequest } from "../utils/mocks";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@/DB/prisma", () => ({
  default: {
    articulo: {
      findMany: vi.fn(),
    },
  },
}));

describe("GET /api/test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 cuando el contexto no trae usuario", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 1,
      sucursalId: 2,
      user: null,
    } as any);

    const req = createMockRequest("http://localhost:3000/api/test");
    const response = await GET(req as any);
    const data = await response.json();

    expect(getAuthContext).toHaveBeenCalledWith({
      req,
      permission: PERMISSIONS.PRODUCTOS,
    });
    expect(response.status).toBe(403);
    expect(data.error).toBe("Usuario no encontrado");
    expect(prisma.articulo.findMany).not.toHaveBeenCalled();
  });

  it("retorna lista de articulos usando tenant y sucursal del contexto", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 10,
      sucursalId: 20,
      user: { id: "abc" },
    } as any);

    vi.mocked(prisma.articulo.findMany).mockResolvedValue([
      { Id: 1, Descripcion: "Producto A", ArticuloStock: [{ Stock: 7 }] },
    ] as any);

    const req = createMockRequest("http://localhost:3000/api/test");
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(prisma.articulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          TenantId: BigInt(10),
          EstaEliminado: false,
        },
        take: 10,
        skip: 0,
      })
    );
  });

  it("documenta comportamiento actual: ante error retorna undefined", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dbError = new Error("db down");

    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 10,
      sucursalId: 20,
      user: { id: "abc" },
    } as any);
    vi.mocked(prisma.articulo.findMany).mockRejectedValue(dbError);

    const req = createMockRequest("http://localhost:3000/api/test");
    const response = await GET(req as any);

    expect(response).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(dbError);
    consoleSpy.mockRestore();
  });

  it("debe retornar 403 cuando getAuthContext lanza error de permisos", async () => {
    const permisoError = new Error("Permiso denegado");
    permisoError.name = "PermisoError";
    (permisoError as any).status = 403;

    vi.mocked(getAuthContext).mockRejectedValue(permisoError);

    const req = createMockRequest("http://localhost:3000/api/test");
    const response = await GET(req as any);

    // Comportamiento actual: si getAuthContext lanza error, el catch devuelve undefined
    // Este test documenta que la ruta no maneja correctamente errores de permisos
    expect(response).toBeUndefined();
    expect(prisma.articulo.findMany).not.toHaveBeenCalled();
  });

  it("debe retornar lista vacía cuando no hay artículos para el tenant", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 99,
      sucursalId: 50,
      user: { id: "user-99" },
    } as any);

    vi.mocked(prisma.articulo.findMany).mockResolvedValue([]);

    const req = createMockRequest("http://localhost:3000/api/test");
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
    expect(prisma.articulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          TenantId: BigInt(99),
          EstaEliminado: false,
        },
      })
    );
  });

  it("debe usar sucursalId del contexto para filtrar ArticuloStock", async () => {
    const sucursalIdEspecifico = 777;
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 100,
      sucursalId: sucursalIdEspecifico,
      user: { id: "user-100" },
    } as any);

    vi.mocked(prisma.articulo.findMany).mockResolvedValue([
      {
        Id: 1,
        Descripcion: "Producto con stock",
        ArticuloStock: [{ Stock: 5, StockMinimo: 2, Ubicacion: "A1" }],
      },
    ] as any);

    const req = createMockRequest("http://localhost:3000/api/test");
    await GET(req as any);

    expect(prisma.articulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          ArticuloStock: expect.objectContaining({
            where: { SucursalId: BigInt(sucursalIdEspecifico) },
          }),
        }),
      })
    );
  });

  it("debe limitar resultados a 10 artículos (take: 10)", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      tenantId: 200,
      sucursalId: 300,
      user: { id: "user-200" },
    } as any);

    vi.mocked(prisma.articulo.findMany).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        Id: i + 1,
        Descripcion: `Producto ${i + 1}`,
      }))
    );

    const req = createMockRequest("http://localhost:3000/api/test");
    await GET(req as any);

    expect(prisma.articulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 0,
      })
    );
  });
});
