/**
 * Tests para validaciones de marcas
 */

import { describe, it, expect } from "vitest";
import {
  createMarcaSchema,
  updateMarcaSchema,
} from "@/lib/validations/marca.schema";

describe("createMarcaSchema", () => {
  it("debe validar una marca correcta", () => {
    const marca = {
      Descripcion: "Nike",
    };
    const result = createMarcaSchema.safeParse(marca);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.Descripcion).toBe("Nike");
    }
  });

  it("debe rechazar cuando falta Descripcion", () => {
    const marca = {};
    const result = createMarcaSchema.safeParse(marca);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Descripcion");
    }
  });

  it("debe rechazar cuando Descripcion está vacía", () => {
    const marca = {
      Descripcion: "",
    };
    const result = createMarcaSchema.safeParse(marca);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando Descripcion excede 250 caracteres", () => {
    const marca = {
      Descripcion: "a".repeat(251),
    };
    const result = createMarcaSchema.safeParse(marca);

    expect(result.success).toBe(false);
    if (!result.success) {
      const descError = result.error.issues.find(
        (issue) => issue.path[0] === "Descripcion"
      );
      expect(descError).toBeDefined();
    }
  });

  it("debe aceptar Descripcion de exactamente 250 caracteres", () => {
    const marca = {
      Descripcion: "a".repeat(250),
    };
    const result = createMarcaSchema.safeParse(marca);

    expect(result.success).toBe(true);
  });

  it("debe aplicar trim a la Descripcion", () => {
    const marca = {
      Descripcion: "  Nike  ",
    };
    const result = createMarcaSchema.parse(marca);

    expect(result.Descripcion).toBe("Nike");
  });

  it("debe aplicar valor por defecto a EstaEliminado", () => {
    const marca = {
      Descripcion: "Nike",
    };
    const result = createMarcaSchema.parse(marca);

    expect(result.EstaEliminado).toBe(false);
  });

  it("debe aceptar EstaEliminado explícito", () => {
    const marca = {
      Descripcion: "Nike",
      EstaEliminado: true,
    };
    const result = createMarcaSchema.parse(marca);

    expect(result.EstaEliminado).toBe(true);
  });
});

describe("updateMarcaSchema", () => {
  it("debe validar una actualización correcta con Id", () => {
    const marca = {
      Id: 1,
      Descripcion: "Nike Actualizado",
    };
    const result = updateMarcaSchema.safeParse(marca);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando falta Id", () => {
    const marca = {
      Descripcion: "Nike Actualizado",
    };
    const result = updateMarcaSchema.safeParse(marca);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Id");
    }
  });

  it("debe permitir actualizar solo Id", () => {
    const marca = {
      Id: 1,
    };
    const result = updateMarcaSchema.safeParse(marca);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando Descripcion está vacía en update", () => {
    const marca = {
      Id: 1,
      Descripcion: "",
    };
    const result = updateMarcaSchema.safeParse(marca);

    expect(result.success).toBe(false);
  });

  it("debe aplicar trim a la Descripcion en update", () => {
    const marca = {
      Id: 1,
      Descripcion: "  Nike Actualizado  ",
    };
    const result = updateMarcaSchema.parse(marca);

    expect(result.Descripcion).toBe("Nike Actualizado");
  });
});
