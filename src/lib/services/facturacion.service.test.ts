/**
 * Tests unitarios para isFacturacionElectronicaHabilitada
 * (lib/services/facturacion.service): combina configuración AFIP del tenant
 * con el gating de plan (src/lib/planes/features.ts).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/DB/prisma";
import { isFacturacionElectronicaHabilitada } from "./facturacion.service";

vi.mock("@/DB/prisma", () => ({
  default: {
    configuracion: { findFirst: vi.fn() },
    tenant: { findUnique: vi.fn() },
  },
}));

const configCompleta = {
  AfipHabilitado: true,
  AfipCertificado: "cert",
  AfipClavePrivada: "key",
};

describe("isFacturacionElectronicaHabilitada", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna true cuando el plan incluye AFIP y la configuración está completa", async () => {
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(
      configCompleta as any,
    );
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Plan: { Caracteristicas: '{"incluyeAFIP":true}' },
    } as any);

    await expect(isFacturacionElectronicaHabilitada(1n)).resolves.toBe(true);
  });

  it("retorna false cuando el plan NO incluye AFIP, aunque la configuración esté completa", async () => {
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(
      configCompleta as any,
    );
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Plan: { Caracteristicas: '{"incluyeAFIP":false}' },
    } as any);

    await expect(isFacturacionElectronicaHabilitada(1n)).resolves.toBe(false);
  });

  it("retorna false cuando el plan incluye AFIP pero falta configuración/certificados", async () => {
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({
      AfipHabilitado: false,
      AfipCertificado: null,
      AfipClavePrivada: null,
    } as any);
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Plan: { Caracteristicas: '{"incluyeAFIP":true}' },
    } as any);

    await expect(isFacturacionElectronicaHabilitada(1n)).resolves.toBe(false);
  });
});
