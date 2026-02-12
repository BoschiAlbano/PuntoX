/**
 * Tests en el límite — Usuario (empleado). nombreUsuario sin max.
 */
import { describe, it, expect } from "vitest";
import { createUsuarioSchema } from "@/lib/validations/usuario.schema";

const usuarioValido = {
  nombre: "Juan",
  apellido: "Pérez",
  direccion: "Calle 1",
  nombreUsuario: "juan.perez",
  password: "password123",
  localidadId: 1,
};

describe("Usuario - createUsuarioSchema", () => {
  it("acepta body válido", () => {
    const r = createUsuarioSchema.safeParse(usuarioValido);
    expect(r.success).toBe(true);
  });

  it("debe rechazar nombreUsuario vacío", () => {
    const r = createUsuarioSchema.safeParse({
      ...usuarioValido,
      nombreUsuario: "",
    });
    expect(r.success).toBe(false);
  });

  it("debe rechazar nombreUsuario de longitud excesiva", () => {
    const r = createUsuarioSchema.safeParse({
      ...usuarioValido,
      nombreUsuario: "a".repeat(501),
    });
    expect(r.success).toBe(false);
  });

  it("debe rechazar password menor a 8 caracteres", () => {
    const r = createUsuarioSchema.safeParse({
      ...usuarioValido,
      password: "short",
    });
    expect(r.success).toBe(false);
  });
});
