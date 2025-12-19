import { describe, expect, it } from "vitest";
import {
  formatTiempoRelativo,
  formatearAccion,
  mapearAccion,
  mapearSeveridad,
} from "./auditoria-utils";

describe("auditoria-utils", () => {
  const baseDate = new Date("2025-12-20T12:00:00Z");

  it("formatTiempoRelativo muestra segundos", () => {
    const resultado = formatTiempoRelativo("2025-12-20T11:59:45Z", baseDate);
    expect(resultado).toBe("Hace unos segundos");
  });

  it("formatTiempoRelativo muestra minutos y horas", () => {
    expect(formatTiempoRelativo("2025-12-20T11:58:00Z", baseDate)).toBe(
      "Hace 2 min"
    );
    expect(formatTiempoRelativo("2025-12-20T10:00:00Z", baseDate)).toBe(
      "Hace 2h"
    );
    expect(formatTiempoRelativo("2025-12-19T12:00:00Z", baseDate)).toBe(
      "Ayer"
    );
  });

  it("mapearAccion agrupa categorías", () => {
    expect(mapearAccion("CREAR_USUARIO")).toEqual({
      categoria: "Usuarios",
      color: "success",
    });
    expect(mapearAccion("ELIMINAR_ROL")).toEqual({
      categoria: "Roles",
      color: "danger",
    });
    expect(mapearAccion("INVITAR_USUARIO")).toEqual({
      categoria: "Invitaciones",
      color: "warning",
    });
    expect(mapearAccion("OTRA_ACCION")).toEqual({
      categoria: "General",
      color: "default",
    });
  });

  it("formatearAccion usa detalle o casos conocidos", () => {
    expect(
      formatearAccion({
        accion: "CREAR_USUARIO",
        empleado: { nombre: "Agustin" },
      })
    ).toBe("Nuevo usuario creado: Agustin");
    expect(
      formatearAccion({ accion: "ELIMINAR_ROL", detalle: "Rol eliminado" })
    ).toBe("Rol eliminado");
    expect(formatearAccion({ accion: "UNKNOWN" })).toBe("UNKNOWN");
  });

  it("mapearSeveridad mapea correctamente los niveles", () => {
    expect(mapearSeveridad("CRITICAL")).toBe("danger");
    expect(mapearSeveridad("WARNING")).toBe("warning");
    expect(mapearSeveridad("INFO")).toBe("primary");
    expect(mapearSeveridad("UNKNOWN")).toBe("primary"); // default
  });
});
