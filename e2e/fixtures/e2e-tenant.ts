/**
 * Credenciales fijas del tenant E2E.
 *
 * Importar desde cualquier spec o fixture:
 *   import { E2E_TENANT } from "../fixtures/e2e-tenant";
 *
 * El global-setup crea este tenant si no existe antes de que corran los tests.
 */
export const E2E_TENANT = {
  /** Nombre visible de la tienda en el panel admin */
  tenantName: "Tienda E2E PuntoX",
  /** Username para login en el tenant E2E */
  adminUsername: "admin_e2e",
  /** Contraseña del admin del tenant E2E */
  adminPassword: "E2Etest123!",
  /** Email del admin del tenant E2E */
  adminEmail: "admin.e2e@puntox-test.com",
  /** Nombre de pila del admin */
  adminNombre: "Admin",
  /** Apellido del admin */
  adminApellido: "E2E",
} as const;
