import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/DB/prisma";
import { sendEmail } from "@/lib/email/send";
import { destinatariosAdministradores } from "@/lib/email/destinatarios";
import {
  ENTIDAD_TIPO_RESUMEN,
  diaAnteriorArgentina,
  mensajeResumen,
  procesarResumenDiario,
} from "./diario";

vi.mock("@/DB/prisma", () => ({
  default: {
    configuracion: { findMany: vi.fn() },
    notificacion: { findFirst: vi.fn(), create: vi.fn() },
    comprobante: { aggregate: vi.fn() },
    caja: { count: vi.fn(), findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));
vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/email/destinatarios", () => ({
  destinatariosAdministradores: vi.fn(),
}));

// 26/11/2026 07:00 ART = 10:00 UTC (hora del cron)
const AHORA = new Date("2026-11-26T10:00:00Z");

describe("diaAnteriorArgentina", () => {
  it("cubre el día anterior completo en hora Argentina", () => {
    const { fecha, desde, hasta } = diaAnteriorArgentina(AHORA);
    expect(fecha).toBe("2026-11-25");
    expect(desde.toISOString()).toBe("2026-11-25T03:00:00.000Z"); // 00:00 ART
    expect(hasta.toISOString()).toBe("2026-11-26T03:00:00.000Z"); // 00:00 ART del día siguiente
  });

  it("a las 23:30 ART (02:30 UTC del día siguiente) el 'ayer' sigue siendo correcto", () => {
    expect(diaAnteriorArgentina(new Date("2026-11-27T02:30:00Z")).fecha).toBe("2026-11-25");
  });

  it("cruza meses", () => {
    expect(diaAnteriorArgentina(new Date("2026-12-01T10:00:00Z")).fecha).toBe("2026-11-30");
  });
});

describe("mensajeResumen", () => {
  it("arma el texto según los datos", () => {
    expect(mensajeResumen({ ventasCount: 0, ventasTotal: 0, stockBajoCount: 0, cajasAbiertas: 0 })).toBe(
      "Sin ventas registradas.",
    );
    expect(
      mensajeResumen({ ventasCount: 3, ventasTotal: 1500.5, stockBajoCount: 2, cajasAbiertas: 1 }),
    ).toBe("3 ventas por $1.500,50. 2 productos con stock bajo. 1 caja sigue abierta.");
  });
});

