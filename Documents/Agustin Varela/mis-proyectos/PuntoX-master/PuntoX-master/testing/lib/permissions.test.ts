/**
 * Tests para funciones de permisos
 */
import { describe, it, expect } from "vitest";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";

describe("hasPermission", () => {
  it("debe retornar true si el usuario tiene el permiso requerido", () => {
    const userPermissions = ["productos", "ventas", "clientes"];
    const result = hasPermission(userPermissions, PERMISSIONS.PRODUCTOS);

    expect(result).toBe(true);
  });

  it("debe retornar false si el usuario no tiene el permiso requerido", () => {
    const userPermissions = ["ventas", "clientes"];
    const result = hasPermission(userPermissions, PERMISSIONS.PRODUCTOS);

    expect(result).toBe(false);
  });

  it("debe retornar false si el array de permisos está vacío", () => {
    const userPermissions: string[] = [];
    const result = hasPermission(userPermissions, PERMISSIONS.PRODUCTOS);

    expect(result).toBe(false);
  });

  it("debe funcionar con diferentes tipos de permisos", () => {
    const userPermissions = ["productos", "ventas", "caja"];
    
    expect(hasPermission(userPermissions, PERMISSIONS.PRODUCTOS)).toBe(true);
    expect(hasPermission(userPermissions, PERMISSIONS.VENTAS)).toBe(true);
    expect(hasPermission(userPermissions, PERMISSIONS.CAJA)).toBe(true);
    expect(hasPermission(userPermissions, PERMISSIONS.CLIENTES)).toBe(false);
  });

  it("debe ser case-sensitive", () => {
    const userPermissions = ["PRODUCTOS"]; // mayúscula
    const result = hasPermission(userPermissions, PERMISSIONS.PRODUCTOS);

    expect(result).toBe(false);
  });

  it("debe manejar permisos con caracteres especiales", () => {
    const userPermissions = ["empleados:admin", "productos:admin"];
    const result = hasPermission(userPermissions, PERMISSIONS.EMPLEADOS_ADMIN);

    expect(result).toBe(true);
  });
});
