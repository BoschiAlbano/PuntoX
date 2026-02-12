import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Configuración - Preferencias", () => {
  test("navega a la página de configuración", async ({ authenticatedPage: page }) => {
    await page.goto("/configuracion");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/configuracion/);
  });

  test("muestra tabs de configuración", async ({ authenticatedPage: page }) => {
    await page.goto("/configuracion");
    await page.waitForLoadState("networkidle");
    // Buscar tabs comunes de configuración
    const tab = page.getByRole("tab").first();
    await expect(tab).toBeVisible({ timeout: 10000 });
  });

  test("carga contenido de preferencias", async ({ authenticatedPage: page }) => {
    await page.goto("/configuracion");
    await page.waitForLoadState("networkidle");
    // Verificar que algún contenido de configuración se cargó
    const content = page.locator("main").or(page.locator("[role='tabpanel']")).first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});
