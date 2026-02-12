import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Flujo Login → Dashboard", () => {
  test("tras login exitoso redirige a ventas o dashboard", async ({
    authenticatedPage: page,
  }) => {
    const url = page.url();
    expect(url).toMatch(/\/(ventas|dashboard|not-branches)/);
  });

  test("muestra sidebar o contenido del dashboard tras login", async ({
    authenticatedPage: page,
  }) => {
    // Si redirigió a not-branches (sin sucursales) no hay sidebar típico
    if (page.url().includes("not-branches")) {
      await expect(page.getByText(/sucursal|branches/i).first()).toBeVisible();
      return;
    }
    // Sidebar usa buttons para menú (Ventas, Productos, etc.)
    const sidebarOrContent = page.getByRole("button", { name: /ventas/i }).first();
    await expect(sidebarOrContent).toBeVisible({ timeout: 5000 });
  });
});
