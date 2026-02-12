/**
 * Tests para el servicio de contadores (getNextNumeroComprobante).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNextNumeroComprobante } from "./contadores";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: {
    contador: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("getNextNumeroComprobante", () => {
  beforeEach(() => vi.clearAllMocks());

  it("incrementa y retorna el siguiente número cuando existe contador", async () => {
    vi.mocked(prisma.contador.findFirst).mockResolvedValue({
      Id: BigInt(1),
      Valor: 5,
      TenantId: BigInt(1),
      TipoComprobante: 1,
      EstaEliminado: false,
    } as any);
    vi.mocked(prisma.contador.update).mockResolvedValue({
      Id: BigInt(1),
      Valor: 6,
    } as any);

    const result = await getNextNumeroComprobante(BigInt(1), 1);
    expect(result).toBe(6);
    expect(prisma.contador.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { Id: BigInt(1) },
        data: { Valor: { increment: 1 } },
      }),
    );
  });

  it("crea contador nuevo cuando no existe", async () => {
    vi.mocked(prisma.contador.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.contador.create).mockResolvedValue({
      Id: BigInt(1),
      Valor: 0,
      TenantId: BigInt(1),
      TipoComprobante: 1,
    } as any);
    vi.mocked(prisma.contador.update).mockResolvedValue({
      Id: BigInt(1),
      Valor: 1,
    } as any);

    const result = await getNextNumeroComprobante(BigInt(1), 1);
    expect(result).toBe(1);
    expect(prisma.contador.create).toHaveBeenCalled();
    expect(prisma.contador.update).toHaveBeenCalled();
  });
});
