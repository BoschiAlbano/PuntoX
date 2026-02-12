/**
 * Tests en el límite — Roles (nombre sin máximo de longitud).
 */
import { describe, it, expect } from "vitest";
import { rolSchema } from "@/app/api/roles/route";

describe("Roles - rolSchema", () => {
  it("acepta body válido", () => {
    const r = rolSchema.safeParse({
      nombre: "Vendedor",
      tipo: "EMPLEADO",
    });
    expect(r.success).toBe(true);
  });

  it("debe rechazar nombre vacío", () => {
    const r = rolSchema.safeParse({ nombre: "", tipo: "EMPLEADO" });
    expect(r.success).toBe(false);
  });

  it("debe rechazar nombre de longitud excesiva", () => {
    const r = rolSchema.safeParse({
      nombre: "a".repeat(50001),
      tipo: "EMPLEADO",
    });
    expect(r.success).toBe(false);
  });
});
