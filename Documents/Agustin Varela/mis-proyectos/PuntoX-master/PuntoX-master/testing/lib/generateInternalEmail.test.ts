/**
 * Tests para la función generateInternalEmail
 */
import { describe, it, expect } from "vitest";
import { generateInternalEmail } from "@/lib/auth/generateInternalEmail";

describe("generateInternalEmail", () => {
  it("debe generar un email interno con el formato correcto", () => {
    const username = "juan.perez";
    const email = generateInternalEmail(username);

    expect(email).toBe("juan.perez2026@puntox.com");
  });

  it("debe normalizar nombres de usuario con mayúsculas a minúsculas", () => {
    const username = "JUAN.PEREZ";
    const email = generateInternalEmail(username);

    expect(email).toBe("juan.perez2026@puntox.com");
  });

  it("debe manejar nombres de usuario con caracteres especiales permitidos", () => {
    const username = "juan_perez-123";
    const email = generateInternalEmail(username);

    expect(email).toBe("juan_perez-1232026@puntox.com");
  });

  it("debe eliminar espacios de nombres de usuario", () => {
    const username = "juan perez";
    const email = generateInternalEmail(username);

    expect(email).toBe("juanperez2026@puntox.com");
  });

  it("debe manejar nombres de usuario vacíos", () => {
    const username = "";
    const email = generateInternalEmail(username);

    expect(email).toBe("2026@puntox.com");
  });

  it("debe generar emails únicos para diferentes usuarios", () => {
    const email1 = generateInternalEmail("usuario1");
    const email2 = generateInternalEmail("usuario2");

    expect(email1).not.toBe(email2);
    expect(email1).toBe("usuario12026@puntox.com");
    expect(email2).toBe("usuario22026@puntox.com");
  });
});
