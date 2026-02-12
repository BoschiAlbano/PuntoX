/**
 * Tests para empleadoAdapter y empleadoListAdapter.
 */
import { describe, it, expect } from "vitest";
import { empleadoAdapter, empleadoListAdapter } from "./empleado.adapter";

describe("empleadoAdapter", () => {
  it("adapta un objeto de API al formato Empleado (camelCase)", () => {
    const apiData = {
      id: 1,
      personaId: 10,
      usuarioId: 5,
      nombre: "Juan",
      apellido: "Pérez",
      email: "juan@test.com",
      username: "jperez",
      telefono: "123456",
      direccion: "Calle 123",
      rolId: 2,
      rolNombre: "Vendedor",
      estado: "Activo",
      legajo: "L001",
      dni: "12345678",
    };
    const result = empleadoAdapter(apiData);
    expect(result.id).toBe(1);
    expect(result.personaId).toBe(10);
    expect(result.nombre).toBe("Juan");
    expect(result.apellido).toBe("Pérez");
    expect(result.email).toBe("juan@test.com");
    expect(result.username).toBe("jperez");
    expect(result.estado).toBe("Activo");
  });

  it("acepta formato PascalCase de la API", () => {
    const apiData = {
      Id: 1,
      PersonaId: 10,
      Nombre: "María",
      Apellido: "González",
      Mail: "maria@test.com",
      NombreUsuario: "mgonzalez",
    };
    const result = empleadoAdapter(apiData);
    expect(result.id).toBe(1);
    expect(result.nombre).toBe("María");
    expect(result.apellido).toBe("González");
    expect(result.email).toBe("maria@test.com");
  });

  it("maneja valores nulos con defaults", () => {
    const result = empleadoAdapter({ Id: 1 });
    expect(result.id).toBe(1);
    expect(result.nombre).toBe("");
    expect(result.estado).toBe("Activo");
    expect(result.usuarioId).toBeNull();
  });
});

describe("empleadoListAdapter", () => {
  it("adapta un array de empleados", () => {
    const apiData = [
      { Id: 1, Nombre: "A" },
      { Id: 2, Nombre: "B" },
    ];
    const result = empleadoListAdapter(apiData);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it("retorna array vacío cuando no es array", () => {
    expect(empleadoListAdapter(null as any)).toEqual([]);
    expect(empleadoListAdapter(undefined as any)).toEqual([]);
  });
});
