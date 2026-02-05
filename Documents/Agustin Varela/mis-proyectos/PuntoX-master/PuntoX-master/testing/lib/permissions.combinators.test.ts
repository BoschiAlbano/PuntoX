import { describe, expect, it } from "vitest";
import {
  hasAllPermissions,
  hasAnyPermission,
  PERMISSIONS,
} from "@/lib/auth/permissions";

describe("hasAnyPermission", () => {
  it("retorna true cuando el usuario tiene al menos un permiso requerido", () => {
    const userPermissions = [PERMISSIONS.VENTAS, PERMISSIONS.CAJA];
    const required = [PERMISSIONS.PRODUCTOS, PERMISSIONS.CAJA_ADMIN, PERMISSIONS.CAJA];

    expect(hasAnyPermission(userPermissions, required)).toBe(true);
  });

  it("retorna false cuando no hay interseccion de permisos", () => {
    const userPermissions = [PERMISSIONS.VENTAS];
    const required = [PERMISSIONS.PRODUCTOS, PERMISSIONS.CAJA];

    expect(hasAnyPermission(userPermissions, required)).toBe(false);
  });

  it("retorna false si requiredPermissions es vacio", () => {
    expect(hasAnyPermission([PERMISSIONS.VENTAS], [])).toBe(false);
  });
});

describe("hasAllPermissions", () => {
  it("retorna true cuando el usuario tiene todos los permisos requeridos", () => {
    const userPermissions = [
      PERMISSIONS.VENTAS,
      PERMISSIONS.CAJA,
      PERMISSIONS.PRODUCTOS,
    ];
    const required = [PERMISSIONS.CAJA, PERMISSIONS.PRODUCTOS];

    expect(hasAllPermissions(userPermissions, required)).toBe(true);
  });

  it("retorna false cuando falta al menos un permiso requerido", () => {
    const userPermissions = [PERMISSIONS.VENTAS, PERMISSIONS.CAJA];
    const required = [PERMISSIONS.CAJA, PERMISSIONS.PRODUCTOS];

    expect(hasAllPermissions(userPermissions, required)).toBe(false);
  });

  it("retorna true si requiredPermissions es vacio (semantica de every)", () => {
    expect(hasAllPermissions([PERMISSIONS.VENTAS], [])).toBe(true);
  });
});
