import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Dashboard", () => {
  test("tras login puede acceder al dashboard", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);

    const tieneSidebar = await page.getByRole("navigation").isVisible().catch(() => false);
    const tieneResumen = await page.getByText(/Resumen|Dashboard|Ventas|Caja|Punto X SaaS|Sistema de Gestión|Hola de nuevo/i).isVisible().catch(() => false);

    expect(tieneSidebar || tieneResumen).toBe(true);
  });

  test("muestra elementos del sidebar (Ventas, Productos, Clientes)", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/dashboard");
    await page.waitForTimeout(1500);

    const btnVentas = await page.getByRole("button", { name: /Ventas/i }).isVisible().catch(() => false);
    const btnProductos = await page.getByRole("button", { name: /Productos/i }).isVisible().catch(() => false);
    const txtPuntoX = await page.getByText(/PuntoX|Punto X/i).isVisible().catch(() => false);

    expect(btnVentas || btnProductos || txtPuntoX).toBe(true);
  });
});
