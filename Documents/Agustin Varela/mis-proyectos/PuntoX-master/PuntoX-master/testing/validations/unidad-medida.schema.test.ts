/**
 * Tests para validaciones de unidades de medida
 */

import { describe, it, expect } from "vitest";
import {
  createUnidadMedidaSchema,
  updateUnidadMedidaSchema,
} from "@/lib/validations/unidad-medida.schema";

describe("createUnidadMedidaSchema", () => {
  it("debe validar una unidad de medida correcta", () => {
    const unidad = {
      Descripcion: "Kilogramo",
    };
    const result = createUnidadMedidaSchema.safeParse(unidad);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.Descripcion).toBe("Kilogramo");
    }
  });

  it("debe rechazar cuando falta Descripcion", () => {
    const unidad = {};
    const result = createUnidadMedidaSchema.safeParse(unidad);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Descripcion");
    }
  });

  it("debe rechazar cuando Descripcion está vacía", () => {
    const unidad = {
      Descripcion: "",
    };
    const result = createUnidadMedidaSchema.safeParse(unidad);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando Descripcion excede 250 caracteres", () => {
    const unidad = {
      Descripcion: "a".repeat(251),
    };
    const result = createUnidadMedidaSchema.safeParse(unidad);

    expect(result.success).toBe(false);
  });

  it("debe aceptar Descripcion de exactamente 250 caracteres", () => {
    const unidad = {
      Descripcion: "a".repeat(250),
    };
    const result = createUnidadMedidaSchema.safeParse(unidad);

    expect(result.success).toBe(true);
  });

  it("debe aplicar trim a la Descripcion", () => {
    const unidad = {
      Descripcion: "  Kilogramo  ",
    };
    const result = createUnidadMedidaSchema.parse(unidad);

    expect(result.Descripcion).toBe("Kilogramo");
  });

  it("debe aplicar valor por defecto a EstaEliminado", () => {
    const unidad = {
      Descripcion: "Kilogramo",
    };
    const result = createUnidadMedidaSchema.parse(unidad);

    expect(result.EstaEliminado).toBe(false);
  });

  it("debe aceptar diferentes unidades comunes", () => {
    const unidades = [
      { Descripcion: "Kilogramo" },
      { Descripcion: "Gramo" },
      { Descripcion: "Litro" },
      { Descripcion: "Mililitro" },
      { Descripcion: "Unidad" },
      { Descripcion: "Metro" },
    ];

    unidades.forEach((unidad) => {
      const result = createUnidadMedidaSchema.safeParse(unidad);
      expect(result.success).toBe(true);
    });
  });
});

describe("updateUnidadMedidaSchema", () => {
  it("debe validar una actualización correcta con Id", () => {
    const unidad = {
      Id: 1,
      Descripcion: "Kilogramo Actualizado",
    };
    const result = updateUnidadMedidaSchema.safeParse(unidad);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando falta Id", () => {
    const unidad = {
      Descripcion: "Kilogramo Actualizado",
    };
    const result = updateUnidadMedidaSchema.safeParse(unidad);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Id");
    }
  });

  it("debe permitir actualizar solo Id", () => {
    const unidad = {
      Id: 1,
    };
    const result = updateUnidadMedidaSchema.safeParse(unidad);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando Descripcion está vacía en update", () => {
    const unidad = {
      Id: 1,
      Descripcion: "",
    };
    const result = updateUnidadMedidaSchema.safeParse(unidad);

    expect(result.success).toBe(false);
  });

  it("debe aplicar trim a la Descripcion en update", () => {
    const unidad = {
      Id: 1,
      Descripcion: "  Kilogramo Actualizado  ",
    };
    const result = updateUnidadMedidaSchema.parse(unidad);

    expect(result.Descripcion).toBe("Kilogramo Actualizado");
  });
});
