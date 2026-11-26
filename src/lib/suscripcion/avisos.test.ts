import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { sendEmail } from "@/lib/email/send";
import { ENTIDAD_TIPO_AVISO, procesarAvisosVencimiento } from "./avisos";

vi.mock("@/DB/prisma", () => ({
  default: {
    tenant: { findMany: vi.fn() },
    notificacion: { findFirst: vi.fn(), createMany: vi.fn() },
    usuario: { findMany: vi.fn() },
    configuracion: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: vi.fn(),
}));
vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn() }));

const getUserById = vi.fn();
const AHORA = new Date("2026-11-26T13:00:00Z"); // 26/11 10:00 ART

const tenant = (vence: string) => ({
  Id: 5n,
  Nombre: "Kiosco <Ana>",
  FechaVencimiento: new Date(vence),
  Plan: { Nombre: "Plan Básico" },
});

describe("procesarAvisosVencimiento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_RENOVACION", "5493511234567");
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: { admin: { getUserById } },
    } as any);
    vi.mocked(prisma.notificacion.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.usuario.findMany).mockResolvedValue([
      { Id: 10n, AuthUserId: "a1" },
      { Id: 11n, AuthUserId: "a2" },
    ] as any);
    getUserById.mockImplementation(async (id: string) => ({
      data: { user: { email: id === "a1" ? "Duenio@Kiosco.com" : "ana2026@puntox.com" } },
    }));
    vi.mocked(sendEmail).mockResolvedValue({ ok: true, id: "em_1" });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("avisa 7 días antes: email a admins con email real y notificación a cada admin", async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([tenant("2026-12-03T13:00:00Z")] as any);

    const resumen = await procesarAvisosVencimiento(AHORA);

    expect(resumen.avisos).toEqual([
      { tenantId: "5", etapa: "7d", destinatarios: 1, email: "enviado" },
    ]);
    const envio = vi.mocked(sendEmail).mock.calls[0][0];
    expect(envio.to).toEqual(["duenio@kiosco.com"]); // excluye el @puntox.com interno
    expect(envio.subject).toBe("Tu suscripción a PuntoX vence el 3/12/2026");
    expect(envio.html).toContain("Kiosco &lt;Ana&gt;"); // nombre escapado
    expect(envio.html).toContain("https://wa.me/5493511234567");

    const notifs = vi.mocked(prisma.notificacion.createMany).mock.calls[0][0].data as any[];
    expect(notifs.map((n) => n.UsuarioId)).toEqual([10n, 11n]);
    expect(notifs[0]).toMatchObject({
      TenantId: 5n,
      Tipo: "WARNING",
      EntidadTipo: ENTIDAD_TIPO_AVISO,
      EntidadId: "5:2026-12-03:7d",
    });
  });

  it("no repite un aviso ya enviado para esa etapa y fecha", async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([tenant("2026-12-03T13:00:00Z")] as any);
    vi.mocked(prisma.notificacion.findFirst).mockResolvedValue({ Id: 1n } as any);

    const resumen = await procesarAvisosVencimiento(AHORA);

    expect(resumen.avisos).toEqual([]);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.notificacion.createMany).not.toHaveBeenCalled();
  });

  it("no avisa si faltan más de 7 días", async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([tenant("2026-12-04T13:00:00Z")] as any);
    const resumen = await procesarAvisosVencimiento(AHORA);
    expect(resumen.avisos).toEqual([]);
  });

  it("avisa el vencimiento como ERROR", async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([tenant("2026-11-26T15:00:00Z")] as any);
    const resumen = await procesarAvisosVencimiento(AHORA);
    expect(resumen.avisos[0].etapa).toBe("vencido");
    expect(vi.mocked(sendEmail).mock.calls[0][0].subject).toBe(
      "Tu suscripción a PuntoX venció",
    );
    const notifs = vi.mocked(prisma.notificacion.createMany).mock.calls[0][0].data as any[];
    expect(notifs[0].Tipo).toBe("ERROR");
  });

  it("sin admins con email real usa el email del comercio", async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([tenant("2026-11-27T13:00:00Z")] as any);
    getUserById.mockResolvedValue({ data: { user: { email: "x2026@puntox.com" } } });
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({ Email: "Ventas@Kiosco.com" } as any);

    await procesarAvisosVencimiento(AHORA);

    expect(vi.mocked(sendEmail).mock.calls[0][0].to).toEqual(["ventas@kiosco.com"]);
    expect(vi.mocked(sendEmail).mock.calls[0][0].subject).toBe(
      "Tu suscripción a PuntoX vence mañana",
    );
  });

  it("si falla el email igual deja la notificación in-app", async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([tenant("2026-12-03T13:00:00Z")] as any);
    vi.mocked(sendEmail).mockResolvedValue({ ok: false, error: "Resend 500" });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const resumen = await procesarAvisosVencimiento(AHORA);

    expect(resumen.avisos[0].email).toBe("error");
    expect(prisma.notificacion.createMany).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("sin número de WhatsApp el email no tiene botón", async () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_RENOVACION", "");
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([tenant("2026-12-03T13:00:00Z")] as any);
    await procesarAvisosVencimiento(AHORA);
    const html = vi.mocked(sendEmail).mock.calls[0][0].html;
    expect(html).not.toContain("wa.me");
    expect(html).toContain("Contactá a PuntoX");
  });
});
