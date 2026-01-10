/**
 * Genera un email interno automático para empleados
 * Formato: {username}@puntox.com
 *
 * @param username - Nombre de usuario (se normaliza automáticamente)
 * @returns Email interno generado
 */
export function generateInternalEmail(username: string): string {
  // Normalizar username: lowercase, sin espacios, caracteres especiales permitidos: . _ -
  const normalized = username
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "") // Eliminar espacios
    .replace(/[^a-z0-9._-]/g, ""); // Solo permitir letras, números, punto, guion bajo y guion

  return `${normalized}2026@puntox.com`;
}
