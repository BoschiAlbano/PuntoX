import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("carga la página principal y muestra el título Punto X", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Punto X/);
  });

  test("muestra el navbar con enlace al login", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /iniciar sesión/i })).toBeVisible();
  });

  test("muestra sección de características o hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/gestión|sistema|negocios/i).first()).toBeVisible({ timeout: 5000 });
  });
});
