import { createError } from "./types";

/**
 * Ejecuta un borrado físico. Cualquier error (violación de FK por relaciones
 * reales como ventas/movimientos/auditoría, o cualquier otro fallo inesperado)
 * se traduce a un mensaje entendible para el usuario en vez de un error crudo
 * de Prisma o un 500 genérico. El error original se loguea para diagnóstico.
 */
export async function ejecutarBorradoFisico<T>(
  fn: () => Promise<T>,
  mensajeConflicto: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("Error en borrado físico:", error);
    throw createError.conflict(mensajeConflicto);
  }
}
