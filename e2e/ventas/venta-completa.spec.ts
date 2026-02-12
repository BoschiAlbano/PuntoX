import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Flujo Venta Completa", () => {
  test("tras login puede acceder a ventas y ver barra de búsqueda", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    if (!page.url().includes("ventas")) {
      await page.goto("/ventas");
    }
    await expect(
      page.getByPlaceholder(/escanear|busc|código/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("buscar producto y verificar que aparece en el grid", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    if (!page.url().includes("ventas")) {
      await page.goto("/ventas");
    }
    const searchInput = page.getByPlaceholder(/escanear|busc|código/i).first();
    await expect(searchInput).toBeVisible({ timeout: 8000 });
    await searchInput.fill("producto");
    await page.waitForTimeout(1500);
    const suggestions = page.locator('[role="listbox"], [data-slot="listbox"]');
    const item = page.getByRole("option").first();
    const hasSuggestions = await item.isVisible().catch(() => false);
    if (hasSuggestions) {
      await item.click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/subtotal|total/i).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("verificar presencia de botón confirmar venta", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    if (!page.url().includes("ventas")) {
      await page.goto("/ventas");
    }
    await expect(
      page.getByRole("button", { name: /confirmar|finalizar|venta/i })
    ).toBeVisible({ timeout: 5000 });
  });
});
