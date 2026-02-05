import { describe, expect, it } from "vitest";
import { tiposVenta } from "@/lib/validations/tiposVenta.schema";
import { TiposVenta } from "../../prisma/generated/prisma";

describe("tiposVenta", () => {
  it("debe exponer las dos opciones de venta soportadas por negocio", () => {
    expect(tiposVenta).toEqual([
      { id: TiposVenta.UNIDAD, nombre: "Por Unidad" },
      { id: TiposVenta.PESO, nombre: "Por Peso" },
    ]);
  });

  it("debe mantener ids unicos para evitar conflictos en selects", () => {
    const ids = tiposVenta.map((tipo) => tipo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
