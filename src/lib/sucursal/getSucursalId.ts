/**
 * Helper para obtener el sucursalId del usuario en endpoints
 * Retorna null si no hay sucursal activa (para endpoints que no requieren sucursal)
 */

import { getActiveBranchContext } from "./context";

/**
 * Obtiene el sucursalId activo del usuario
 * @returns sucursalId como number o null si no hay sucursal activa
 */
export async function getSucursalId(): Promise<number | null> {
  const context = await getActiveBranchContext();
  return context ? Number(context.sucursalId) : null;
}

/**
 * Obtiene el sucursalId activo del usuario o lanza error
 * Útil para endpoints que requieren sucursal
 * @returns sucursalId como number
 * @throws Error si no hay sucursal activa
 */
export async function requireSucursalId(): Promise<number> {
  const context = await getActiveBranchContext();
  if (!context) {
    throw new Error("Sucursal no seleccionada. Por favor seleccione una sucursal.");
  }
  return Number(context.sucursalId);
}

