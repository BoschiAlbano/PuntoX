/**
 * Mapeo de permisos a rutas del sistema
 * Cada permiso corresponde a una sección/página del dashboard
 *
 * Nota: Los permisos se guardan normalizados (minúsculas, sin espacios)
 * pero se muestran con mayúsculas en la UI
 */

// Mapeo de nombres de permisos (UI) a claves normalizadas (BD)
export const PERMISO_NAME_TO_KEY: Record<string, string> = {
  Ventas: "ventas",
  Caja: "caja",
  Clientes: "clientes",
  Productos: "productos",
  Analiticas: "analiticas",
  Configuracion: "configuracion",
  Empleados: "empleados",
};

// Mapeo de claves normalizadas a nombres de permisos
export const PERMISO_KEY_TO_NAME: Record<string, string> = {
  ventas: "Ventas",
  caja: "Caja",
  clientes: "Clientes",
  productos: "Productos",
  analiticas: "Analiticas",
  configuracion: "Configuracion",
  empleados: "Empleados",
};

export const PERMISO_TO_ROUTE: Record<string, string> = {
  Ventas: "/ventas",
  Caja: "/caja",
  Clientes: "/clientes",
  Productos: "/productos",
  Analiticas: "/analiticas",
  Configuracion: "/configuracion",
  Empleados: "/empleados",
};

export const ROUTE_TO_PERMISO_KEY: Record<string, string> = {
  "/ventas": "ventas",
  "/caja": "caja",
  "/clientes": "clientes",
  "/productos": "productos",
  "/analiticas": "analiticas",
  "/configuracion": "configuracion",
  "/empleados": "empleados",
  "/sucursales": "sucursales",
  "/reportes": "reportes",
  "/auditoria": "auditoria",
};

/**
 * Normaliza un permiso a su clave (minúsculas, sin espacios)
 */
function normalizePermisoKey(permiso: string): string {
  return permiso
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Obtiene la clave del permiso requerido para una ruta
 */
export function getPermisoForRoute(route: string): string | null {
  // Normalizar la ruta (remover query params, trailing slashes, etc.)
  const normalizedRoute = route.split("?")[0].replace(/\/$/, "") || "/";

  // Buscar permiso exacto
  if (ROUTE_TO_PERMISO_KEY[normalizedRoute]) {
    return ROUTE_TO_PERMISO_KEY[normalizedRoute];
  }

  // Buscar por prefijo (para rutas anidadas como /configuracion/seguridad)
  for (const [routePath, permisoKey] of Object.entries(ROUTE_TO_PERMISO_KEY)) {
    if (normalizedRoute.startsWith(routePath)) {
      return permisoKey;
    }
  }

  return null;
}

/**
 * Verifica si un usuario tiene permiso para acceder a una ruta
 * @param permisos Array de claves de permisos (normalizadas, ej: "ventas", "caja", "empleados:admin")
 * @param route Ruta a verificar (ej: "/ventas")
 */
export function tienePermisoParaRuta(
  permisos: string[],
  route: string,
): boolean {
  const permisoRequerido = getPermisoForRoute(route);

  if (!permisoRequerido) {
    // Si no hay permiso requerido para esta ruta, permitir acceso
    return true;
  }

  // Para permisos con ":" (como "empleados:admin"), comparar directamente sin normalizar
  // Para otros permisos, normalizar
  if (permisoRequerido.includes(":")) {
    // Permiso con formato "clave:subclave", comparar directamente
    return permisos.includes(permisoRequerido);
  }

  // Normalizar los permisos del usuario para comparar
  const permisosNormalizados = permisos.map((p) => normalizePermisoKey(p));
  const permisoRequeridoNormalizado = normalizePermisoKey(permisoRequerido);

  // Verificar si el usuario tiene el permiso (comparación normalizada)
  return permisosNormalizados.includes(permisoRequeridoNormalizado);
}

/**
 * Filtra las rutas del menú según los permisos del usuario
 */
export function filtrarRutasPorPermisos<T extends { href: string }>(
  rutas: T[],
  permisos: string[],
): T[] {
  console.log("permisos", permisos);
  console.log("rutas", rutas);
  const rutasFiltradas = rutas.filter((ruta) =>
    tienePermisoParaRuta(permisos, ruta.href),
  );

  console.log("rutasFiltradas", rutasFiltradas);
  return rutasFiltradas;
}
