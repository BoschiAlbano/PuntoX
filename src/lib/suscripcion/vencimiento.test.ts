import { describe, it, expect, afterEach, vi } from "vitest";
import {
  describirVencimiento,
  diasHastaVencimiento,
  etapaAviso,
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
    [-7, "vencido"],
    [-8, null],
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
