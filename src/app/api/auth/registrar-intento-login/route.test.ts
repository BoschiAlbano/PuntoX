/**
 * Tests para la API registrar-intento-login (POST).
 * Registra intentos de login (exitoso o fallido) con rate limiting.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import * as rateLimiter from "@/lib/security/rateLimiter";
import prisma from "@/DB/prisma";

vi.mock("@/lib/security/rateLimiter", () => ({
  checkRateLimit: vi.fn(),
  isIpBlocked: vi.fn(),
  blockIp: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findUnique: vi.fn(), findFirst: vi.fn() },
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("POST /api/auth/registrar-intento-login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimiter.isIpBlocked).mockResolvedValue(false);
    vi.mocked(rateLimiter.checkRateLimit).mockResolvedValue({ allowed: true, resetAt: new Date() });
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(undefined as any);
  });

  it("retorna 400 cuando falta el email", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/registrar-intento-login", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Email es requerido");
  });

  it("retorna 429 cuando la IP está bloqueada (intento fallido)", async () => {
    vi.mocked(rateLimiter.isIpBlocked).mockResolvedValue(true);
    const req = new NextRequest("http://localhost:3000/api/auth/registrar-intento-login", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", exitoso: false, tenantId: 1 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(429);
    expect(data.error).toContain("IP bloqueada");
  });

  it("retorna 200 cuando el intento es exitoso y se registra", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/registrar-intento-login", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", exitoso: true, tenantId: 1 }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toContain("registrado");
  });

  it("retorna 200 cuando no hay tenantId (desarrollo)", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const req = new NextRequest("http://localhost:3000/api/auth/registrar-intento-login", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", exitoso: false }),
    });
    const res = await POST(req);
    const data = await res.json();
    process.env.NODE_ENV = originalEnv;
    expect(res.status).toBe(200);
    expect(data.message).toBeDefined();
  });
});
