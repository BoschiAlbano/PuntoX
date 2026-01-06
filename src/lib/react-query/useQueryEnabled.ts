import { useMemo } from "react";

/**
 * Hook helper para determinar si las queries deben estar habilitadas
 * Evita que las queries se ejecuten cuando tieneAcceso es undefined
 * y luego se cancelen cuando cambia a true/false
 * 
 * @param tieneAcceso - Valor de acceso (puede ser undefined, true, o false)
 * @param isLoadingPermisos - Si los permisos están cargando
 * @param additionalConditions - Condiciones adicionales (opcional)
 * @returns boolean - true solo cuando tieneAcceso está definitivamente establecido
 */
export function useQueryEnabled(
  tieneAcceso: boolean | undefined,
  isLoadingPermisos: boolean,
  additionalConditions: boolean = true
): boolean {
  return useMemo(() => {
    // No habilitar si aún está cargando permisos
    if (isLoadingPermisos) {
      return false;
    }
    
    // No habilitar si tieneAcceso es undefined (aún no se ha determinado)
    if (tieneAcceso === undefined) {
      return false;
    }
    
    // Solo habilitar si tieneAcceso está definitivamente establecido Y tiene acceso
    return tieneAcceso === true && additionalConditions;
  }, [tieneAcceso, isLoadingPermisos, additionalConditions]);
}

