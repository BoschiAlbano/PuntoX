import { addToast } from "@heroui/react";

type ApiErrorIssue = {
  field?: string;
  message?: string;
};

type ApiErrorPayload = {
  message?: string;
  error?:
    | string
    | {
        message?: string;
        details?: {
          issues?: ApiErrorIssue[];
        };
      };
  details?: {
    issues?: ApiErrorIssue[];
  };
};

export function extractErrorMessage(
  error: Error | unknown,
  defaultMessage: string = "Ocurrió un error",
): string {
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  if (error && typeof error === "object") {
    const payload = error as ApiErrorPayload;

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }

    if (
      payload.error &&
      typeof payload.error === "object" &&
      typeof payload.error.message === "string" &&
      payload.error.message.trim()
    ) {
      return payload.error.message;
    }

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    const issue =
      payload.details?.issues?.[0]?.message ??
      (typeof payload.error === "object"
        ? payload.error.details?.issues?.[0]?.message
        : undefined);

    if (issue) {
      return issue;
    }
  }

  return defaultMessage;
}

/**
 * Maneja errores de forma consistente, evitando mostrar toasts durante logout manual
 * @param error - El error a manejar
 * @param defaultMessage - Mensaje por defecto si el error no tiene mensaje
 */
export function handleError(
  error: Error | unknown,
  defaultMessage: string = "Ocurrió un error",
) {
  const message = extractErrorMessage(error, defaultMessage);

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
