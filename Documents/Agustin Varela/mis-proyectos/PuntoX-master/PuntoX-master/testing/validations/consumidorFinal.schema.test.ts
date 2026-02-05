import { describe, expect, it } from "vitest";
import { consumidorFinalSchema } from "@/lib/validations/consumidorFinal.schema";

describe("consumidorFinalSchema", () => {
  it("debe tener datos base listos para crear un consumidor final por defecto", () => {
    expect(consumidorFinalSchema).toMatchObject({
      Nombre: "Consumidor",
      Apellido: "Final",
      Dni: "99999999",
      Direccion: "Sin dirección",
      Telefono: "123456789",
      Mail: "consumidorfinal@puntox.com",
    });
  });

  it("debe exponer un mail valido y un dni numerico de 8 digitos", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dniRegex = /^\d{8}$/;

    expect(emailRegex.test(consumidorFinalSchema.Mail)).toBe(true);
    expect(dniRegex.test(consumidorFinalSchema.Dni)).toBe(true);
  });
});
