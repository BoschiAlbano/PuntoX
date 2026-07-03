import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";
import { E2E_TENANT } from "../fixtures/e2e-tenant";

// ────────────────────────────────────────────────────────────────────────────
// FASE 1 — Autenticación
// Cubre login exitoso, credenciales inválidas, validación de campos y
// estado post-login (sidebar, selector de sucursal).
//
// Los guards de rutas no autenticadas ya están cubiertos en:
//   e2e/guards/redirect-unauth.spec.ts
// ────────────────────────────────────────────────────────────────────────────

test.describe("1 — Autenticación: login exitoso", () => {
  // e2ePage realiza el login antes de que corra el test
  test("1.1 credenciales válidas redirigen a /ventas o /dashboard", async ({
    e2ePage: page,
  }) => {
    expect(page.url()).toMatch(/\/(ventas|dashboard)/);
  });

  test("1.8 sidebar muestra el nombre del usuario logueado", async ({
    e2ePage: page,
  }) => {
    if (page.url().includes("not-branches")) test.skip();

    // El nombre puede aparecer como "Admin E2E", "admin_e2e" o similar
    const usernamePattern = new RegExp(
      `${E2E_TENANT.adminUsername}|${E2E_TENANT.adminNombre}`,
      "i",
    );
    await expect(page.getByText(usernamePattern).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test("1.9 selector de sucursal muestra Casa Central por defecto", async ({
    e2ePage: page,
  }) => {
    if (page.url().includes("not-branches")) test.skip();

    // El selector de sucursal debe mostrar "Casa Central"
    await expect(page.getByText(/casa central/i).first()).toBeVisible({
      timeout: 8000,
    });
  });
});

test.describe("1 — Autenticación: credenciales inválidas", () => {
  test("1.2 contraseña incorrecta muestra mensaje de error", async ({
    page,
  }) => {
    await page.goto("/signin");
    await page.waitForSelector('input[placeholder="juan"]', { timeout: 10000 });

    await page.getByPlaceholder("juan").fill(E2E_TENANT.adminUsername);
    await page.locator('input[type="password"]').fill("contraseña-incorrecta");
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    // Esperar mensaje de error (toast o inline) — Supabase devuelve error de auth
    await expect(
      page
        .getByText(
          /contraseña|credenciales|inválid|incorrect|no encontrado|error/i,
        )
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("1.3 usuario inexistente muestra mensaje de error", async ({ page }) => {
    await page.goto("/signin");
    await page.waitForSelector('input[placeholder="juan"]', { timeout: 10000 });

    await page.getByPlaceholder("juan").fill("usuario_que_no_existe_e2e_xyz");
    await page.locator('input[type="password"]').fill("cualquierClave123");
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    await expect(
      page
        .getByText(
          /usuario|credenciales|inválid|incorrect|no encontrado|error/i,
        )
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("1 — Autenticación: validaciones del formulario", () => {
  test("1.3b campos vacíos: botón deshabilitado o validación al enviar", async ({
    page,
  }) => {
    await page.goto("/signin");
    await page.waitForSelector('input[placeholder="juan"]', { timeout: 10000 });

    const submitBtn = page.getByRole("button", { name: /iniciar sesión/i });

    // Sin rellenar nada — el botón puede estar disabled o al hacer click mostrar error
    const isDisabled = await submitBtn.isDisabled();
    if (isDisabled) {
      // Caso 1: botón deshabilitado cuando los campos están vacíos
      await expect(submitBtn).toBeDisabled();
    } else {
      // Caso 2: click sin datos → validación HTML5 o mensaje de error
      await submitBtn.click();
      // Esperar validación nativa del browser o mensaje de error en pantalla
      const hasError = await page
        .getByText(/requerido|required|vacío|ingresá|completá/i)
        .isVisible()
        .catch(() => false);
      const stillOnSignin = page.url().includes("/signin");
      expect(hasError || stillOnSignin).toBe(true);
    }
  });

  test("1.4 contraseña vacía: no avanza sin password", async ({ page }) => {
    await page.goto("/signin");
    await page.waitForSelector('input[placeholder="juan"]', { timeout: 10000 });

    await page.getByPlaceholder("juan").fill(E2E_TENANT.adminUsername);
    // Dejar contraseña vacía
    const submitBtn = page.getByRole("button", { name: /iniciar sesión/i });
    const isDisabled = await submitBtn.isDisabled();

    if (!isDisabled) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // En cualquier caso, debe seguir en /signin o mostrar error
    const url = page.url();
    expect(url).toMatch(/signin/);
  });
});

test.describe("1 — Autenticación: guards de rutas", () => {
  test("1.5 /productos sin autenticar redirige a /signin", async ({ page }) => {
    await page.goto("/productos");
    await expect(page).toHaveURL(/\/signin/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: /bienvenido/i }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("1.6 /dashboard sin autenticar redirige a /signin", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/signin/, { timeout: 10000 });
  });

  test("1.7 /clientes sin autenticar redirige a /signin", async ({ page }) => {
    await page.goto("/clientes");
    await expect(page).toHaveURL(/\/signin/, { timeout: 10000 });
  });
});
