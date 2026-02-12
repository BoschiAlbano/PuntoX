/**
 * Tests para routePermissions: getPermisoForRoute, tienePermisoParaRuta.
 */
import { describe, it, expect } from "vitest";
import {
  getPermisoForRoute,
  tienePermisoParaRuta,
  PERMISO_NAME_TO_KEY,
  PERMISO_KEY_TO_NAME,
} from "./routePermissions";

describe("getPermisoForRoute", () => {
  it("retorna el permiso para rutas exactas", () => {
    expect(getPermisoForRoute("/ventas")).toBe("ventas");
    expect(getPermisoForRoute("/caja")).toBe("caja");
    expect(getPermisoForRoute("/productos")).toBe("productos");
    expect(getPermisoForRoute("/clientes")).toBe("clientes");
  });

  it("retorna permiso para rutas anidadas por prefijo", () => {
    expect(getPermisoForRoute("/configuracion/seguridad")).toBe("configuracion");
  });

  it("retorna null para rutas sin permiso mapeado", () => {
    expect(getPermisoForRoute("/ruta-inexistente")).toBeNull();
  });

  it("normaliza la ruta (quita query y trailing slash)", () => {
    expect(getPermisoForRoute("/ventas?foo=1")).toBe("ventas");
    expect(getPermisoForRoute("/ventas/")).toBe("ventas");
  });
});

describe("tienePermisoParaRuta", () => {
  it("retorna true cuando el usuario tiene el permiso", () => {
    expect(tienePermisoParaRuta(["ventas", "productos"], "/ventas")).toBe(true);
  });

  it("retorna false cuando el usuario no tiene el permiso", () => {
    expect(tienePermisoParaRuta(["productos"], "/ventas")).toBe(false);
  });

  it("retorna true para rutas sin permiso requerido", () => {
    expect(tienePermisoParaRuta([], "/ruta-desconocida")).toBe(true);
  });
});

describe("PERMISO_NAME_TO_KEY y PERMISO_KEY_TO_NAME", () => {
  it("mapean correctamente entre nombres y claves", () => {
    expect(PERMISO_NAME_TO_KEY["Ventas"]).toBe("ventas");
    expect(PERMISO_KEY_TO_NAME["ventas"]).toBe("Ventas");
  });
});
