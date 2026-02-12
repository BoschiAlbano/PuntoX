import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Flujo Caja - Abrir y Cerrar", () => {
  test("tras login puede acceder a caja y ver contenido de la sección", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/caja");
    await page.waitForTimeout(3000);
    await page.getByRole("tab", { name: /Caja Actual/i }).click().catch(() => {});
    await page.waitForTimeout(2000);
    const abrirCaja = page.getByRole("button", { name: /Abrir Caja/i });
    const cerrarCaja = page.getByRole("button", { name: /Cerrar Caja/i });
    const tieneAbrir = await abrirCaja.first().isVisible().catch(() => false);
    const tieneCerrar = await cerrarCaja.first().isVisible().catch(() => false);
    const tieneCajaCerrada = await page.getByText(/La caja está cerrada|Debes abrir/i).isVisible().catch(() => false);
    const tieneTabsCaja = await page.getByRole("tab", { name: /Caja Actual|Cajas/i }).first().isVisible().catch(() => false);
    expect(tieneAbrir || tieneCerrar || tieneCajaCerrada || tieneTabsCaja).toBe(true);
  });

  test("puede abrir la caja cuando no hay caja abierta", async ({
    authenticatedPage: page,
  }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/caja");
    await page.waitForTimeout(2000);
    await page.getByRole("tab", { name: /Caja Actual/i }).click().catch(() => {});
    await page.waitForTimeout(1500);

    const abrirBtn = page.getByRole("button", { name: /Abrir Caja/i }).first();
    const isVisible = await abrirBtn.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
    }

    await abrirBtn.click();
    await page.waitForTimeout(500);

    const montoInput = page.getByLabel(/Monto Inicial/i);
    await expect(montoInput).toBeVisible({ timeout: 5000 });
    await montoInput.fill("100");
    await page.waitForTimeout(300);

    const confirmBtn = page.getByRole("button", { name: /Abrir Caja/i }).last();
    await confirmBtn.click();
    await page.waitForTimeout(4000);

    await expect(
      page.getByRole("button", { name: /Cerrar Caja/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("muestra tabs Caja Actual y Cajas", async ({ authenticatedPage: page }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/caja");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    const tabActual = page.getByRole("tab", { name: /caja actual/i }).first();
    const tabCajas = page.getByRole("tab", { name: /^cajas$/i }).first();
    const hasActual = await tabActual.isVisible().catch(() => false);
    const hasCajas = await tabCajas.isVisible().catch(() => false);
    expect(hasActual || hasCajas).toBe(true);
  });
});
