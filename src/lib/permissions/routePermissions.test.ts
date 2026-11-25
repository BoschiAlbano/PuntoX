/**
 * Tests para routePermissions: getPermisoForRoute, tienePermisoParaRuta.
 */
import { describe, it, expect } from "vitest";
import {
  getPermisoForRoute,
  tienePermisoParaRuta,
  PERMISO_KEY_TO_NAME,
  ROUTE_TO_PERMISO_KEY,
} from "./routePermissions";

describe("getPermisoForRoute", () => {
  it("retorna el permiso para rutas exactas", () => {
    expect(getPermisoForRoute("/ventas")).toBe("ventas:page");
    expect(getPermisoForRoute("/caja")).toBe("caja:page");
    expect(getPermisoForRoute("/productos")).toBe("productos:page");
    expect(getPermisoForRoute("/clientes")).toBe("clientes:page");
  });

  it("retorna permiso para rutas anidadas por prefijo", () => {
    expect(getPermisoForRoute("/configuracion/seguridad")).toBe("configuracion:page");
  });

  it("retorna null para rutas sin permiso mapeado", () => {
    expect(getPermisoForRoute("/ruta-inexistente")).toBeNull();
  });

  it("normaliza la ruta (quita query y trailing slash)", () => {
    expect(getPermisoForRoute("/ventas?foo=1")).toBe("ventas:page");
    expect(getPermisoForRoute("/ventas/")).toBe("ventas:page");
  });
});

describe("tienePermisoParaRuta", () => {
  it("retorna true cuando el usuario tiene el permiso", () => {
    expect(tienePermisoParaRuta(["ventas:page", "productos:page"], "/ventas")).toBe(true);
  });

  it("retorna false cuando el usuario no tiene el permiso", () => {
    expect(tienePermisoParaRuta(["productos:page"], "/ventas")).toBe(false);
  });

  it("retorna true para rutas sin permiso requerido", () => {
    expect(tienePermisoParaRuta([], "/ruta-desconocida")).toBe(true);
  });
});

describe("PERMISO_KEY_TO_NAME", () => {
  it("tiene un nombre legible para cada permiso de página de ROUTE_TO_PERMISO_KEY", () => {
    expect(PERMISO_KEY_TO_NAME["ventas:page"]).toBe("Ventas");
    for (const key of Object.values(ROUTE_TO_PERMISO_KEY)) {
      expect(PERMISO_KEY_TO_NAME[key]).toBeTruthy();
    }
  });
});
