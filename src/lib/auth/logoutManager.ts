/**
 * Utilidad para manejar el estado de logout manual
 * Previene que se muestren toasts de error durante el proceso de logout
 */

let isManualLogout = false;

/**
 * Marca que se está iniciando un logout manual
 */
export function startManualLogout() {
  isManualLogout = true;
}

/**
 * Marca que el logout manual ha terminado
 */
export function endManualLogout() {
  isManualLogout = false;
}

/**
 * Verifica si actualmente se está realizando un logout manual
 */
export function isManualLogoutInProgress(): boolean {
  return isManualLogout;
}

