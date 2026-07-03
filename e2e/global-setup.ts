/**
 * Playwright Global Setup
 *
 * Corre UNA VEZ antes de toda la suite E2E.
 * Responsabilidades:
 *  1. Intentar login con las credenciales del tenant E2E.
 *     - Si funciona: el tenant ya existe → no hace nada más.
 *  2. Si el login falla: entra como SuperAdmin y crea el tenant E2E
 *     en /admin/tenants/new con credenciales fijas.
 *
 * Las credenciales del tenant E2E se exportan desde e2e/fixtures/e2e-tenant.ts
 * para que todas las fixtures y tests puedan importarlas.
 */

import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// ── Credenciales SuperAdmin (del seed) ──────────────────────────────────────
const SA_USERNAME = "superadmin";
const SA_PASSWORD = "12345678";

// ── Credenciales fijas del tenant E2E ───────────────────────────────────────
// Importadas desde e2e/fixtures/e2e-tenant.ts (mismo objeto)
export const E2E_TENANT = {
  tenantName: "Tienda E2E PuntoX",
  adminUsername: "admin_e2e",
  adminPassword: "E2Etest123!",
  adminEmail: "admin.e2e@puntox-test.com",
  adminNombre: "Admin",
  adminApellido: "E2E",
};

async function globalSetup() {
  console.log("\n🔧 [global-setup] Verificando tenant E2E...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  try {
    // ── Paso 1: Probar login con credenciales del tenant E2E ────────────────
    await page.goto("/signin");
    // Wait for the signin form to be ready
    await page.waitForSelector('input[placeholder="juan"]', { timeout: 15000 });
    await page
      .locator('input[placeholder="juan"]')
      .fill(E2E_TENANT.adminUsername);
    await page
      .locator('input[placeholder="••••••••"]')
      .fill(E2E_TENANT.adminPassword);
    await page.locator('button:has-text("Iniciar sesión")').click();

    // Wait up to 12s for either a successful redirect or staying on /signin (error)
    let loginResult = "fail";
    try {
      // Poll the URL until we leave /signin — success means tenant exists
      await page.waitForURL("**/ventas", { timeout: 6000 });
      loginResult = "ok";
    } catch {
      try {
        await page.waitForURL("**/dashboard", { timeout: 6000 });
        loginResult = "ok";
      } catch {
        try {
          // /onboarding and /not-branches are also valid post-login destinations
          await page.waitForURL("**/onboarding", { timeout: 6000 });
          loginResult = "ok";
        } catch {
          try {
            await page.waitForURL("**/not-branches", { timeout: 6000 });
            loginResult = "ok";
          } catch {
            // Still on /signin or on an error page — tenant doesn't exist
          }
        }
      }
    }

    if (loginResult === "ok") {
      console.log(
        `✅ [global-setup] Tenant E2E ya existe (${E2E_TENANT.adminUsername}). Nada que hacer.`,
      );
      return;
    }

    console.log(
      "⚠️  [global-setup] Tenant E2E no encontrado. Creando vía SuperAdmin...",
    );

    // ── Paso 2: Login como SuperAdmin ────────────────────────────────────────
    await page.goto("/signin");
    await page.waitForSelector('input[placeholder="juan"]', { timeout: 15000 });
    await page.locator('input[placeholder="juan"]').fill(SA_USERNAME);
    await page.locator('input[placeholder="••••••••"]').fill(SA_PASSWORD);
    await page.locator('button:has-text("Iniciar sesión")').click();

    // SuperAdmin puede redirigir a /admin o /dashboard — esperamos cualquiera
    try {
      await page.waitForURL("**/admin/**", { timeout: 15000 });
    } catch {
      await page.waitForURL("**/dashboard", { timeout: 10000 });
    }
    console.log("✅ [global-setup] SuperAdmin logueado.");

    // ── Paso 3: Ir a crear nueva tienda ──────────────────────────────────────
    await page.goto("/admin/tenants/new");
    await page.waitForLoadState("networkidle");
    // Wait for the plan select to be ready (plans load async via React Query)
    await page.waitForTimeout(2000);

    // ── Paso 4: Elegir plan (HeroUI Select usa un portal para las opciones) ──
    const planTrigger = page.locator('[aria-haspopup="listbox"]').first();
    await planTrigger.click({ force: true });
    await page.waitForTimeout(800);
    // Options render in a dialog portal — click "Plan Básico"
    const planBasico = page
      .locator('dialog [role="option"]')
      .filter({ hasText: "Plan Básico" });
    const planVisible = await planBasico.isVisible().catch(() => false);
    if (planVisible) {
      await planBasico.click();
    } else {
      // Fallback: click the first option available
      const firstOption = page.locator('dialog [role="option"]').first();
      await firstOption.waitFor({ timeout: 5000 });
      await firstOption.click();
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // ── Paso 5: Datos del comercio ────────────────────────────────────────────
    await page
      .locator('input[placeholder="Ej: Kiosco San Martín"]')
      .fill(E2E_TENANT.tenantName);
    await page
      .locator('input[placeholder="kiosco@example.com"]')
      .fill(E2E_TENANT.adminEmail)
      .catch(() => {
        /* campo opcional */
      });

    // ── Paso 6: Datos del administrador ──────────────────────────────────────
    await page
      .locator('input[placeholder="Juan"]')
      .fill(E2E_TENANT.adminNombre);
    await page
      .locator('input[placeholder="Pérez"]')
      .fill(E2E_TENANT.adminApellido);
    await page
      .locator('input[placeholder="juan.perez@example.com"]')
      .fill(E2E_TENANT.adminEmail);
    await page
      .locator('input[placeholder="jperez"]')
      .fill(E2E_TENANT.adminUsername);
    await page
      .locator('input[placeholder="Mínimo 6 caracteres"]')
      .fill(E2E_TENANT.adminPassword);

    // ── Paso 7: Enviar formulario ─────────────────────────────────────────────
    await page.locator('button:has-text("Crear comercio")').click();

    // Esperar redirección a /admin/tenants tras crear exitosamente
    await page.waitForURL("**/admin/tenants", { timeout: 30000 });
    console.log(
      `✅ [global-setup] Tenant E2E creado: "${E2E_TENANT.tenantName}" / usuario: ${E2E_TENANT.adminUsername}`,
    );
  } catch (err) {
    console.error("❌ [global-setup] Error durante la configuración:", err);
    // No tiramos el error para que los tests no fallen por el setup;
    // los tests individuales manejarán el caso de tenant no disponible.
  } finally {
    await context.close();
    await browser.close();
    console.log("🔧 [global-setup] Finalizado.\n");
  }
}

export default globalSetup;
