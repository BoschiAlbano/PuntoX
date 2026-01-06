import { isManualLogoutInProgress } from "./logoutManager";
import { addToast } from "@heroui/react";

/**
 * Maneja errores de forma consistente, evitando mostrar toasts durante logout manual
 * @param error - El error a manejar
 * @param defaultMessage - Mensaje por defecto si el error no tiene mensaje
 * @param showToast - Si debe mostrar un toast (por defecto true)
 */
export function handleError(
  error: Error | unknown,
  defaultMessage: string = "Ocurrió un error",
  showToast: boolean = true
) {
  // No mostrar toasts durante logout manual
  if (isManualLogoutInProgress() || !showToast) {
    console.warn("Error silenciado durante logout:", error);
    return;
  }

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

