import { test as base } from "@playwright/test";
import { E2E_TENANT } from "./e2e-tenant";

// ── Credenciales legacy (tests anteriores) ───────────────────────────────────
const E2E_USER = process.env.E2E_USER || "Agucho";
const E2E_PASSWORD = process.env.E2E_PASSWORD || "12345678";

// ── Credenciales SuperAdmin ──────────────────────────────────────────────────
const SA_USERNAME = process.env.SA_USERNAME || "superadmin";
const SA_PASSWORD = process.env.SA_PASSWORD || "12345678";

// ── Helpers de login ─────────────────────────────────────────────────────────

/** Login con las credenciales legacy (E2E_USER / E2E_PASSWORD). */
async function loginAsUser(page: import("@playwright/test").Page) {
  await page.goto("/signin");
  await page.getByLabel(/nombre de usuario/i).fill(E2E_USER);
  await page.getByLabel(/contraseña/i).fill(E2E_PASSWORD);
  await page
    .getByRole("button", { name: /ingresar|iniciar sesi[oó]n/i })
    .click();
  await page.waitForURL(/\/(ventas|dashboard|not-branches)/, {
    timeout: 25000,
  });
}

/** Login como administrador del tenant E2E creado en el globalSetup. */
async function loginAsE2ETenant(page: import("@playwright/test").Page) {
  await page.goto("/signin");
  await page.getByLabel(/nombre de usuario/i).fill(E2E_TENANT.adminUsername);
  await page.getByLabel(/contraseña/i).fill(E2E_TENANT.adminPassword);
  await page
    .getByRole("button", { name: /ingresar|iniciar sesi[oó]n/i })
    .click();
  await page.waitForURL(/\/(ventas|dashboard|not-branches)/, {
    timeout: 25000,
  });
}

/** Login como SuperAdmin (panel /admin). */
async function loginAsSuperAdmin(page: import("@playwright/test").Page) {
  await page.goto("/signin");
  await page.getByLabel(/nombre de usuario/i).fill(SA_USERNAME);
  await page.getByLabel(/contraseña/i).fill(SA_PASSWORD);
  await page
    .getByRole("button", { name: /ingresar|iniciar sesi[oó]n/i })
    .click();
  await page.waitForURL(/\/admin/, { timeout: 25000 });
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

type AuthFixtures = {
  /** Página autenticada con las credenciales legacy (backwards-compat). */
  authenticatedPage: import("@playwright/test").Page;
  /** Página autenticada como admin del tenant E2E. Usar en todos los tests nuevos de journey/. */
  e2ePage: import("@playwright/test").Page;
  /** Página autenticada como SuperAdmin. Usar solo en tests de admin panel. */
  superAdminPage: import("@playwright/test").Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await loginAsUser(page);
    await use(page);
  },

  e2ePage: async ({ page }, use) => {
    await loginAsE2ETenant(page);
    await use(page);
  },

  superAdminPage: async ({ page }, use) => {
    await loginAsSuperAdmin(page);
    await use(page);
  },
});

export {
  loginAsUser,
  loginAsE2ETenant,
  loginAsSuperAdmin,
  E2E_USER,
  E2E_PASSWORD,
  SA_USERNAME,
  SA_PASSWORD,
};
