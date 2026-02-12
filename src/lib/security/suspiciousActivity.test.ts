/**
 * Tests para suspiciousActivity: crearAlertaSeguridad, detectarActividadSospechosa.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  crearAlertaSeguridad,
  detectarActividadSospechosa,
} from "./suspiciousActivity";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: {
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
    $queryRawUnsafe: vi.fn(),
  },
}));

describe("crearAlertaSeguridad", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crea alerta con todos los campos", async () => {
    await crearAlertaSeguridad({
      tenantId: 1n,
      tipo: "INTENTOS_FALLIDOS",
      severidad: "ALTA",
      mensaje: "Múltiples intentos fallidos",
      detalles: { email: "test@test.com", ip: "127.0.0.1" },
      usuarioId: 1n,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla",
    });
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.any(String),
      1n,
      1n,
      "INTENTOS_FALLIDOS",
      "ALTA",
      "Múltiples intentos fallidos",
      JSON.stringify({ email: "test@test.com", ip: "127.0.0.1" }),
      "127.0.0.1",
      "Mozilla"
    );
  });

  it("crea alerta con campos opcionales nulos", async () => {
    await crearAlertaSeguridad({
      tenantId: 1n,
      tipo: "LOGIN_SOSPECHOSO",
      severidad: "MEDIA",
      mensaje: "Login desde IP nueva",
    });
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.any(String),
      1n,
      null,
      "LOGIN_SOSPECHOSO",
      "MEDIA",
      "Login desde IP nueva",
      null,
      null,
      null
    );
  });
});

describe("detectarActividadSospechosa", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna NUEVO_DISPOSITIVO cuando no hay dispositivo conocido", async () => {
    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([]) // dispositivoConocido
      .mockResolvedValueOnce([]) // ipsRecientes
      .mockResolvedValueOnce([{ count: 0n }]); // intentosFallidos
    const result = await detectarActividadSospechosa(
      1n,
      1n,
      "127.0.0.1",
      "Mozilla"
    );
    expect(result.esSospechosa).toBe(true);
    expect(result.razones).toContain("NUEVO_DISPOSITIVO");
  });

  it("retorna esSospechosa=false cuando todo es normal", async () => {
    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([{ Id: 1n }]) // dispositivo conocido
      .mockResolvedValueOnce([]) // sin múltiples IPs
      .mockResolvedValueOnce([{ count: 0n }]); // sin intentos fallidos
    const result = await detectarActividadSospechosa(
      1n,
      1n,
      "127.0.0.1",
      "Mozilla"
    );
    expect(result.esSospechosa).toBe(false);
    expect(result.razones).toHaveLength(0);
  });

  it("retorna INTENTOS_FALLIDOS cuando hay 3 o más fallidos", async () => {
    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([{ Id: 1n }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: 3n }]);
    const result = await detectarActividadSospechosa(
      1n,
      1n,
      "127.0.0.1",
      "Mozilla"
    );
    expect(result.esSospechosa).toBe(true);
    expect(result.razones).toContain("INTENTOS_FALLIDOS");
  });
});
