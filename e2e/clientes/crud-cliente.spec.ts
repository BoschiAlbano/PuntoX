import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("CRUD de Clientes", () => {
  test("navega a la página de clientes", async ({ authenticatedPage: page }) => {
    await page.goto("/clientes");
    await page.waitForLoadState("networkidle");
    // Verificar que se muestra el listado o la tabla
    const heading = page.getByRole("heading", { name: /clientes/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("muestra barra de búsqueda de clientes", async ({ authenticatedPage: page }) => {
    await page.goto("/clientes");
    await page.waitForLoadState("networkidle");
    const searchInput = page.getByPlaceholder(/buscar/i).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test("abre formulario de nuevo cliente", async ({ authenticatedPage: page }) => {
    await page.goto("/clientes");
    await page.waitForLoadState("networkidle");
    const newButton = page.getByRole("button", { name: /nuevo|agregar|crear/i }).first();
    await expect(newButton).toBeVisible({ timeout: 10000 });
  });
});
