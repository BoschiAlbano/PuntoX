/**
 * Tests unitarios para isFacturacionElectronicaHabilitada
 * (lib/services/facturacion.service): combina configuración AFIP del tenant
 * con el gating de plan (src/lib/planes/features.ts).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/DB/prisma";
import {
  isFacturacionElectronicaHabilitada,
  autorizarComprobante,
} from "./facturacion.service";
import { getArcaConfig, getPuntoVentaSucursal } from "./arca.service";

vi.mock("@/DB/prisma", () => ({
  default: {
    configuracion: { findFirst: vi.fn() },
    tenant: { findUnique: vi.fn() },
    comprobante: { findFirst: vi.fn() },
    facturaElectronica: { findUnique: vi.fn() },
  },
}));
vi.mock("./arca.service", () => ({
  getArcaConfig: vi.fn(),
  getPuntoVentaSucursal: vi.fn(),
  getUltimoComprobanteAutorizado: vi.fn(),
  autorizarVoucher: vi.fn(),
  getVoucherInfo: vi.fn(),
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

describe("autorizarComprobante — Nota de Crédito", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getArcaConfig).mockResolvedValue({
      cuit: 20123456789,
      cert: "cert",
      key: "key",
      production: false,
    } as any);
    vi.mocked(getPuntoVentaSucursal).mockResolvedValue(1);
  });

  const baseComprobanteNC = {
    Id: 5n,
    TenantId: 1n,
    SucursalId: 1n,
    TipoComprobante: 6, // NOTA_CREDITO
    Numero: 1,
    Fecha: new Date("2026-01-01"),
    SubTotal: 100,
    Descuento: 0,
    Total: 100,
    Iva21: 0,
    Iva105: 0,
    Comprobante_Factura: null,
    DetalleComprobante: [],
  };

  it("retorna error si la Nota de Crédito no tiene factura asociada registrada", async () => {
    vi.mocked(prisma.comprobante.findFirst).mockResolvedValue({
      ...baseComprobanteNC,
      Comprobante_NotaCredito_Comprobante_NotaCredito_IdToComprobante: null,
    } as any);

    const result = await autorizarComprobante(5n, 1n, 1n);
    expect(result.success).toBe(false);
    expect(result.errores).toContain("no tiene una factura asociada");
  });

  it("retorna error si la factura asociada no fue autorizada por AFIP", async () => {
    vi.mocked(prisma.comprobante.findFirst).mockResolvedValue({
      ...baseComprobanteNC,
      Comprobante_NotaCredito_Comprobante_NotaCredito_IdToComprobante: {
        ComprobanteId: 3n,
        Comprobante_Comprobante_NotaCredito_ComprobanteIdToComprobante: {
          TipoComprobante: 2, // FACTURA_B
          Comprobante_Factura: null,
          FacturaElectronica: { Estado: "PENDIENTE" },
        },
      },
    } as any);

    const result = await autorizarComprobante(5n, 1n, 1n);
    expect(result.success).toBe(false);
    expect(result.errores).toContain("no fue autorizada por AFIP");
  });
});
