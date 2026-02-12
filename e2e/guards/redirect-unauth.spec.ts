import { test, expect } from "@playwright/test";

test.describe("Protección de rutas (sin autenticación)", () => {
  test("acceder a /ventas sin login redirige a /signin", async ({
    page,
  }) => {
    await page.goto("/ventas");
    await expect(page).toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: /bienvenido/i })).toBeVisible();
  });

  test("acceder a /dashboard sin login redirige a /signin", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/signin/);
  });

  test("acceder a /productos sin login redirige a /signin", async ({
    page,
  }) => {
    await page.goto("/productos");
    await expect(page).toHaveURL(/\/signin/);
  });

  test("acceder a /clientes sin login redirige a /signin", async ({
    page,
  }) => {
    await page.goto("/clientes");
    await expect(page).toHaveURL(/\/signin/);
  });
});
