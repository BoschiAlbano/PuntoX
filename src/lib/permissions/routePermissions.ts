/**
 * Mapeo de rutas a permisos de página ({modulo}:page)
 *
 * Los permisos :get y :set se verifican directamente en cada API route.
 * Este archivo solo maneja el acceso a nivel de navegación/página.
 */

export const ROUTE_TO_PERMISO_KEY: Record<string, string> = {
  "/ventas": "ventas:page",
  "/caja": "caja:page",
  "/clientes": "clientes:page",
  "/productos": "productos:page",
  "/proveedores": "proveedores:page",
  "/compras": "compras:page",
  "/analiticas": "analiticas:page",
  "/configuracion": "configuracion:page",
  "/empleados": "empleados:page",
  "/sucursales": "sucursales:page",
  "/reportes": "reportes:page",
  "/auditoria": "auditoria:page",
};

// Nombres legibles para la UI (por clave :page)
export const PERMISO_KEY_TO_NAME: Record<string, string> = {
  "ventas:page": "Ventas",
  "caja:page": "Caja",
  "clientes:page": "Clientes",
  "productos:page": "Productos",
  "proveedores:page": "Proveedores",
  "compras:page": "Compras",
  "analiticas:page": "Analíticas",
  "configuracion:page": "Configuración",
  "empleados:page": "Empleados",
  "sucursales:page": "Sucursales",
  "reportes:page": "Reportes",
  "auditoria:page": "Auditoría",
};

/**
 * Obtiene la clave del permiso requerido para una ruta
 */
export function getPermisoForRoute(route: string): string | null {
  const normalizedRoute = route.split("?")[0].replace(/\/$/, "") || "/";

  if (ROUTE_TO_PERMISO_KEY[normalizedRoute]) {
    return ROUTE_TO_PERMISO_KEY[normalizedRoute];
  }

  // Subrutas: /configuracion/seguridad → configuracion:page
  for (const [routePath, permisoKey] of Object.entries(ROUTE_TO_PERMISO_KEY)) {
    if (normalizedRoute.startsWith(routePath)) {
      return permisoKey;
    }
  }

  return null;
}

/**
 * Verifica si un usuario tiene permiso para acceder a una ruta
 */
export function tienePermisoParaRuta(
  permisos: string[],
  route: string,
): boolean {
  const permisoRequerido = getPermisoForRoute(route);

  if (!permisoRequerido) {
    // Ruta sin permiso requerido → acceso libre
    return true;
  }

  return permisos.includes(permisoRequerido);
}

/**
 * Filtra las rutas del menú según los permisos del usuario
 */
export function filtrarRutasPorPermisos<T extends { href: string }>(
  rutas: T[],
  permisos: string[],
): T[] {
  return rutas.filter((ruta) => tienePermisoParaRuta(permisos, ruta.href));
}
