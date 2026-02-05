/**
 * Tests para validaciones de clientes
 */

import { describe, it, expect } from "vitest";
import {
  createClienteSchema,
  updateClienteSchema,
} from "@/lib/validations/cliente.schema";

describe("createClienteSchema", () => {
  it("debe validar un cliente correcto", () => {
    const cliente = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Dni: "12345678",
      Direccion: "Calle Falsa 123",
      Telefono: "1234567890",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
    };
    const result = createClienteSchema.safeParse(cliente);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.Nombre).toBe("Juan");
      expect(result.data.Apellido).toBe("Pérez");
    }
  });

  it("debe rechazar cuando falta Nombre", () => {
    const cliente = {
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
    };
    const result = createClienteSchema.safeParse(cliente);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Nombre");
    }
  });

  it("debe rechazar cuando Nombre está vacío", () => {
    const cliente = {
      Nombre: "",
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
    };
    const result = createClienteSchema.safeParse(cliente);

    expect(result.success).toBe(false);
  });

  it("debe rechazar cuando falta Apellido", () => {
    const cliente = {
      Nombre: "Juan",
      Direccion: "Calle Falsa 123",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
    };
    const result = createClienteSchema.safeParse(cliente);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Apellido");
    }
  });

  it("debe rechazar cuando falta Direccion", () => {
    const cliente = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
    };
    const result = createClienteSchema.safeParse(cliente);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Direccion");
    }
  });

  it("debe rechazar email inválido", () => {
    const cliente = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "email-invalido",
      LocalidadId: 1,
      CondicionIvaId: 1,
    };
    const result = createClienteSchema.safeParse(cliente);

    expect(result.success).toBe(false);
    if (!result.success) {
      const mailError = result.error.issues.find(
        (issue) => issue.path[0] === "Mail"
      );
      expect(mailError).toBeDefined();
    }
  });

  it("debe aceptar email válido", () => {
    const cliente = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "juan.perez@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
    };
    const result = createClienteSchema.safeParse(cliente);

    expect(result.success).toBe(true);
  });

  it("debe aceptar Dni como null o undefined", () => {
    const cliente1 = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
      Dni: null,
    };
    const result1 = createClienteSchema.safeParse(cliente1);
    expect(result1.success).toBe(true);

    const cliente2 = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
    };
    const result2 = createClienteSchema.safeParse(cliente2);
    expect(result2.success).toBe(true);
  });

  it("debe rechazar Dni mayor a 8 caracteres", () => {
    const cliente = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
      Dni: "123456789", // 9 caracteres
    };
    const result = createClienteSchema.safeParse(cliente);

    expect(result.success).toBe(false);
  });

  it("debe aceptar LocalidadId como número o string", () => {
    const cliente1 = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
    };
    const result1 = createClienteSchema.safeParse(cliente1);
    expect(result1.success).toBe(true);

    const cliente2 = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "juan@example.com",
      LocalidadId: "1",
      CondicionIvaId: 1,
    };
    const result2 = createClienteSchema.safeParse(cliente2);
    expect(result2.success).toBe(true);
  });

  it("debe aplicar valores por defecto", () => {
    const cliente = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
    };
    const result = createClienteSchema.parse(cliente);

    expect(result.ActivarCtaCte).toBe(false);
    expect(result.TieneLimiteCompra).toBe(false);
    expect(result.MontoMaximoCtaCte).toBe(0);
  });

  it("debe rechazar MontoMaximoCtaCte negativo", () => {
    const cliente = {
      Nombre: "Juan",
      Apellido: "Pérez",
      Direccion: "Calle Falsa 123",
      Mail: "juan@example.com",
      LocalidadId: 1,
      CondicionIvaId: 1,
      MontoMaximoCtaCte: -100,
    };
    const result = createClienteSchema.safeParse(cliente);

    expect(result.success).toBe(false);
  });
});

describe("updateClienteSchema", () => {
  it("debe validar una actualización correcta con Id", () => {
    const cliente = {
      Id: 1,
      Nombre: "Juan Actualizado",
    };
    const result = updateClienteSchema.safeParse(cliente);

    expect(result.success).toBe(true);
  });

  it("debe rechazar cuando falta Id", () => {
    const cliente = {
      Nombre: "Juan Actualizado",
    };
    const result = updateClienteSchema.safeParse(cliente);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("Id");
    }
  });

  it("debe permitir actualizar solo algunos campos", () => {
    const cliente = {
      Id: 1,
      Mail: "nuevo@example.com",
    };
    const result = updateClienteSchema.safeParse(cliente);

    expect(result.success).toBe(true);
  });

  it("debe aceptar Id como número o string", () => {
    const cliente1 = { Id: 1, Nombre: "Juan" };
    const result1 = updateClienteSchema.safeParse(cliente1);
    expect(result1.success).toBe(true);

    const cliente2 = { Id: "1", Nombre: "Juan" };
    const result2 = updateClienteSchema.safeParse(cliente2);
    expect(result2.success).toBe(true);
  });

  it("debe rechazar email inválido en update", () => {
    const cliente = {
      Id: 1,
      Mail: "email-invalido",
    };
    const result = updateClienteSchema.safeParse(cliente);

    expect(result.success).toBe(false);
  });
});
