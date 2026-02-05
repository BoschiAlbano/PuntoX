import { AsyncLocalStorage } from "async_hooks";
import { AuthContext } from "./getAuthUser";

/**
 * Request-level context storage using AsyncLocalStorage.
 * Esto permite cachear el AuthContext por request completo,
 * evitando múltiples llamadas a getAuthContext en el mismo request.
 */

interface RequestContextData {
  authContext?: AuthContext;
  // Puedes agregar más datos del request aquí si es necesario
}

export const requestContext = new AsyncLocalStorage<
  Map<string, RequestContextData>
>();

/**
 * Obtiene el contexto de autenticación del request actual si existe
 */
export function getRequestAuthContext(): AuthContext | undefined {
  const store = requestContext.getStore();
  return store?.get("auth")?.authContext;
}

/**
 * Guarda el contexto de autenticación en el request actual
 */
export function setRequestAuthContext(context: AuthContext): void {
  const store = requestContext.getStore();
  if (store) {
    store.set("auth", { authContext: context });
  }
}

/**
 * Limpia el contexto del request
 */
export function clearRequestContext(): void {
  const store = requestContext.getStore();
  store?.clear();
}
