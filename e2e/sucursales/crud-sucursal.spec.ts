import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Flujo Sucursales", () => {
  test("tras login puede acceder a sucursales y ver contenido", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/sucursales");
    await page.waitForTimeout(2000);

    const tieneBusqueda = await page.getByPlaceholder(/buscar/i).isVisible().catch(() => false);
    const tieneNuevo = await page.getByRole("button", { name: /Nuevo/i }).isVisible().catch(() => false);
    const tieneListado = await page.getByText(/Sucursal|sucursales|No hay/i).isVisible().catch(() => false);

    expect(tieneBusqueda || tieneNuevo || tieneListado).toBe(true);
  });

  test("puede abrir formulario de nueva sucursal si existe botón Nuevo", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/sucursales");
    await page.waitForTimeout(2000);

    const nuevoBtn = page.getByRole("button", { name: /Nuevo/i });
    const isVisible = await nuevoBtn.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
    }

    await nuevoBtn.click();
    await page.waitForTimeout(1000);

    await expect(
      page.getByText(/Nueva Sucursal|Crear sucursal|Nombre|Dirección/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
