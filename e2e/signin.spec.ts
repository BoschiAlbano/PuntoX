import { test, expect } from "@playwright/test";

test.describe("Página de login (/signin)", () => {
  test("carga la página de signin correctamente", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByRole("heading", { name: /bienvenido/i })).toBeVisible();
  });

  test("muestra formulario de credenciales", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByPlaceholder("juan")).toBeVisible({ timeout: 5000 });
  });

  test("muestra mensaje de acceso por invitación", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByText(/solo por invitación|administrador/i)).toBeVisible();
  });
});
