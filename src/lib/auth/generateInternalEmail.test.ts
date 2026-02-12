/**
 * Tests para generateInternalEmail.
 */
import { describe, it, expect } from "vitest";
import { generateInternalEmail } from "./generateInternalEmail";

describe("generateInternalEmail", () => {
  it("genera email con formato correcto para username simple", () => {
    const result = generateInternalEmail("juan");
    expect(result).toBe("juan2026@puntox.com");
  });

  it("normaliza a minúsculas", () => {
    const result = generateInternalEmail("JUAN");
    expect(result).toBe("juan2026@puntox.com");
  });

  it("elimina espacios", () => {
    const result = generateInternalEmail("juan perez");
    expect(result).toBe("juanperez2026@puntox.com");
  });

  it("permite caracteres . _ -", () => {
    const result = generateInternalEmail("juan.perez_2024");
    expect(result).toBe("juan.perez_20242026@puntox.com");
  });

  it("elimina caracteres no permitidos", () => {
    const result = generateInternalEmail("juan@#$%");
    expect(result).toBe("juan2026@puntox.com");
  });

  it("trim espacios al inicio y final", () => {
    const result = generateInternalEmail("  juan  ");
    expect(result).toBe("juan2026@puntox.com");
  });
});
