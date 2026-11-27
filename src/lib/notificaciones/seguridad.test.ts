import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/DB/prisma";
import {
  describirDispositivo,
  notificarCambio2FA,
  notificarCuentaBloqueada,
  notificarNuevoDispositivo,
  notificarPasswordCambiadaPorAdmin,
} from "./seguridad";
import { notificarUsuarios } from "./notificar";

vi.mock("@/DB/prisma", () => ({
  default: {
    configuracion: { findFirst: vi.fn() },
    usuario: { findMany: vi.fn() },
    notificacion: { createMany: vi.fn() },
  },
}));

const datosCreados = () =>
  vi.mocked(prisma.notificacion.createMany).mock.calls.map((c) => (c[0] as any).data).flat();

describe("describirDispositivo", () => {
  it("reconoce navegador y sistema", () => {
    expect(describirDispositivo("Mozilla/5.0 (Windows NT 10.0) AppleWebKit Chrome/130 Safari/537")).toBe("Chrome en Windows");
    expect(describirDispositivo("Mozilla/5.0 (iPhone; CPU iPhone OS 17) AppleWebKit Version/17 Safari/604")).toBe("Safari en iPhone/iPad");
    expect(describirDispositivo("Mozilla/5.0 (Windows NT 10.0) Chrome/130 Edg/130")).toBe("Edge en Windows");
    expect(describirDispositivo(null, "Kiosco PC")).toBe("Kiosco PC");
  });
});

describe("notificarNuevoDispositivo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no notifica si el comercio no tiene activado el aviso", async () => {
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({ AlertarNuevoDispositivo: false } as any);
    const enviado = await notificarNuevoDispositivo({
      tenantId: 1n, usuarioId: 7n, userAgent: "Chrome/130 (Windows)", ipAddress: "1.2.3.4",
    });
    expect(enviado).toBe(false);
    expect(prisma.notificacion.createMany).not.toHaveBeenCalled();
  });

  it("notifica solo al usuario, con dispositivo, IP y hora", async () => {
    vi.mocked(prisma.configuracion.findFirst).mockResolvedValue({ AlertarNuevoDispositivo: true } as any);
    await notificarNuevoDispositivo({
      tenantId: 1n,
      usuarioId: 7n,
      userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/130",
      ipAddress: "200.1.2.3",
      ahora: new Date("2026-11-26T23:30:00Z"), // 20:30 ART
    });
    const [n] = datosCreados();
    expect(n).toMatchObject({ TenantId: 1n, UsuarioId: 7n, Tipo: "WARNING", EntidadTipo: "SEGURIDAD" });
    expect(n.Mensaje).toBe(
      "Se inició sesión en tu cuenta desde Chrome en Windows (IP 200.1.2.3) el 26/11, 20:30. Si no fuiste vos, cambiá tu contraseña y avisale a un administrador.",
    );
  });
});

describe("avisos a administradores y usuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.usuario.findMany).mockResolvedValue([{ Id: 1n }, { Id: 2n }] as any);
  });

  it("cuenta bloqueada: avisa a todos los administradores", async () => {
    await notificarCuentaBloqueada({ tenantId: 5n, username: "juan", intentos: 5 });
    const notifs = datosCreados();
    expect(notifs.map((n) => n.UsuarioId)).toEqual([1n, 2n]);
    expect(notifs[0].Mensaje).toContain('"juan" se bloqueó tras 5 intentos');
    expect(notifs[0].Tipo).toBe("ERROR");
  });

  it("contraseña cambiada: avisa solo al afectado", async () => {
    await notificarPasswordCambiadaPorAdmin({
      tenantId: 5n, usuarioAfectadoId: 9n, cambiadaPor: 'El administrador "ana"',
    });
    const notifs = datosCreados();
    expect(notifs).toHaveLength(1);
    expect(notifs[0].UsuarioId).toBe(9n);
    expect(notifs[0].Mensaje).toContain('El administrador "ana" cambió la contraseña');
  });

  it("2FA activado: solo al usuario", async () => {
    await notificarCambio2FA({ tenantId: 5n, usuarioId: 9n, username: "juan", activado: true });
    expect(datosCreados().map((n) => n.UsuarioId)).toEqual([9n]);
  });

  it("2FA desactivado: al usuario y a los admins (sin repetirle al usuario si es admin)", async () => {
    vi.mocked(prisma.usuario.findMany).mockResolvedValue([{ Id: 1n }, { Id: 9n }] as any);
    await notificarCambio2FA({ tenantId: 5n, usuarioId: 9n, username: "juan", activado: false });
    const notifs = datosCreados();
    expect(notifs.map((n) => n.UsuarioId)).toEqual([9n, 1n]);
    expect(notifs[1].Mensaje).toBe('"juan" desactivó la verificación en dos pasos de su cuenta.');
  });
});

describe("notificarUsuarios", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deduplica destinatarios y nunca lanza", async () => {
    await notificarUsuarios(1n, [3n, 3n, 4n], { tipo: "INFO", titulo: "t", mensaje: "m" });
    expect(datosCreados().map((n) => n.UsuarioId)).toEqual([3n, 4n]);

    vi.mocked(prisma.notificacion.createMany).mockRejectedValueOnce(new Error("db"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      notificarUsuarios(1n, [3n], { tipo: "INFO", titulo: "t", mensaje: "m" }),
    ).resolves.toBeUndefined();
    errorSpy.mockRestore();
  });
});
