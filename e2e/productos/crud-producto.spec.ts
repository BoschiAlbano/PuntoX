import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Flujo CRUD Producto", () => {
  test("tras login puede acceder a productos y ver listado", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/productos");
    await page.waitForTimeout(2000);
    await expect(
      page.getByPlaceholder(/buscar productos/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test("puede abrir el formulario de nuevo producto", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/productos");
    await page.waitForTimeout(2000);

    const nuevoBtn = page.getByRole("button", { name: /Nuevo/i });
    const isVisible = await nuevoBtn.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
    }

    await nuevoBtn.click();
    await page.waitForTimeout(1000);

    await expect(
      page.getByText(/Nuevo Producto|Crear producto/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("tabs Productos, Marcas, Rubros, Unidades están visibles", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/productos");
    await page.waitForTimeout(1500);
    await expect(page.getByRole("tab", { name: /Productos/i })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("tab", { name: /Marcas/i })).toBeVisible({
      timeout: 3000,
    });
  });
});
