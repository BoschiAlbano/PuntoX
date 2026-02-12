/**
 * Tests para clienteAdapter y clienteListAdapter.
 */
import { describe, it, expect } from "vitest";
import { clienteAdapter, clienteListAdapter } from "./cliente.adapter";

describe("clienteAdapter", () => {
  it("adapta un objeto de API al formato Cliente", () => {
    const apiData = {
      Id: 1,
      Nombre: "Juan",
      Apellido: "Pérez",
      Dni: "12345678",
      Direccion: "Calle Falsa 123",
      Telefono: "1234567890",
      Mail: "juan@test.com",
      LocalidadId: 10,
      Localidad: {
        Descripcion: "Capital",
        Departamento: {
          Id: 5,
          Descripcion: "Central",
          Provincia: { Id: 1, Descripcion: "Buenos Aires" },
        },
      },
      Persona_Cliente: {
        CondicionIva: { Id: 1, Descripcion: "IVA Responsable" },
        ActivarCtaCte: true,
        TieneLimiteCompra: true,
        MontoMaximoCtaCte: 5000,
      },
    };

    const result = clienteAdapter(apiData);
    expect(result.Id).toBe(1);
    expect(result.Nombre).toBe("Juan");
    expect(result.Apellido).toBe("Pérez");
    expect(result.Dni).toBe("12345678");
    expect(result.Mail).toBe("juan@test.com");
    expect(result.Localidad).toBe("Capital");
    expect(result.Provincia).toBe("Buenos Aires");
    expect(result.CondicionIva).toBe("IVA Responsable");
    expect(result.ActivarCtaCte).toBe(true);
    expect(result.MontoMaximoCtaCte).toBe(5000);
  });

  it("maneja valores nulos o undefined con defaults", () => {
    const result = clienteAdapter({
      Id: 1,
      Nombre: "Test",
      Localidad: null,
      Persona_Cliente: null,
    });
    expect(result.Id).toBe(1);
    expect(result.Nombre).toBe("Test");
    expect(result.Localidad).toBe("");
    expect(result.Provincia).toBe("");
    expect(result.CondicionIva).toBe("N/A");
    expect(result.ActivarCtaCte).toBe(false);
    expect(result.MontoMaximoCtaCte).toBe(0);
  });
});

describe("clienteListAdapter", () => {
  it("adapta un array de clientes", () => {
    const apiData = [
      { Id: 1, Nombre: "A", Localidad: null, Persona_Cliente: null },
      { Id: 2, Nombre: "B", Localidad: null, Persona_Cliente: null },
    ];
    const result = clienteListAdapter(apiData);
    expect(result).toHaveLength(2);
    expect(result[0].Id).toBe(1);
    expect(result[0].Nombre).toBe("A");
    expect(result[1].Id).toBe(2);
  });

  it("retorna array vacío cuando no es array", () => {
    expect(clienteListAdapter(null as any)).toEqual([]);
    expect(clienteListAdapter(undefined as any)).toEqual([]);
    expect(clienteListAdapter({} as any)).toEqual([]);
  });
});
