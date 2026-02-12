/**
 * Tests para el módulo de permisos (hasPermission, hasAnyPermission, hasAllPermissions)
 */
import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "./permissions";
import { PERMISSIONS } from "@/lib/constants/comprobantes";

describe("permissions - hasPermission", () => {
  it("retorna true si el usuario tiene el permiso", () => {
    expect(hasPermission(["ventas", "productos"], PERMISSIONS.VENTAS)).toBe(true);
    expect(hasPermission(["empleados"], PERMISSIONS.EMPLEADOS)).toBe(true);
  });

  it("retorna false si el usuario no tiene el permiso", () => {
    expect(hasPermission(["ventas"], PERMISSIONS.EMPLEADOS)).toBe(false);
    expect(hasPermission([], PERMISSIONS.CAJA)).toBe(false);
  });

  it("retorna false para array vacío", () => {
    expect(hasPermission([], PERMISSIONS.PRODUCTOS)).toBe(false);
  });
});

describe("permissions - hasAnyPermission", () => {
  it("retorna true si tiene al menos uno de los requeridos", () => {
    const user = ["ventas", "caja"];
    expect(
      hasAnyPermission(user, [PERMISSIONS.VENTAS, PERMISSIONS.EMPLEADOS])
    ).toBe(true);
    expect(
      hasAnyPermission(user, [PERMISSIONS.CAJA])
    ).toBe(true);
  });

  it("retorna false si no tiene ninguno", () => {
    const user = ["ventas"];
    expect(
      hasAnyPermission(user, [PERMISSIONS.EMPLEADOS, PERMISSIONS.CONFIGURACION])
    ).toBe(false);
  });

  it("retorna false si requiredPermissions está vacío", () => {
    expect(hasAnyPermission(["ventas"], [])).toBe(false);
  });
});

describe("permissions - hasAllPermissions", () => {
  it("retorna true si tiene todos los requeridos", () => {
    const user = ["ventas", "productos", "empleados"];
    expect(
      hasAllPermissions(user, [PERMISSIONS.VENTAS, PERMISSIONS.PRODUCTOS])
    ).toBe(true);
  });

  it("retorna false si falta al menos uno", () => {
    const user = ["ventas", "productos"];
    expect(
      hasAllPermissions(user, [PERMISSIONS.VENTAS, PERMISSIONS.EMPLEADOS])
    ).toBe(false);
  });

  it("retorna true si requiredPermissions está vacío", () => {
    expect(hasAllPermissions(["ventas"], [])).toBe(true);
  });
});
