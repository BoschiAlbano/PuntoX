/**
 * Tests unitarios para lib/planes/features
 */
import { describe, it, expect } from "vitest";
import { parsePlanFeatures } from "./features";

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
