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
    expect(hasPermission(["ventas:page", "productos:page"], PERMISSIONS.VENTAS)).toBe(true);
    expect(hasPermission(["empleados:page"], PERMISSIONS.EMPLEADOS)).toBe(true);
  });

  it("retorna false si el usuario no tiene el permiso", () => {
    expect(hasPermission(["ventas:page"], PERMISSIONS.EMPLEADOS)).toBe(false);
    expect(hasPermission([], PERMISSIONS.CAJA)).toBe(false);
  });

  it("retorna false para array vacío", () => {
    expect(hasPermission([], PERMISSIONS.PRODUCTOS)).toBe(false);
  });
});

describe("permissions - hasAnyPermission", () => {
  it("retorna true si tiene al menos uno de los requeridos", () => {
    const user = ["ventas:page", "caja:page"];
    expect(
      hasAnyPermission(user, [PERMISSIONS.VENTAS, PERMISSIONS.EMPLEADOS])
    ).toBe(true);
    expect(
      hasAnyPermission(user, [PERMISSIONS.CAJA])
    ).toBe(true);
  });

  it("retorna false si no tiene ninguno", () => {
    const user = ["ventas:page"];
    expect(
      hasAnyPermission(user, [PERMISSIONS.EMPLEADOS, PERMISSIONS.CONFIGURACION])
    ).toBe(false);
  });

  it("retorna false si requiredPermissions está vacío", () => {
    expect(hasAnyPermission(["ventas:page"], [])).toBe(false);
  });
});

describe("permissions - hasAllPermissions", () => {
  it("retorna true si tiene todos los requeridos", () => {
    const user = ["ventas:page", "productos:page", "empleados:page"];
    expect(
      hasAllPermissions(user, [PERMISSIONS.VENTAS, PERMISSIONS.PRODUCTOS])
    ).toBe(true);
  });

  it("retorna false si falta al menos uno", () => {
    const user = ["ventas:page", "productos:page"];
    expect(
      hasAllPermissions(user, [PERMISSIONS.VENTAS, PERMISSIONS.EMPLEADOS])
    ).toBe(false);
  });

  it("retorna true si requiredPermissions está vacío", () => {
    expect(hasAllPermissions(["ventas:page"], [])).toBe(true);
  });
});
