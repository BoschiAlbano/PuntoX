import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Analíticas", () => {
  test("tras login puede acceder a analíticas", async ({
    authenticatedPage: page,
  }) => {
    test.setTimeout(45000);
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/analiticas");
    await page.waitForTimeout(3000);

    const tieneKpis = await page.getByText(/Ventas|Ingresos|Eficiencia|KPI/i).isVisible().catch(() => false);
    const tieneGraficas = await page.getByRole("heading", { name: /Ingresos|Pagos|Productos|Gráfica/i }).isVisible().catch(() => false);
    const tieneContenido = await page.getByText(/Total|Monto|Resumen/i).isVisible().catch(() => false);

    expect(tieneKpis || tieneGraficas || tieneContenido).toBe(true);
  });

  test("muestra sección de KPIs o gráficas", async ({
    authenticatedPage: page,
  }) => {
    test.setTimeout(45000);
    if (page.url().includes("not-branches")) {
      test.skip();
    }
    await page.goto("/analiticas");
    await page.waitForTimeout(2500);

    const tieneCard = await page.locator('[class*="card"]').first().isVisible().catch(() => false);
    const tieneNumero = await page.getByText(/\$|ARS|\d{1,3}(,\d{3})*/).isVisible().catch(() => false);

    expect(tieneCard || tieneNumero).toBe(true);
  });
});
