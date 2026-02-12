/**
 * Tests en el límite — IVA. El schema ya tiene Porcentaje 0–100.
 */
import { describe, it, expect } from "vitest";
import { createIvaSchema } from "@/lib/validations/iva.schema";

describe("IVA - createIvaSchema", () => {
  it("acepta body válido", () => {
    const r = createIvaSchema.safeParse({
      Descripcion: "IVA 21%",
      Porcentaje: 21,
    });
    expect(r.success).toBe(true);
  });

  it("debe rechazar Porcentaje negativo", () => {
    const r = createIvaSchema.safeParse({
      Descripcion: "Test",
      Porcentaje: -1,
    });
    expect(r.success).toBe(false);
  });

  it("debe rechazar Porcentaje mayor a 100", () => {
    const r = createIvaSchema.safeParse({
      Descripcion: "Test",
      Porcentaje: 101,
    });
    expect(r.success).toBe(false);
  });
});
