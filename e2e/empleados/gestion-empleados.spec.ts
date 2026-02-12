import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Gestión de Empleados", () => {
  test("navega a la página de empleados", async ({ authenticatedPage: page }) => {
    await page.goto("/empleados");
    await page.waitForLoadState("domcontentloaded");
    // Verificar que carga la página
    await expect(page).toHaveURL(/\/empleados/);
  });

  test("muestra listado de empleados", async ({ authenticatedPage: page }) => {
    await page.goto("/empleados");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page.getByPlaceholder(/buscar/i).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test("muestra sección de roles", async ({ authenticatedPage: page }) => {
    await page.goto("/empleados");
    await page.waitForLoadState("domcontentloaded");
    // Buscar tab o botón de roles
    const rolesTab = page.getByRole("tab", { name: /roles/i }).or(page.getByRole("button", { name: /roles/i })).first();
    await expect(rolesTab).toBeVisible({ timeout: 10000 });
  });
});
