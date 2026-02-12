import { test as base } from "@playwright/test";

const E2E_USER = process.env.E2E_USER || "Agucho";
const E2E_PASSWORD = process.env.E2E_PASSWORD || "12345678";

/**
 * Realiza login con credenciales de prueba.
 * Usar E2E_USER y E2E_PASSWORD para sobreescribir (ej. en CI).
 */
async function loginAsUser(page: import("@playwright/test").Page) {
  await page.goto("/signin");
  await page.getByLabel(/nombre de usuario/i).fill(E2E_USER);
  await page.getByLabel(/contraseña/i).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /ingresar|iniciar sesi[oó]n/i }).click();
  // Esperar redirección post-login (default /ventas)
  await page.waitForURL(/\/(ventas|dashboard|not-branches)/, { timeout: 25000 });
}

export const test = base.extend<{ authenticatedPage: import("@playwright/test").Page }>({
  authenticatedPage: async ({ page }, use) => {
    await loginAsUser(page);
    await use(page);
  },
});

export { loginAsUser, E2E_USER, E2E_PASSWORD };
