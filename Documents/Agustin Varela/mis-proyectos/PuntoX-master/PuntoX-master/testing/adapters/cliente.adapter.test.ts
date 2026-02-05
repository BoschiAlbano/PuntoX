/**
 * Tests para el adapter de clientes
 */
import { describe, it, expect } from "vitest";
import { clienteAdapter, clienteListAdapter } from "@/lib/adapters/cliente.adapter";

describe("clienteAdapter", () => {
  it("debe adaptar correctamente un cliente completo", () => {
    const data = {
      Id: "1",
      Nombre: "Juan",
      Apellido: "Pérez",
      Dni: "12345678",
      Direccion: "Calle 123",
      Telefono: "1234567890",
      Mail: "juan@test.com",
      LocalidadId: "10",
      Localidad: {
        Descripcion: "Buenos Aires",
        Departamento: {
          Id: "20",
          Descripcion: "Capital",
          Provincia: {
            Id: "30",
            Descripcion: "Buenos Aires",
          },
        },
      },
      Persona_Cliente: {
        CondicionIva: {
          Id: "40",
          Descripcion: "Responsable Inscripto",
        },
        ActivarCtaCte: true,
        TieneLimiteCompra: false,
        MontoMaximoCtaCte: "5000",
      },
    };

    const result = clienteAdapter(data);

    expect(result.Id).toBe(1);
    expect(result.Nombre).toBe("Juan");
    expect(result.Apellido).toBe("Pérez");
    expect(result.Dni).toBe("12345678");
    expect(result.LocalidadId).toBe(10);
    expect(result.Localidad).toBe("Buenos Aires");
    expect(result.ProvinciaId).toBe(30);
    expect(result.Provincia).toBe("Buenos Aires");
    expect(result.DepartamentoId).toBe(20);
    expect(result.Departamento).toBe("Capital");
    expect(result.CondicionIvaId).toBe(40);
    expect(result.CondicionIva).toBe("Responsable Inscripto");
    expect(result.ActivarCtaCte).toBe(true);
    expect(result.TieneLimiteCompra).toBe(false);
    expect(result.MontoMaximoCtaCte).toBe(5000);
  });

  it("debe usar valores por defecto cuando faltan campos opcionales", () => {
    const data = {
      Id: "1",
      Nombre: "Cliente",
      Apellido: "Test",
      Direccion: "Dirección",
      Mail: "test@test.com",
      LocalidadId: "10",
    };

    const result = clienteAdapter(data);

    expect(result.Dni).toBeUndefined();
    expect(result.Telefono).toBeUndefined();
    expect(result.Localidad).toBe("");
    expect(result.ProvinciaId).toBeNaN(); // Number(undefined) = NaN
    expect(result.Provincia).toBe("");
    expect(result.DepartamentoId).toBeNaN(); // Number(undefined) = NaN
    expect(result.Departamento).toBe("");
    expect(result.CondicionIvaId).toBeNaN(); // Number(undefined) = NaN
    expect(result.CondicionIva).toBe("N/A");
    expect(result.ActivarCtaCte).toBe(false);
    expect(result.TieneLimiteCompra).toBe(false);
    expect(result.MontoMaximoCtaCte).toBe(0);
  });

  it("debe manejar valores null y undefined correctamente", () => {
    const data = {
      Id: "1",
      Nombre: "Cliente",
      Apellido: "Test",
      Direccion: "Dirección",
      Mail: "test@test.com",
      LocalidadId: "10",
      Dni: null,
      Telefono: undefined,
      Localidad: null,
      Persona_Cliente: undefined,
    };

    const result = clienteAdapter(data);

    expect(result.Dni).toBeNull();
    expect(result.Telefono).toBeUndefined();
    expect(result.Localidad).toBe("");
    expect(result.CondicionIva).toBe("N/A");
  });

  it("debe convertir strings a números correctamente", () => {
    const data = {
      Id: "999",
      Nombre: "Test",
      Apellido: "Test",
      Direccion: "Test",
      Mail: "test@test.com",
      LocalidadId: "888",
      Localidad: {
        Descripcion: "Test",
        Departamento: {
          Id: "777",
          Descripcion: "Test",
          Provincia: {
            Id: "666",
            Descripcion: "Test",
          },
        },
      },
      Persona_Cliente: {
        CondicionIva: {
          Id: "555",
          Descripcion: "Test",
        },
        MontoMaximoCtaCte: "1234.56",
      },
    };

    const result = clienteAdapter(data);

    expect(result.Id).toBe(999);
    expect(result.LocalidadId).toBe(888);
    expect(result.ProvinciaId).toBe(666);
    expect(result.DepartamentoId).toBe(777);
    expect(result.CondicionIvaId).toBe(555);
    expect(result.MontoMaximoCtaCte).toBe(1234.56);
  });
});

describe("clienteListAdapter", () => {
  it("debe adaptar un array de clientes", () => {
    const data = [
      {
        Id: "1",
        Nombre: "Cliente 1",
        Apellido: "Test",
        Direccion: "Dir 1",
        Mail: "c1@test.com",
        LocalidadId: "10",
      },
      {
        Id: "2",
        Nombre: "Cliente 2",
        Apellido: "Test",
        Direccion: "Dir 2",
        Mail: "c2@test.com",
        LocalidadId: "20",
      },
    ];

    const result = clienteListAdapter(data);

    expect(result).toHaveLength(2);
    expect(result[0].Id).toBe(1);
    expect(result[1].Id).toBe(2);
  });

  it("debe retornar array vacío si no es un array", () => {
    expect(clienteListAdapter(null as any)).toEqual([]);
    expect(clienteListAdapter(undefined as any)).toEqual([]);
    expect(clienteListAdapter("string" as any)).toEqual([]);
    expect(clienteListAdapter({} as any)).toEqual([]);
  });
});
