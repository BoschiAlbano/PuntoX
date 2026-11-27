import { describe, it, expect, afterEach, vi } from "vitest";
import {
  baseRenovacion,
  describirVencimiento,
  diasHastaVencimiento,
  estadoSuscripcion,
  etapaAviso,
  suscripcionBloqueada,
  urlRenovacionWhatsapp,
} from "./vencimiento";

describe("diasHastaVencimiento (hora de Argentina)", () => {
  // 26/11/2026 10:00 ART = 13:00 UTC
  const ahora = new Date("2026-11-26T13:00:00Z");

  it("cuenta días calendario", () => {
    expect(diasHastaVencimiento(new Date("2026-12-03T13:00:00Z"), ahora)).toBe(7);
    expect(diasHastaVencimiento(new Date("2026-11-27T02:00:00Z"), ahora)).toBe(0); // 26/11 23:00 ART
    expect(diasHastaVencimiento(new Date("2026-11-27T03:30:00Z"), ahora)).toBe(1); // 27/11 00:30 ART
    expect(diasHastaVencimiento(new Date("2026-11-20T13:00:00Z"), ahora)).toBe(-6);
  });

  it("a las 22:00 ART (01:00 UTC del día siguiente) sigue siendo el mismo día", () => {
    const noche = new Date("2026-11-27T01:00:00Z"); // 26/11 22:00 ART
    expect(diasHastaVencimiento(new Date("2026-11-27T13:00:00Z"), noche)).toBe(1);
  });
});

describe("etapaAviso", () => {
  it.each([
    [8, null],
    [7, "7d"],
    [2, "7d"],
    [1, "1d"],
    [0, "vencido"],
    [-6, "vencido"],
    [-7, "ultimo_dia"],
    [-8, "bloqueado"],
    [-9, null],
  ])("con %i días → %s", (dias, etapa) => {
    expect(etapaAviso(dias)).toBe(etapa);
  });
});

describe("describirVencimiento", () => {
  const ahora = new Date("2026-11-26T13:00:00Z");
  it("describe cada caso", () => {
    expect(describirVencimiento(new Date("2026-11-26T20:00:00Z"), ahora)).toBe("vence hoy");
    expect(describirVencimiento(new Date("2026-11-27T13:00:00Z"), ahora)).toBe("vence mañana");
    expect(describirVencimiento(new Date("2026-11-30T13:00:00Z"), ahora)).toBe(
      "vence en 4 días (el 30/11/2026)",
    );
    expect(describirVencimiento(new Date("2026-11-24T13:00:00Z"), ahora)).toBe(
      "venció el 24/11/2026",
    );
  });
});

describe("urlRenovacionWhatsapp", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("devuelve null si no hay número configurado", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_RENOVACION", "");
    expect(urlRenovacionWhatsapp("Kiosco Ana")).toBeNull();
  });

  it("arma el link con el número limpio y el mensaje precargado", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_RENOVACION", "+54 9 351 123-4567");
    const url = urlRenovacionWhatsapp("Kiosco Ana")!;
    expect(url.startsWith("https://wa.me/5493511234567?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toContain('"Kiosco Ana"');
  });
});

describe("estadoSuscripcion: gracia de 7 días y bloqueo", () => {
  // 26/11/2026 10:00 ART
  const ahora = new Date("2026-11-26T13:00:00Z");
  const venceEl = (fecha: string) => ({ EstaActivo: true, FechaVencimiento: new Date(`${fecha}T13:00:00Z`) });

  it.each([
    ["2027-01-10", "activa"],
    ["2026-12-03", "por_vencer"], // faltan 7 días
    ["2026-11-26", "por_vencer"], // vence hoy: todavía se usa
    ["2026-11-25", "en_gracia"], // venció ayer
    ["2026-11-19", "en_gracia"], // último día de gracia (7 días)
    ["2026-11-18", "vencida"], // día 8: bloqueado
  ])("vence el %s → %s", (fecha, estado) => {
    expect(estadoSuscripcion(venceEl(fecha), ahora)).toBe(estado);
  });

  it("sin fecha de vencimiento (Plan Ilimitado) nunca vence", () => {
    expect(estadoSuscripcion({ EstaActivo: true, FechaVencimiento: null }, ahora)).toBe("activa");
  });

  it("desactivado a mano queda bloqueado aunque esté al día", () => {
    expect(estadoSuscripcion({ EstaActivo: false, FechaVencimiento: new Date("2027-01-10") }, ahora)).toBe(
      "desactivada",
    );
  });

  it("solo 'vencida' y 'desactivada' bloquean", () => {
    expect(["activa", "por_vencer", "en_gracia", "vencida", "desactivada"].map((e) => suscripcionBloqueada(e as never))).toEqual(
      [false, false, false, true, true],
    );
  });
});

describe("baseRenovacion", () => {
  const ahora = new Date("2026-11-26T13:00:00Z");

  it("al día: suma desde el vencimiento", () => {
    const v = new Date("2026-12-03T13:00:00Z");
    expect(baseRenovacion(v, ahora)).toEqual(v);
  });

  it("en gracia: suma desde el vencimiento (pagar tarde no regala días)", () => {
    const v = new Date("2026-11-20T13:00:00Z");
    expect(baseRenovacion(v, ahora)).toEqual(v);
  });

  it("ya bloqueado: suma desde hoy", () => {
    expect(baseRenovacion(new Date("2026-10-01T13:00:00Z"), ahora)).toEqual(ahora);
  });

  it("sin fecha: desde hoy", () => {
    expect(baseRenovacion(null, ahora)).toEqual(ahora);
  });
});
