/**
 * Definición de tipos estrictos para los permisos del sistema.
 * Esto asegura que los permisos sean verificados en tiempo de compilación.
 */

export const PERMISSIONS = {
  // Ventas
  VENTAS: "ventas",
  VENTAS_ADMIN: "ventas:admin",

  // Caja
  CAJA: "caja",
  CAJA_ADMIN: "caja:admin",

  // Productos
  PRODUCTOS: "productos",
  PRODUCTOS_ADMIN: "productos:admin",

  // Empleados
  EMPLEADOS: "empleados",
  EMPLEADOS_ADMIN: "empleados:admin",

  // Clientes
  CLIENTES: "clientes",
  CLIENTES_ADMIN: "clientes:admin",

  // Reportes
  REPORTES: "reportes",
  REPORTES_ADMIN: "reportes:admin",

  // Configuración
  CONFIGURACION: "configuracion",
  CONFIGURACION_ADMIN: "configuracion:admin",

  // Sucursales
  SUCURSALES: "sucursales",
  SUCURSALES_ADMIN: "sucursales:admin",

  // Auditoría
  AUDITORIA: "auditoria",
  AUDITORIA_ADMIN: "auditoria:admin",

  // Analíticas
  ANALITICAS: "analiticas",
  ANALITICAS_ADMIN: "analiticas:admin",
} as const;

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
