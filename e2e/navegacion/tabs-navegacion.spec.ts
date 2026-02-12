import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Navegación entre páginas y tabs", () => {
  test("navega a ventas desde el sidebar", async ({ authenticatedPage: page }) => {
    // Si está en not-branches, skip
    if (page.url().includes("not-branches")) {
      test.skip();
      return;
    }
    const ventasBtn = page.getByRole("button", { name: /ventas/i }).first();
    await expect(ventasBtn).toBeVisible({ timeout: 5000 });
    await ventasBtn.click();
    await page.waitForURL(/\/ventas/, { timeout: 10000 });
  });

  test("navega a productos desde el sidebar", async ({ authenticatedPage: page }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
      return;
    }
    const productosBtn = page.getByRole("button", { name: /productos/i }).first();
    await expect(productosBtn).toBeVisible({ timeout: 5000 });
    await productosBtn.click();
    await page.waitForURL(/\/productos/, { timeout: 10000 });
  });

  test("navega a caja desde el sidebar", async ({ authenticatedPage: page }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
      return;
    }
    const cajaBtn = page.getByRole("button", { name: /caja/i }).first();
    await expect(cajaBtn).toBeVisible({ timeout: 5000 });
    await cajaBtn.click();
    await page.waitForURL(/\/caja/, { timeout: 10000 });
  });
});
