import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/DB/prisma";
import { assertReferenciasDelTenant } from "./pertenencia";

vi.mock("@/DB/prisma", () => ({
  default: {
    marca: { count: vi.fn() },
    rubro: { count: vi.fn() },
    unidadMedida: { count: vi.fn() },
    listaPrecio: { count: vi.fn() },
    articulo: { count: vi.fn() },
  },
}));

describe("assertReferenciasDelTenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("acepta referencias del comercio (filtrando por TenantId)", async () => {
    vi.mocked(prisma.marca.count).mockResolvedValue(1);
    vi.mocked(prisma.listaPrecio.count).mockResolvedValue(2);
    await expect(
      assertReferenciasDelTenant(3, { marcaId: 10, listaPrecioIds: [1, 2, 2] }),
    ).resolves.toBeUndefined();
    expect(prisma.marca.count).toHaveBeenCalledWith({ where: { Id: { in: [10n] }, TenantId: 3n } });
    // Ids repetidos cuentan una sola vez
    expect(prisma.listaPrecio.count).toHaveBeenCalledWith({
      where: { Id: { in: [1n, 2n] }, TenantId: 3n },
    });
  });

  it("rechaza una marca de otro comercio", async () => {
    vi.mocked(prisma.marca.count).mockResolvedValue(0);
    await expect(assertReferenciasDelTenant(3, { marcaId: 99 })).rejects.toThrow(
      "Marca no válida para este comercio",
    );
  });

  it("rechaza si alguna lista de precios no es del comercio", async () => {
    vi.mocked(prisma.listaPrecio.count).mockResolvedValue(1);
    await expect(assertReferenciasDelTenant(3, { listaPrecioIds: [1, 50] })).rejects.toThrow(
      "Lista de precios no válida",
    );
  });

  it("rechaza un componente de combo de otro comercio", async () => {
    vi.mocked(prisma.articulo.count).mockResolvedValue(0);
    await expect(assertReferenciasDelTenant(3, { articuloIds: [77] })).rejects.toThrow(
      "Artículo del combo no válido para este comercio",
    );
  });

  it("no consulta nada si no hay referencias (edición parcial)", async () => {
    await assertReferenciasDelTenant(3, { marcaId: undefined, listaPrecioIds: [] });
    expect(prisma.marca.count).not.toHaveBeenCalled();
    expect(prisma.listaPrecio.count).not.toHaveBeenCalled();
  });
});
