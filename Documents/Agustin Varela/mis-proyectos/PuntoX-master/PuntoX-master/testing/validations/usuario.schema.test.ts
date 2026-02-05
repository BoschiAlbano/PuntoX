/**
 * Tests para validaciones de usuarios
 */

import { describe, it, expect } from "vitest";
import {
  createUsuarioSchema,
  updateUsuarioSchema,
} from "@/lib/validations/usuario.schema";

describe("createUsuarioSchema", () => {
  it("debe validar un usuario correcto", () => {
    const usuario = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      mail: "juan@example.com",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "password123",
    };
    const result = createUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe("Juan");
      expect(result.data.localidadId).toBe(1); // Debe transformar a número
    }
  });

  it("debe rechazar cuando falta nombre", () => {
    const usuario = {
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      mail: "juan@example.com",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "password123",
    };
    const result = createUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("nombre");
    }
  });

  it("debe rechazar cuando falta apellido", () => {
    const usuario = {
      nombre: "Juan",
      direccion: "Calle Falsa 123",
      mail: "juan@example.com",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "password123",
    };
    const result = createUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando falta direccion", () => {
    const usuario = {
      nombre: "Juan",
      apellido: "Pérez",
      mail: "juan@example.com",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "password123",
    };
    const result = createUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando falta nombreUsuario", () => {
    const usuario = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      mail: "juan@example.com",
      localidadId: 1,
      password: "password123",
    };
    const result = createUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando password tiene menos de 8 caracteres", () => {
    const usuario = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      mail: "juan@example.com",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "1234567", // 7 caracteres
    };
    const result = createUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(false);
    if (!result.success) {
      const passError = result.error.issues.find(
        (issue) => issue.path[0] === "password"
      );
      expect(passError).toBeDefined();
    }
  });

  it("debe aceptar password de exactamente 8 caracteres", () => {
    const usuario = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      mail: "juan@example.com",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "12345678", // 8 caracteres
    };
    const result = createUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(true);
  });

  it("debe transformar localidadId de string a número", () => {
    const usuario = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      mail: "juan@example.com",
      localidadId: "1",
      nombreUsuario: "jperez",
      password: "password123",
    };
    const result = createUsuarioSchema.parse(usuario);

    expect(result.localidadId).toBe(1);
    expect(typeof result.localidadId).toBe("number");
  });

  it("debe aceptar localidadId como número", () => {
    const usuario = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      mail: "juan@example.com",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "password123",
    };
    const result = createUsuarioSchema.parse(usuario);

    expect(result.localidadId).toBe(1);
  });

  it("debe aceptar mail vacío o email válido", () => {
    const usuario1 = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      mail: "",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "password123",
    };
    const result1 = createUsuarioSchema.safeParse(usuario1);
    expect(result1.success).toBe(true);

    const usuario2 = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      mail: "juan@example.com",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "password123",
    };
    const result2 = createUsuarioSchema.safeParse(usuario2);
    expect(result2.success).toBe(true);
  });

  it("debe rechazar email inválido (si no está vacío)", () => {
    const usuario = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      mail: "email-invalido",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "password123",
    };
    const result = createUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(false);
  });

  it("debe aceptar campos opcionales como null", () => {
    const usuario = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "password123",
      dni: null,
      telefono: null,
      departamentoId: null,
      provinciaId: null,
      rolId: null,
      sucursalId: null,
    };
    const result = createUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(true);
  });

  it("debe transformar campos opcionales de string a número cuando existen", () => {
    const usuario = {
      nombre: "Juan",
      apellido: "Pérez",
      direccion: "Calle Falsa 123",
      localidadId: 1,
      nombreUsuario: "jperez",
      password: "password123",
      departamentoId: "2",
      provinciaId: "3",
      rolId: "4",
      sucursalId: "5",
    };
    const result = createUsuarioSchema.parse(usuario);

    expect(result.departamentoId).toBe(2);
    expect(result.provinciaId).toBe(3);
    expect(result.rolId).toBe(4);
    expect(result.sucursalId).toBe(5);
  });
});

describe("updateUsuarioSchema", () => {
  it("debe validar una actualización correcta con personaId", () => {
    const usuario = {
      personaId: 1,
      nombre: "Juan Actualizado",
    };
    const result = updateUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando falta personaId", () => {
    const usuario = {
      nombre: "Juan Actualizado",
    };
    const result = updateUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("personaId");
    }
  });

  it("debe transformar personaId de string a número", () => {
    const usuario = {
      personaId: "1",
      nombre: "Juan",
    };
    const result = updateUsuarioSchema.parse(usuario);

    expect(result.personaId).toBe(1);
    expect(typeof result.personaId).toBe("number");
  });

  it("debe permitir actualizar solo algunos campos", () => {
    const usuario = {
      personaId: 1,
      nombre: "Juan Actualizado",
    };
    const result = updateUsuarioSchema.safeParse(usuario);

    expect(result.success).toBe(true);
  });
});
