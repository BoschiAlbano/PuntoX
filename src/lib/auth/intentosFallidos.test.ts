import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/DB/prisma";
import { notificarCuentaBloqueada } from "@/lib/notificaciones/seguridad";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { registrarIntentoFallido, type UsuarioIntentos } from "./intentosFallidos";
import { PerfilTipo } from "../../../prisma/generated/prisma";

vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { update: vi.fn() },
    configuracion: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/notificaciones/seguridad", () => ({ notificarCuentaBloqueada: vi.fn() }));
vi.mock("@/lib/auditoria/registrarAuditoria", () => ({ registrarAuditoria: vi.fn() }));

const usuario = (extra: Partial<UsuarioIntentos> = {}): UsuarioIntentos => ({
  Id: 7n,
  TenantId: 1n,
  EstaBloqueado: false,
  IntentosFallidos: 0,
  FechaUltimoIntento: null,
  Persona_Empleado: null,
  PerfilUsuario: [{ Perfiles: { Tipo: PerfilTipo.EMPLEADO } }],
  ...extra,
});

const umbral = (n: number | null) =>
  vi.mocked(prisma.configuracion.findFirst).mockResolvedValue(
    n === null ? null : ({ BloquearTrasIntentos: n } as any),
  );

describe("registrarIntentoFallido", () => {
  beforeEach(() => vi.clearAllMocks());

  it("suma el intento sin bloquear mientras no llega al umbral", async () => {
    umbral(3);
    const r = await registrarIntentoFallido(usuario({ IntentosFallidos: 1, FechaUltimoIntento: new Date() }), "juan");
    expect(r).toEqual({ bloqueado: false });
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { Id: 7n },
      data: expect.objectContaining({ IntentosFallidos: 2 }),
    });
    expect(notificarCuentaBloqueada).not.toHaveBeenCalled();
  });

  it("bloquea al llegar al umbral, avisa a los administradores y audita", async () => {
    umbral(3);
    const r = await registrarIntentoFallido(usuario({ IntentosFallidos: 2, FechaUltimoIntento: new Date() }), "juan");
    expect(r).toEqual({ bloqueado: true });
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { Id: 7n },
      data: expect.objectContaining({ IntentosFallidos: 3, EstaBloqueado: true }),
    });
    expect(notificarCuentaBloqueada).toHaveBeenCalledWith({ tenantId: 1n, username: "juan", intentos: 3 });
    expect(registrarAuditoria).toHaveBeenCalledWith(expect.objectContaining({ accion: "BLOQUEO_AUTOMATICO" }));
  });

  it("reinicia el contador si pasaron más de 30 minutos", async () => {
    umbral(3);
    const hace31 = new Date(Date.now() - 31 * 60_000);
    const r = await registrarIntentoFallido(usuario({ IntentosFallidos: 2, FechaUltimoIntento: hace31 }), "juan");
    expect(r).toEqual({ bloqueado: false });
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { Id: 7n },
      data: expect.objectContaining({ IntentosFallidos: 1 }),
    });
  });

  it("con umbral 'nunca' solo cuenta", async () => {
    umbral(null);
    const r = await registrarIntentoFallido(usuario({ IntentosFallidos: 50 }), "juan");
    expect(r).toEqual({ bloqueado: false });
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { Id: 7n },
      data: expect.objectContaining({ IntentosFallidos: { increment: 1 } }),
    });
  });

  it("nunca bloquea a un administrador, pero lo deja en la auditoría", async () => {
    umbral(1);
    const r = await registrarIntentoFallido(
      usuario({ IntentosFallidos: 10, PerfilUsuario: [{ Perfiles: { Tipo: PerfilTipo.ADMINISTRADOR } }] }),
      "admin",
    );
    expect(r).toEqual({ bloqueado: false });
    expect(prisma.configuracion.findFirst).not.toHaveBeenCalled();
    expect(registrarAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "INTENTO_FALLIDO_ROL_PRIVILEGIADO" }),
    );
  });

  it("si la cuenta ya está bloqueada no hace nada", async () => {
    const r = await registrarIntentoFallido(usuario({ EstaBloqueado: true }), "juan");
    expect(r).toEqual({ bloqueado: false });
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });
});
