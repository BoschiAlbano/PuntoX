/**
 * Definición de tipos estrictos para los permisos del sistema.
 * Esto asegura que los permisos sean verificados en tiempo de compilación.
 */

import { PERMISSIONS } from "../constants/comprobantes";

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Verifica si un array de permisos incluye uno específico
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: Permission,
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Verifica si un array de permisos incluye al menos uno de los requeridos
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: Permission[],
): boolean {
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

/**
 * Verifica si un array de permisos incluye todos los requeridos
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: Permission[],
): boolean {
  return requiredPermissions.every((p) => userPermissions.includes(p));
}
