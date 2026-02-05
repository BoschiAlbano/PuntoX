import { addToast } from "@heroui/react";

/**
 * Maneja errores de forma consistente, evitando mostrar toasts durante logout manual
 * @param error - El error a manejar
 * @param defaultMessage - Mensaje por defecto si el error no tiene mensaje
 */
export function handleError(
  error: Error | unknown,
  defaultMessage: string = "Ocurrió un error",
) {
  const message = error instanceof Error ? error.message : String(error);

  // No mostrar toasts para errores de autenticación (401) ya que se manejan globalmente
  if (message.includes("No autenticado") || message.includes("401")) {
    return;
  }

  addToast({
    title: "Error",
    description: message || defaultMessage,
    color: "danger",
  });
}
