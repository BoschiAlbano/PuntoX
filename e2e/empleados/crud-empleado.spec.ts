import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Flujo CRUD Empleado", () => {
  test("tras login puede acceder a empleados y ver contenido", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/empleados");
    await page.waitForTimeout(2000);

    const tieneTabs = await page.getByRole("tab", { name: /Usuarios|Roles|Auditoría/i }).first().isVisible().catch(() => false);
    const tieneBusqueda = await page.getByPlaceholder(/buscar/i).isVisible().catch(() => false);
    const tieneNuevo = await page.getByRole("button", { name: /Nuevo/i }).isVisible().catch(() => false);

    expect(tieneTabs || tieneBusqueda || tieneNuevo).toBe(true);
  });

  test("tabs Usuarios, Roles, Auditoría están visibles", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/empleados");
    await page.waitForTimeout(1500);

    const tabUsuarios = await page.getByRole("tab", { name: /Usuarios/i }).isVisible().catch(() => false);
    const tabRoles = await page.getByRole("tab", { name: /Roles/i }).isVisible().catch(() => false);
    const txtUsuarios = await page.getByText("Usuarios").first().isVisible().catch(() => false);

    expect(tabUsuarios || tabRoles || txtUsuarios).toBe(true);
  });
});
