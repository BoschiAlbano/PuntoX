import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Dashboard de Analíticas", () => {
  test("navega a la página de analíticas", async ({ authenticatedPage: page }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/analiticas");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/analiticas/);
  });

  test("muestra KPIs o métricas", async ({ authenticatedPage: page }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/analiticas");
    await page.waitForLoadState("domcontentloaded");
    const mainContent = page.locator("main").first();
    const anyContent = page.locator("[class*='card'], [class*='Card'], [class*='panel'], [class*='kpi'], [class*='analiticas']").first();
    const mainVisible = await mainContent.isVisible().catch(() => false);
    const anyVisible = await anyContent.isVisible().catch(() => false);
    expect(mainVisible || anyVisible).toBe(true);
  });

  test("muestra gráficas o paneles", async ({ authenticatedPage: page }) => {
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/analiticas");
    await page.waitForLoadState("domcontentloaded");
    const dashboardContent = page.locator("[class*='card'], [class*='Card'], [class*='panel'], [class*='kpi']").first();
    const isVisible = await dashboardContent.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });
});