describe("procesarResumenDiario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.configuracion.findMany).mockResolvedValue([
      { TenantId: 5n, Tenant: { Nombre: "Kiosco Ana" } },
    ] as any);
    vi.mocked(prisma.notificacion.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.comprobante.aggregate).mockResolvedValue({
      _sum: { Total: 1000 },
      _count: { Id: 4 },
    } as any);
    // 1ª consulta: stock bajo; 2ª: clientes sobre su límite (ambas vacías)
    vi.mocked(prisma.$queryRaw).mockResolvedValue([] as any);
    vi.mocked(prisma.caja.count).mockResolvedValue(0);
    vi.mocked(prisma.caja.findMany).mockResolvedValue([] as any);
    vi.mocked(destinatariosAdministradores).mockResolvedValue({
      adminIds: [10n],
      emails: ["duenio@kiosco.com"],
    });
    vi.mocked(sendEmail).mockResolvedValue({ ok: true, id: "em_1" });
  });

  it("filtra las ventas del día anterior y manda notificación + email", async () => {
    const res = await procesarResumenDiario(AHORA);

    expect(res).toEqual({ fecha: "2026-11-25", procesados: 1, emailsEnviados: 1, errores: 0 });
    const filtro = vi.mocked(prisma.comprobante.aggregate).mock.calls[0][0] as any;
    expect(filtro.where.Fecha.gte.toISOString()).toBe("2026-11-25T03:00:00.000Z");
    expect(filtro.where.Fecha.lt.toISOString()).toBe("2026-11-26T03:00:00.000Z");

    const notif = vi.mocked(prisma.notificacion.create).mock.calls[0][0].data as any;
    expect(notif).toMatchObject({
      TenantId: 5n,
      Titulo: "Resumen del 25/11/2026",
      EntidadTipo: ENTIDAD_TIPO_RESUMEN,
      EntidadId: "2026-11-25",
      Tipo: "INFO",
    });

    const email = vi.mocked(sendEmail).mock.calls[0][0];
    expect(email.to).toEqual(["duenio@kiosco.com"]);
    expect(email.subject).toBe("Resumen del 25/11/2026 · Kiosco Ana");
    expect(email.html).toContain("$1.000,00");
    expect(email.html).toContain("$250,00"); // ticket promedio
  });

  it("suma stock bajo, clientes sobre su límite y cajas con diferencia", async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([
        { nombre: "Coca 2L", sucursal: "Centro", stock: 1, minimo: 6, total: 7 },
        { nombre: "Yerba 1kg", sucursal: "Centro", stock: 2, minimo: 5, total: 7 },
      ] as any)
      .mockResolvedValueOnce([
        { nombre: "Juan Pérez", saldo: 15000, limite: 10000, total: 1 },
      ] as any);
    vi.mocked(prisma.caja.findMany).mockResolvedValue([
      // esperado 1000 + 5000 − 0 = 6000; contado 5800 → faltan 200
      { MontoInicial: 1000, MontoCierre: 5800, TotalEntradaEfectivo: 5000, TotalSalidaEfectivo: 0, Sucursal: { Nombre: "Centro" } },
      // sin diferencia: no aparece
      { MontoInicial: 0, MontoCierre: 300, TotalEntradaEfectivo: 300, TotalSalidaEfectivo: 0, Sucursal: { Nombre: "Norte" } },
    ] as any);

    await procesarResumenDiario(AHORA);

    const notif = vi.mocked(prisma.notificacion.create).mock.calls[0][0].data as any;
    expect(notif.Mensaje).toBe(
      "4 ventas por $1.000,00. 7 productos con stock bajo. 1 cliente superó su límite de crédito. 1 caja cerró con diferencia.",
    );
    const html = vi.mocked(sendEmail).mock.calls[0][0].html;
    expect(html).toContain("Stock bajo (7)");
    expect(html).toContain("Coca 2L · Centro");
    expect(html).toContain("y 5 más");
    expect(html).toContain("Clientes sobre su límite de crédito (1)");
    expect(html).toContain("$15.000,00 / límite $10.000,00");
    expect(html).toContain("Cajas cerradas con diferencia (1)");
    expect(html).toContain("Faltan $200,00");
    expect(html).not.toContain("Norte");
  });

  it("sin ventas crea la notificación pero no manda email", async () => {
    vi.mocked(prisma.comprobante.aggregate).mockResolvedValue({
      _sum: { Total: null },
      _count: { Id: 0 },
    } as any);
    const res = await procesarResumenDiario(AHORA);
    expect(prisma.notificacion.create).toHaveBeenCalledTimes(1);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(res.emailsEnviados).toBe(0);
  });

  it("no repite si ya se generó el resumen de ese día", async () => {
    vi.mocked(prisma.notificacion.findFirst).mockResolvedValue({ Id: 1n } as any);
    const res = await procesarResumenDiario(AHORA);
    expect(res.procesados).toBe(0);
    expect(prisma.notificacion.create).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("solo procesa comercios activos con el resumen activado", async () => {
    await procesarResumenDiario(AHORA);
    expect(prisma.configuracion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          NotificacionesResumenDiario: true,
          EstaEliminado: false,
          Tenant: { EstaActivo: true, EstaEliminado: false },
        },
      }),
    );
  });

  it("un error en un comercio no frena a los demás", async () => {
    vi.mocked(prisma.configuracion.findMany).mockResolvedValue([
      { TenantId: 5n, Tenant: { Nombre: "A" } },
      { TenantId: 6n, Tenant: { Nombre: "B" } },
    ] as any);
    vi.mocked(prisma.comprobante.aggregate)
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce({ _sum: { Total: 10 }, _count: { Id: 1 } } as any);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await procesarResumenDiario(AHORA);
    expect(res).toMatchObject({ procesados: 1, errores: 1 });
    errorSpy.mockRestore();
  });
});
