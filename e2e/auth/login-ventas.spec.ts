import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Flujo Login → Ventas", () => {
  test("tras login llega a pantalla de ventas o redirige correctamente", async ({
    authenticatedPage: page,
  }) => {
    // Por defecto el login redirige a /ventas
    const url = page.url();
    expect(url).toMatch(/\/(ventas|dashboard|not-branches)/);
  });

  test("pantalla de ventas muestra elementos clave", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip(); // Usuario sin sucursales asignadas
    }
    // Navegar a ventas si no está ahí
    if (!page.url().includes("ventas")) {
      await page.goto("/ventas");
    }
    // Input de búsqueda de productos en ventas
    await expect(
      page.getByPlaceholder(/escanear|busc|código/i).first()
    ).toBeVisible({ timeout: 8000 });
  });
});
