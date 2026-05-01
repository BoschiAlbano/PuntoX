/**
 * clearClientState.ts
 * Limpieza centralizada de todo el estado del cliente al cerrar sesión.
 * Usado por logout manual, SIGNED_OUT event, y beforeunload.
 */

/** Prefijos de claves en localStorage que pertenecen a la app */
const APP_LOCALSTORAGE_PREFIXES = [
  "session_id_",
  "session_registered_",
  "login_attempts",
  "login_attempt_time",
  // Nota: device_trusted_* se preserva intencionalmente — es el "Recordar este dispositivo"
];

/**
 * Limpia todas las claves de localStorage que pertenecen a la app.
 * NO elimina device_trusted_* porque eso rompería la funcionalidad de dispositivo confiable.
 */
export function clearAppLocalStorage(): void {
  if (typeof localStorage === "undefined") return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (APP_LOCALSTORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

/**
 * Limpia todo el sessionStorage.
 */
export function clearSessionStorage(): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.clear();
  }
}

/**
 * Limpia cookies no-HttpOnly específicas de la app.
 * NUNCA elimina cookies de Supabase (sb-*) ni trusted_device_token.
 * La cookie trusted_device_token es HttpOnly y solo el servidor puede borrarla.
 * Las cookies de Supabase (sb-*) son necesarias para la autenticación.
 */
export function clearClientCookies(): void {
  if (typeof document === "undefined") return;

  // Prefijos de cookies que son SEGURAS de eliminar desde el cliente
  // (no incluimos sb-* ni trusted_device_token que son de auth/seguridad)
  const SAFE_TO_CLEAR_PREFIXES: string[] = [
    // Agregar aquí si en el futuro se crean cookies propias no-críticas
  ];

  if (SAFE_TO_CLEAR_PREFIXES.length === 0) return; // Nada que limpiar por ahora

  const cookieNames = document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);

  cookieNames.forEach((name) => {
    if (SAFE_TO_CLEAR_PREFIXES.some((prefix) => name.startsWith(prefix))) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
}

/**
 * Limpieza completa de todo el estado del cliente.
 * Llamar en logout manual y SIGNED_OUT event.
 * 
 * IMPORTANTE: No limpia cookies de auth (Supabase/trusted_device) para no
 * romper la autenticación. Las cookies HttpOnly solo el servidor puede borrarlas.
 */
export function clearAllClientState(): void {
  clearAppLocalStorage();
  clearSessionStorage();
  // No llamamos clearClientCookies() aquí porque podría borrar tokens de Supabase
  // y romper el flujo de autenticación. Las cookies de auth son manejadas por Supabase.
}

/**
 * Obtiene el sesionId guardado en localStorage para el usuario actual.
 * Busca dinámicamente porque el userId puede no estar disponible al momento del logout.
 */
export function getStoredSesionId(): string | null {
  if (typeof localStorage === "undefined") return null;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("session_id_")) {
      return localStorage.getItem(key);
    }
  }
  return null;
}

