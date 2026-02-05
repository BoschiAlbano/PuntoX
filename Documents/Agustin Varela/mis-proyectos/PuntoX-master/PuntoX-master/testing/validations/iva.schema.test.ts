/**
 * Tests para validaciones de IVA
 */

import { describe, it, expect } from "vitest";
import {
  createIvaSchema,
  updateIvaSchema,
} from "@/lib/validations/iva.schema";

describe("createIvaSchema", () => {
  it("debe validar un IVA correcto", () => {
    const iva = {
      Descripcion: "IVA 21%",
      Porcentaje: 21,
    };
    const result = createIvaSchema.safeParse(iva);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.Descripcion).toBe("IVA 21%");
      expect(result.data.Porcentaje).toBe(21);
    }
  });

  it("debe rechazar cuando falta Descripcion", () => {
    const iva = {
      Porcentaje: 21,
    };
    const result = createIvaSchema.safeParse(iva);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Descripcion");
    }
  });

  it("debe rechazar cuando falta Porcentaje", () => {
    const iva = {
      Descripcion: "IVA 21%",
    };
    const result = createIvaSchema.safeParse(iva);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Porcentaje");
    }
  });

  it("debe rechazar cuando Porcentaje es negativo", () => {
    const iva = {
      Descripcion: "IVA",
      Porcentaje: -5,
    };
    const result = createIvaSchema.safeParse(iva);

    expect(result.success).toBe(false);
    if (!result.success) {
      const porcError = result.error.issues.find(
        (issue) => issue.path[0] === "Porcentaje"
      );
      expect(porcError).toBeDefined();
    }
  });

  it("debe aceptar Porcentaje igual a 0", () => {
    const iva = {
      Descripcion: "Exento",
      Porcentaje: 0,
    };
    const result = createIvaSchema.safeParse(iva);

    expect(result.success).toBe(true);
  });

  it("debe aceptar Porcentaje igual a 100", () => {
    const iva = {
      Descripcion: "IVA Máximo",
      Porcentaje: 100,
    };
    const result = createIvaSchema.safeParse(iva);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando Porcentaje es mayor a 100", () => {
    const iva = {
      Descripcion: "IVA",
      Porcentaje: 101,
    };
    const result = createIvaSchema.safeParse(iva);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando Descripcion excede 250 caracteres", () => {
    const iva = {
      Descripcion: "a".repeat(251),
      Porcentaje: 21,
    };
    const result = createIvaSchema.safeParse(iva);

    expect(result.success).toBe(false);
  });

  it("debe aplicar trim a la Descripcion", () => {
    const iva = {
      Descripcion: "  IVA 21%  ",
      Porcentaje: 21,
    };
    const result = createIvaSchema.parse(iva);

    expect(result.Descripcion).toBe("IVA 21%");
  });

  it("debe aplicar valor por defecto a EstaEliminado", () => {
    const iva = {
      Descripcion: "IVA 21%",
      Porcentaje: 21,
    };
    const result = createIvaSchema.parse(iva);

    expect(result.EstaEliminado).toBe(false);
  });

  it("debe aceptar porcentajes decimales", () => {
    const iva = {
      Descripcion: "IVA 10.5%",
      Porcentaje: 10.5,
    };
    const result = createIvaSchema.safeParse(iva);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.Porcentaje).toBe(10.5);
    }
  });
});

describe("updateIvaSchema", () => {
  it("debe validar una actualización correcta con Id", () => {
    const iva = {
      Id: 1,
      Descripcion: "IVA Actualizado",
      Porcentaje: 25,
    };
    const result = updateIvaSchema.safeParse(iva);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando falta Id", () => {
    const iva = {
      Descripcion: "IVA Actualizado",
      Porcentaje: 25,
    };
    const result = updateIvaSchema.safeParse(iva);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Id");
    }
  });

  it("debe permitir actualizar solo algunos campos", () => {
    const iva = {
      Id: 1,
      Porcentaje: 25,
    };
    const result = updateIvaSchema.safeParse(iva);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando Porcentaje es negativo en update", () => {
    const iva = {
      Id: 1,
      Porcentaje: -5,
    };
    const result = updateIvaSchema.safeParse(iva);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando Porcentaje es mayor a 100 en update", () => {
    const iva = {
      Id: 1,
      Porcentaje: 101,
    };
    const result = updateIvaSchema.safeParse(iva);

    expect(result.success).toBe(false);
  });
});
