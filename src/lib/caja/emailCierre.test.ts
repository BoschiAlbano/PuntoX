import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/DB/prisma";
import { sendEmail } from "@/lib/email/send";
import { destinatariosAdministradores } from "@/lib/email/destinatarios";
import {
  type CajaParaEmail,
  calcularArqueo,
  emailCierreCaja,
  enviarEmailCierreCaja,
} from "./emailCierre";

vi.mock("@/DB/prisma", () => ({
  default: {
    configuracion: { findFirst: vi.fn() },
    caja: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/email/destinatarios", () => ({
  destinatariosAdministradores: vi.fn(),
}));

const usuario = (nombre: string, apellido: string) => ({
  Nombre: nombre.toLowerCase(),
  Persona_Empleado: { Persona: { Nombre: nombre, Apellido: apellido } },
});

const caja = (over: Partial<CajaParaEmail> = {}): CajaParaEmail => ({
  MontoInicial: 1000,
  MontoCierre: 5900,
  FechaApertura: new Date("2026-11-26T11:00:00Z"), // 08:00 ART
  FechaCierre: new Date("2026-11-26T23:30:00Z"), // 20:30 ART
  TotalEntradaEfectivo: 5500,
  TotalSalidaEfectivo: 500,
  TotalEntradaTarjeta: 3000,
  TotalEntradaTransf: 2000,
  TotalEntradaCheque: 0,
  TotalEntradaCtaCte: 0,
  TotalSalidaTarjeta: 0,
  TotalSalidaTransf: 0,
  TotalSalidaCheque: 0,
  TotalSalidaCtaCte: 0,
  Ganancia: 4200,
  Sucursal: { Nombre: "Centro" },
  Tenant: { Nombre: "Kiosco <Ana>" },
  Usuario_Caja_UsuarioAperturaIdToUsuario: usuario("Juan", "Pérez"),
  Usuario_Caja_UsuarioCierreIdToUsuario: usuario("Ana", "López"),
  ...over,
});

describe("calcularArqueo", () => {
  it("usa la fórmula de Caja Actual: inicial + entradas − salidas en efectivo", () => {
    const a = calcularArqueo(caja());
    expect(a.esperado).toBe(6000); // 1000 + 5500 − 500
    expect(a.contado).toBe(5900);
    expect(a.diferencia).toBe(-100);
    expect(a.totalEntradas).toBe(10500);
    expect(a.salidas).toBe(500);
  });
});

describe("emailCierreCaja", () => {
  it("destaca la diferencia en el asunto y en el cuerpo", () => {
    const { asunto, html, text } = emailCierreCaja(caja());
    expect(asunto).toBe("Caja cerrada con diferencia · Centro · Faltan $100,00");
    expect(html).toContain("Faltan $100,00");
    expect(html).toContain("#ba1a1a"); // tono de alerta
    expect(html).toContain("Kiosco &lt;Ana&gt;"); // escapado
    expect(html).toContain("Juan Pérez");
    expect(html).toContain("Ana López");
    expect(text).toContain("Efectivo esperado: $6.000,00");
    expect(html).not.toContain("Cheque"); // medios sin movimiento se omiten
  });

  it("sin diferencia, el asunto muestra el total de entradas", () => {
    const { asunto, html } = emailCierreCaja(caja({ MontoCierre: 6000 }));
    expect(asunto).toBe("Caja cerrada · Centro · $10.500,00");
    expect(html).toContain("Sin diferencia");
  });
});

describe("enviarEmailCierreCaja", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({
      NotificacionesCierreCaja: true,
    } as any);
    vi.mocked(prisma.caja.findFirst).mockResolvedValue(caja() as any);
    vi.mocked(destinatariosAdministradores).mockResolvedValue({
      adminIds: [10n],
      emails: ["duenio@kiosco.com"],
    });
    vi.mocked(sendEmail).mockResolvedValue({ ok: true, id: "em_1" });
  });

  it("envía a los administradores cuando está activado", async () => {
    expect(await enviarEmailCierreCaja(3n, 5n)).toBe("enviado");
    expect(prisma.caja.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { Id: 3n, TenantId: 5n } }),
    );
    expect(vi.mocked(sendEmail).mock.calls[0][0].to).toEqual(["duenio@kiosco.com"]);
  });

  it("no hace nada si la opción está desactivada", async () => {
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({
      NotificacionesCierreCaja: false,
    } as any);
    expect(await enviarEmailCierreCaja(3n, 5n)).toBe("desactivado");
    expect(prisma.caja.findFirst).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("nunca lanza: si algo falla devuelve 'error'", async () => {
    vi.mocked(prisma.caja.findFirst).mockRejectedValue(new Error("db caída"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(enviarEmailCierreCaja(3n, 5n)).resolves.toBe("error");
    errorSpy.mockRestore();
  });
});
