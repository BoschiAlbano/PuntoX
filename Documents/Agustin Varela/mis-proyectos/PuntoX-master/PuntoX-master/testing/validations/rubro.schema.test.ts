/**
 * Tests para validaciones de rubros
 */

import { describe, it, expect } from "vitest";
import {
  createRubroSchema,
  updateRubroSchema,
} from "@/lib/validations/rubro.schema";

describe("createRubroSchema", () => {
  it("debe validar un rubro correcto", () => {
    const rubro = {
      Descripcion: "Electrónica",
    };
    const result = createRubroSchema.safeParse(rubro);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.Descripcion).toBe("Electrónica");
    }
  });

  it("debe rechazar cuando falta Descripcion", () => {
    const rubro = {};
    const result = createRubroSchema.safeParse(rubro);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Descripcion");
    }
  });

  it("debe rechazar cuando Descripcion está vacía", () => {
    const rubro = {
      Descripcion: "",
    };
    const result = createRubroSchema.safeParse(rubro);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando Descripcion excede 250 caracteres", () => {
    const rubro = {
      Descripcion: "a".repeat(251),
    };
    const result = createRubroSchema.safeParse(rubro);

    expect(result.success).toBe(false);
  });

  it("debe aceptar Descripcion de exactamente 250 caracteres", () => {
    const rubro = {
      Descripcion: "a".repeat(250),
    };
    const result = createRubroSchema.safeParse(rubro);

    expect(result.success).toBe(true);
  });

  it("debe aplicar trim a la Descripcion", () => {
    const rubro = {
      Descripcion: "  Electrónica  ",
    };
    const result = createRubroSchema.parse(rubro);

    expect(result.Descripcion).toBe("Electrónica");
  });

  it("debe aplicar valor por defecto a EstaEliminado", () => {
    const rubro = {
      Descripcion: "Electrónica",
    };
    const result = createRubroSchema.parse(rubro);

    expect(result.EstaEliminado).toBe(false);
  });
});

describe("updateRubroSchema", () => {
  it("debe validar una actualización correcta con Id", () => {
    const rubro = {
      Id: 1,
      Descripcion: "Electrónica Actualizado",
    };
    const result = updateRubroSchema.safeParse(rubro);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando falta Id", () => {
    const rubro = {
      Descripcion: "Electrónica Actualizado",
    };
    const result = updateRubroSchema.safeParse(rubro);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Id");
    }
  });

  it("debe permitir actualizar solo Id", () => {
    const rubro = {
      Id: 1,
    };
    const result = updateRubroSchema.safeParse(rubro);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando Descripcion está vacía en update", () => {
    const rubro = {
      Id: 1,
      Descripcion: "",
    };
    const result = updateRubroSchema.safeParse(rubro);

    expect(result.success).toBe(false);
  });
});
