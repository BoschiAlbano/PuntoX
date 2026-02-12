import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("CRUD de Clientes", () => {
  test("navega a la página de clientes", async ({ authenticatedPage: page }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/clientes");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/clientes/);
    const heading = page.getByRole("heading", { name: /clientes/i }).first();
    const searchInput = page.getByPlaceholder(/buscar/i).first();
    const headingVisible = await heading.isVisible().catch(() => false);
    const searchVisible = await searchInput.isVisible().catch(() => false);
    expect(headingVisible || searchVisible).toBe(true);
  });

  test("muestra barra de búsqueda de clientes", async ({ authenticatedPage: page }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/clientes");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page.getByPlaceholder(/buscar/i).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test("abre formulario de nuevo cliente", async ({ authenticatedPage: page }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/clientes");
    await page.waitForLoadState("domcontentloaded");
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    const newButton = page.getByRole("button", { name: /nuevo|agregar|crear/i }).first();
    await expect(newButton).toBeVisible({ timeout: 10000 });
    await newButton.click();
    await page.waitForTimeout(500);
    const modalTitle = page.getByText(/nuevo cliente|editar cliente/i).first();
    const formField = page.getByLabel(/nombre|apellido/i).first();
    const hasModal = await modalTitle.isVisible().catch(() => false);
    const hasForm = await formField.isVisible().catch(() => false);
    expect(hasModal || hasForm).toBe(true);
  });
});
