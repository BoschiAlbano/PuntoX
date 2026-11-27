/**
 * Tests unitarios para lib/planes/features
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/DB/prisma";
import { notificarAdministradores } from "@/lib/notificaciones/notificar";
import { notificarSiAlcanzoLimite, parsePlanFeatures } from "./features";

vi.mock("@/DB/prisma", () => ({
  default: {
    tenant: { findUnique: vi.fn() },
    sucursal: { count: vi.fn() },
    usuario: { count: vi.fn() },
    articulo: { count: vi.fn() },
    notificacion: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/notificaciones/notificar", () => ({
  notificarAdministradores: vi.fn(),
}));

describe("parsePlanFeatures", () => {
  it("parsea un JSON completo y válido", () => {
    expect(
      parsePlanFeatures(
        '{"maxSucursales":1,"maxUsuarios":3,"maxArticulos":100,"incluyeAFIP":false}',
      ),
    ).toEqual({
      maxSucursales: 1,
      maxUsuarios: 3,
      maxArticulos: 100,
      incluyeAFIP: false,
    });
  });

  it("interpreta claves ausentes como sin límite / AFIP incluido (legacy {unlimited:true})", () => {
    expect(parsePlanFeatures('{"unlimited":true}')).toEqual({
      maxSucursales: null,
      maxUsuarios: null,
      maxArticulos: null,
      incluyeAFIP: true,
    });
  });

  it("retorna defaults permisivos ante null", () => {
    expect(parsePlanFeatures(null)).toEqual({
      maxSucursales: null,
      maxUsuarios: null,
      maxArticulos: null,
      incluyeAFIP: true,
    });
  });

  it("retorna defaults permisivos ante string vacío", () => {
    expect(parsePlanFeatures("")).toEqual({
      maxSucursales: null,
      maxUsuarios: null,
      maxArticulos: null,
      incluyeAFIP: true,
    });
  });

  it("retorna defaults permisivos ante JSON inválido (nunca rompe/bloquea)", () => {
    expect(parsePlanFeatures("{esto no es json")).toEqual({
      maxSucursales: null,
      maxUsuarios: null,
      maxArticulos: null,
      incluyeAFIP: true,
    });
  });

  it("retorna defaults permisivos ante un JSON que no es un objeto", () => {
    expect(parsePlanFeatures("42")).toEqual({
      maxSucursales: null,
      maxUsuarios: null,
      maxArticulos: null,
      incluyeAFIP: true,
    });
    expect(parsePlanFeatures("null")).toEqual({
      maxSucursales: null,
      maxUsuarios: null,
      maxArticulos: null,
      incluyeAFIP: true,
    });
  });

  it("ignora valores numéricos inválidos (negativos, strings, NaN) y cae a null", () => {
    expect(
      parsePlanFeatures(
        '{"maxSucursales":-1,"maxUsuarios":"3","maxArticulos":null}',
      ),
    ).toEqual({
      maxSucursales: null,
      maxUsuarios: null,
      maxArticulos: null,
      incluyeAFIP: true,
    });
  });

  it("acepta maxSucursales/maxUsuarios/maxArticulos en 0 (plan sin cupo)", () => {
    expect(
      parsePlanFeatures('{"maxSucursales":0,"maxUsuarios":0,"maxArticulos":0}'),
    ).toEqual({
      maxSucursales: 0,
      maxUsuarios: 0,
      maxArticulos: 0,
      incluyeAFIP: true,
    });
  });

  it("ignora incluyeAFIP con valor no booleano y cae al default (true)", () => {
    expect(parsePlanFeatures('{"incluyeAFIP":"si"}').incluyeAFIP).toBe(true);
  });
});

describe("notificarSiAlcanzoLimite", () => {
  const plan = (json: string) =>
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ Plan: { Caracteristicas: json } } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    plan('{"maxSucursales":1,"maxUsuarios":3,"maxArticulos":100}');
    vi.mocked(prisma.notificacion.findFirst).mockResolvedValue(null);
  });

  it("avisa a los administradores al llegar justo al máximo", async () => {
    vi.mocked(prisma.usuario.count).mockResolvedValue(3);
    expect(await notificarSiAlcanzoLimite(1, "usuarios")).toBe(true);
    expect(notificarAdministradores).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({
        titulo: "Llegaste al límite de tu plan",
        mensaje: "Tu plan permite hasta 3 usuarios y ya los usaste todos. Para agregar más, cambiá a un plan superior.",
        entidadTipo: "PLAN_LIMITE",
        entidadId: "usuarios:3",
      }),
    );
  });

  it("no avisa si todavía queda lugar", async () => {
    vi.mocked(prisma.sucursal.count).mockResolvedValue(0);
    expect(await notificarSiAlcanzoLimite(1, "sucursales")).toBe(false);
    expect(notificarAdministradores).not.toHaveBeenCalled();
  });

  it("no repite si ya hay un aviso igual sin leer", async () => {
    vi.mocked(prisma.articulo.count).mockResolvedValue(100);
    vi.mocked(prisma.notificacion.findFirst).mockResolvedValue({ Id: 1n } as any);
    expect(await notificarSiAlcanzoLimite(1, "articulos")).toBe(false);
    expect(notificarAdministradores).not.toHaveBeenCalled();
  });

  it("no hace nada en planes sin límite", async () => {
    plan('{"unlimited":true}');
    expect(await notificarSiAlcanzoLimite(1, "usuarios")).toBe(false);
    expect(prisma.usuario.count).not.toHaveBeenCalled();
  });
});
