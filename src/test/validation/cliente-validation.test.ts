/**
 * Tests de validación en el límite — Clientes.
 * Solo lo justo para detectar aceptación de valores inválidos.
 */
import { describe, it, expect } from "vitest";
import {
  createClienteSchema,
  updateClienteSchema,
} from "@/lib/validations/cliente.schema";

const clienteValido = {
  Nombre: "Juan",
  Apellido: "Pérez",
  Direccion: "Calle 1",
  Mail: "juan@test.com",
  LocalidadId: 1,
  CondicionIvaId: 1,
};

describe("Cliente - createClienteSchema", () => {
  it("acepta body válido", () => {
    const r = createClienteSchema.safeParse(clienteValido);
    expect(r.success).toBe(true);
  });

  it("debe rechazar MontoMaximoCtaCte excesivo", () => {
    const r = createClienteSchema.safeParse({
      ...clienteValido,
      MontoMaximoCtaCte: 1e15,
    });
    expect(r.success).toBe(false);
  });
});

describe("Cliente - updateClienteSchema", () => {
  it("debe rechazar MontoMaximoCtaCte excesivo", () => {
    const r = updateClienteSchema.safeParse({
      Id: 1,
      MontoMaximoCtaCte: 1e15,
    });
    expect(r.success).toBe(false);
  });
});
