/**
 * Tests para verifyUserBranchAccess.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyUserBranchAccess } from "./verifyUserBranch";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: {
    sucursal: { findFirst: vi.fn() },
    usuario: { findUnique: vi.fn() },
    usuarioSucursal: { findFirst: vi.fn() },
  },
}));

describe("verifyUserBranchAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null cuando sucursalId es null", async () => {
    const result = await verifyUserBranchAccess(
      BigInt(1),
      "auth-123",
      null
    );
    expect(result).toBeNull();
    expect(prisma.sucursal.findFirst).not.toHaveBeenCalled();
  });

  it("retorna null cuando sucursalId es undefined", async () => {
    const result = await verifyUserBranchAccess(
      BigInt(1),
      "auth-123",
      undefined
    );
    expect(result).toBeNull();
  });

  it("lanza notFound cuando la sucursal no existe", async () => {
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue(null);

    await expect(
      verifyUserBranchAccess(BigInt(1), "auth-123", 999)
    ).rejects.toThrow(/sucursal/i);
  });

  it("retorna sucursal y usuarioId cuando el acceso es válido", async () => {
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: BigInt(1),
      Nombre: "Central",
      TenantId: BigInt(1),
      EstaEliminado: false,
      EstaActiva: true,
    } as any);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      Id: BigInt(10),
      TenantId: BigInt(1),
    } as any);
    vi.mocked(prisma.usuarioSucursal.findFirst).mockResolvedValue({
      UsuarioId: BigInt(10),
      SucursalId: BigInt(1),
    } as any);

    const result = await verifyUserBranchAccess(
      BigInt(1),
      "auth-123",
      1
    );

    expect(result).not.toBeNull();
    expect(result?.sucursal.Id).toBe(BigInt(1));
    expect(result?.usuarioId).toBe(BigInt(10));
  });

  it("lanza forbidden cuando el usuario no tiene acceso a la sucursal", async () => {
    vi.mocked(prisma.sucursal.findFirst).mockResolvedValue({
      Id: BigInt(1),
      Nombre: "Central",
      TenantId: BigInt(1),
    } as any);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      Id: BigInt(10),
      TenantId: BigInt(1),
    } as any);
    vi.mocked(prisma.usuarioSucursal.findFirst).mockResolvedValue(null);

    await expect(
      verifyUserBranchAccess(BigInt(1), "auth-123", 1)
    ).rejects.toThrow(/acceso/i);
  });
});
