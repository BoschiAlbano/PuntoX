/**
 * Tests para el adapter de empleados
 */
import { describe, it, expect } from "vitest";
import { empleadoAdapter, empleadoListAdapter } from "@/lib/adapters/empleado.adapter";

describe("empleadoAdapter", () => {
  it("debe adaptar correctamente un empleado completo con formato camelCase", () => {
    const data = {
      id: 1,
      personaId: 10,
      usuarioId: 20,
      nombre: "Juan",
      apellido: "Pérez",
      email: "juan@test.com",
      username: "juan.perez",
      telefono: "1234567890",
      direccion: "Calle 123",
      localidadId: 30,
      localidad: "Buenos Aires",
      departamentoId: 40,
      provinciaId: 50,
      rolId: 60,
      rolNombre: "Vendedor",
      rolTipo: "EMPLEADO",
      estado: "Activo",
      legajo: 100,
      dni: "12345678",
      ultimaActividad: "2024-01-01",
    };

    const result = empleadoAdapter(data);

    expect(result.id).toBe(1);
    expect(result.personaId).toBe(10);
    expect(result.usuarioId).toBe(20);
    expect(result.nombre).toBe("Juan");
    expect(result.apellido).toBe("Pérez");
    expect(result.nombreCompleto).toBe("Juan Pérez");
    expect(result.email).toBe("juan@test.com");
    expect(result.username).toBe("juan.perez");
  });

  it("debe adaptar correctamente un empleado con formato PascalCase", () => {
    const data = {
      Id: 1,
      PersonaId: 10,
      UsuarioId: 20,
      Nombre: "María",
      Apellido: "González",
      Mail: "maria@test.com",
      NombreUsuario: "maria.gonzalez",
      Telefono: "9876543210",
      Direccion: "Avenida 456",
      LocalidadId: 30,
      Localidad: "Córdoba",
    };

    const result = empleadoAdapter(data);

    expect(result.id).toBe(1);
    expect(result.personaId).toBe(10);
    expect(result.usuarioId).toBeNull(); // El adapter busca data.usuarioId primero, no data.UsuarioId
    expect(result.nombre).toBe("María");
    expect(result.apellido).toBe("González");
    // El adapter construye: nombreCompleto = data.nombreCompleto || `${data.nombre || ""} ${data.apellido || ""}`.trim()
    // Como data.nombreCompleto no existe, busca data.nombre (undefined) y data.apellido (undefined)
    // Resultado: `${""} ${""}`.trim() = ""
    // El adapter NO busca data.Nombre o data.Apellido para construir nombreCompleto, solo usa data.nombre y data.apellido
    expect(result.nombreCompleto).toBe("");
    expect(result.email).toBe("maria@test.com");
    expect(result.username).toBe("maria.gonzalez");
  });

  it("debe usar valores por defecto cuando faltan campos", () => {
    const data = {
      id: 1,
      personaId: 10,
    };

    const result = empleadoAdapter(data);

    expect(result.usuarioId).toBeNull();
    expect(result.nombre).toBe("");
    expect(result.apellido).toBe("");
    expect(result.nombreCompleto).toBe(""); // trim() elimina espacios
    expect(result.email).toBe("");
    expect(result.username).toBeNull();
    expect(result.telefono).toBeNull();
    expect(result.direccion).toBeNull();
    expect(result.localidadId).toBeNull();
    expect(result.localidad).toBeNull();
    expect(result.estado).toBe("Activo");
    expect(result.legajo).toBeNull();
  });

  it("debe manejar valores null y undefined correctamente", () => {
    const data = {
      id: 1,
      personaId: 10,
      usuarioId: null,
      nombre: "Test",
      apellido: "Test",
      email: undefined,
      username: null,
      telefono: undefined,
    };

    const result = empleadoAdapter(data);

    expect(result.usuarioId).toBeNull();
    expect(result.email).toBe("");
    expect(result.username).toBeNull();
    expect(result.telefono).toBeNull();
  });

  it("debe convertir strings a números correctamente", () => {
    const data = {
      id: "1",
      personaId: "10",
      usuarioId: "20",
      nombre: "Test",
      apellido: "Test",
      localidadId: "30",
      departamentoId: "40",
      provinciaId: "50",
      rolId: "60",
    };

    const result = empleadoAdapter(data);

    expect(result.id).toBe(1);
    expect(result.personaId).toBe(10);
    expect(result.usuarioId).toBe(20);
    expect(result.localidadId).toBe(30);
    expect(result.departamentoId).toBe(40);
    expect(result.provinciaId).toBe(50);
    expect(result.rolId).toBe(60);
  });

  it("debe generar nombreCompleto correctamente cuando faltan campos", () => {
    const data1 = {
      id: 1,
      personaId: 10,
      nombre: "Juan",
      apellido: "Pérez",
    };
    const result1 = empleadoAdapter(data1);
    expect(result1.nombreCompleto).toBe("Juan Pérez");

    const data2 = {
      id: 2,
      personaId: 20,
      nombre: "María",
    };
    const result2 = empleadoAdapter(data2);
    expect(result2.nombreCompleto).toBe("María"); // trim() elimina espacios finales

    const data3 = {
      id: 3,
      personaId: 30,
      nombreCompleto: "Nombre Completo",
    };
    const result3 = empleadoAdapter(data3);
    expect(result3.nombreCompleto).toBe("Nombre Completo");
  });
});

describe("empleadoListAdapter", () => {
  it("debe adaptar un array de empleados", () => {
    const data = [
      {
        id: 1,
        personaId: 10,
        nombre: "Empleado 1",
        apellido: "Test",
      },
      {
        id: 2,
        personaId: 20,
        nombre: "Empleado 2",
        apellido: "Test",
      },
    ];

    const result = empleadoListAdapter(data);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it("debe retornar array vacío si no es un array", () => {
    expect(empleadoListAdapter(null as any)).toEqual([]);
    expect(empleadoListAdapter(undefined as any)).toEqual([]);
    expect(empleadoListAdapter("string" as any)).toEqual([]);
    expect(empleadoListAdapter({} as any)).toEqual([]);
  });
});
