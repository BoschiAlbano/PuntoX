import { describe, expect, it } from "vitest";
import { parseFechaDesde, parseFechaHasta } from "./rangoFechas";

describe("rangoFechas", () => {
  it("parseFechaDesde toma una fecha sola como el comienzo del día en Argentina", () => {
    expect(parseFechaDesde("2026-10-22").toISOString()).toBe("2026-10-22T03:00:00.000Z");
  });

  it("parseFechaHasta toma una fecha sola como el final del día en Argentina", () => {
    expect(parseFechaHasta("2026-10-22").toISOString()).toBe("2026-10-23T02:59:59.999Z");
  });

  it("incluye una venta del último día (18:33 en Argentina)", () => {
    const venta = new Date("2026-10-22T18:33:00-03:00");
    expect(venta.getTime()).toBeLessThanOrEqual(parseFechaHasta("2026-10-22").getTime());
  });

  it("respeta un ISO completo sin modificarlo", () => {
    const iso = "2026-10-22T12:00:00.000Z";
    expect(parseFechaDesde(iso).toISOString()).toBe(iso);
    expect(parseFechaHasta(iso).toISOString()).toBe(iso);
  });
});
