/**
 * Tests en el límite — Catálogos (marca, rubro, unidad de medida).
 */
import { describe, it, expect } from "vitest";
import { createMarcaSchema } from "@/lib/validations/marca.schema";
import { createRubroSchema } from "@/lib/validations/rubro.schema";
import { createUnidadMedidaSchema } from "@/lib/validations/unidad-medida.schema";

describe("Marca - createMarcaSchema", () => {
  it("debe rechazar Descripcion vacía", () => {
    const r = createMarcaSchema.safeParse({ Descripcion: "" });
    expect(r.success).toBe(false);
  });
  it("debe rechazar Descripcion mayor a 250 caracteres", () => {
    const r = createMarcaSchema.safeParse({ Descripcion: "a".repeat(251) });
    expect(r.success).toBe(false);
  });
});

describe("Rubro - createRubroSchema", () => {
  it("debe rechazar Descripcion vacía", () => {
    const r = createRubroSchema.safeParse({ Descripcion: "" });
    expect(r.success).toBe(false);
  });
});

describe("UnidadMedida - createUnidadMedidaSchema", () => {
  it("debe rechazar Descripcion vacía", () => {
    const r = createUnidadMedidaSchema.safeParse({ Descripcion: "" });
    expect(r.success).toBe(false);
  });
});
