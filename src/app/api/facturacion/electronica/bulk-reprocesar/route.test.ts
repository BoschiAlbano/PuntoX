/**
 * Test del gating de plan en POST /api/facturacion/electronica/bulk-reprocesar.
 * Cubre solo el chequeo nuevo (403 cuando el plan no incluye AFIP); el resto
 * del flujo (autorización ARCA en lote) no tenía tests previos y queda fuera
 * de foco.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { planIncluyeAFIP } from "@/lib/planes/features";
import { isFacturacionElectronicaHabilitada } from "@/lib/services/facturacion.service";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/lib/planes/features", () => ({
  planIncluyeAFIP: vi.fn(),
}));
vi.mock("@/lib/services/facturacion.service", () => ({
  isFacturacionElectronicaHabilitada: vi.fn(),
  autorizarComprobante: vi.fn(),
}));
vi.mock("@/lib/services/arca.service", () => ({
  getArcaConfig: vi.fn(),
  getUltimoComprobanteAutorizado: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    comprobante: { findUnique: vi.fn(), update: vi.fn() },
    usuario: { findFirst: vi.fn() },
    configuracion: { findFirst: vi.fn() },
    facturaElectronica: {
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    facturaElectronicaIva: { deleteMany: vi.fn() },
  },
}));

describe("POST /api/facturacion/electronica/bulk-reprocesar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 cuando el plan no incluye Facturación Electrónica", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ tenantId: 1 } as any);
    vi.mocked(planIncluyeAFIP).mockResolvedValue(false);

    const req = new NextRequest(
      "http://localhost:3000/api/facturacion/electronica/bulk-reprocesar",
      {
        method: "POST",
        body: JSON.stringify({ comprobantesIds: [1, 2] }),
      },
    );
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("no incluye Facturación Electrónica");
    expect(isFacturacionElectronicaHabilitada).not.toHaveBeenCalled();
  });
});
