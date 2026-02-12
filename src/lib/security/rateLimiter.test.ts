/**
 * Tests para rateLimiter: checkRateLimit, isIpBlocked, blockIp.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkRateLimit,
  isIpBlocked,
  blockIp,
} from "./rateLimiter";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: {
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("checkRateLimit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna allowed=true cuando no hay intentos", async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ count: 0n }] as any);
    const result = await checkRateLimit({
      maxAttempts: 5,
      windowMinutes: 15,
      identifier: "test@test.com",
      tenantId: 1n,
    });
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(5);
    expect(result.resetAt).toBeInstanceOf(Date);
  });

  it("retorna allowed=false cuando se excede el límite", async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ count: 5n }] as any);
    const result = await checkRateLimit({
      maxAttempts: 5,
      windowMinutes: 15,
      identifier: "test@test.com",
      tenantId: 1n,
    });
    expect(result.allowed).toBe(false);
    expect(result.remainingAttempts).toBe(0);
  });

  it("considera identifier como email cuando contiene @", async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ count: 2n }] as any);
    await checkRateLimit({
      maxAttempts: 5,
      windowMinutes: 15,
      identifier: "user@domain.com",
      tenantId: 1n,
    });
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.any(String),
      1n,
      "user@domain.com",
      "email",
      expect.any(Date)
    );
  });

  it("considera identifier como ip cuando no contiene @", async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ count: 2n }] as any);
    await checkRateLimit({
      maxAttempts: 10,
      windowMinutes: 15,
      identifier: "192.168.1.1",
      tenantId: 1n,
    });
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.any(String),
      1n,
      "192.168.1.1",
      "ip",
      expect.any(Date)
    );
  });
});

describe("isIpBlocked", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna true cuando la IP está bloqueada", async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ EstaActiva: true }] as any);
    const result = await isIpBlocked("192.168.1.1", 1n);
    expect(result).toBe(true);
  });

  it("retorna false cuando la IP no está bloqueada", async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([]);
    const result = await isIpBlocked("192.168.1.1", 1n);
    expect(result).toBe(false);
  });
});

describe("blockIp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("bloquea IP con fecha de desbloqueo cuando se especifica minutosBloqueo", async () => {
    await blockIp("192.168.1.1", 1n, "Intentos fallidos", 30);
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.any(String),
      1n,
      "192.168.1.1",
      "Intentos fallidos",
      expect.any(Date)
    );
  });

  it("bloquea IP sin fecha de desbloqueo cuando no se especifica", async () => {
    await blockIp("192.168.1.1", 1n, "Intentos fallidos");
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.any(String),
      1n,
      "192.168.1.1",
      "Intentos fallidos",
      null
    );
  });
});
