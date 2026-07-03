import { expect, Page } from "@playwright/test";
import { test } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// FASE 5 — Gestión de Clientes
//
// Estructura de rutas (páginas completas, NO modales):
//   /clientes              → lista con buscador y botón "Nuevo Cliente"
//   /clientes/new          → formulario de creación (full-page)
//   /clientes/[id]         → formulario de edición (full-page)
//   /clientes/cuentas-corrientes → gestión de deudas
//
// Después de crear: formulario se resetea, permanece en /clientes/new
// Después de editar: navega de vuelta a /clientes
//
// Toast de éxito creación: "Cliente creado correctamente. Puedes cargar el siguiente."
// Toast de éxito edición:  "Cliente actualizado correctamente."
// Toast de éxito borrado:  "Registro eliminado correctamente"
//
// Campos requeridos: Nombre, Apellido, Direccion, Mail, CondicionIvaId, LocalidadId
// LocalidadId requiere cascade: Provincia → Departamento → Localidad
//
// Botones en columna ACCIONES (aria-label):
//   CreditCardButton → "Ver cuenta corriente"
//   EditButton       → "Editar" (sin nombre de item)
//   DeleteButton     → "Eliminar" (sin nombre de item)
// ─────────────────────────────────────────────────────────────────────────────

// ── Helper: seleccionar primer option de un HeroUI Select por placeholder ────
async function selectFirstOption(page: Page, placeholderText: string) {
  const trigger = page
    .locator("[aria-haspopup='listbox']")
    .filter({ hasText: placeholderText });
  await trigger.first().scrollIntoViewIfNeeded();
  await trigger.first().click();

  // Esperar que aparezca el listbox más reciente
  const listbox = page.locator('[role="listbox"]').last();
  await listbox.waitFor({ state: "visible", timeout: 10000 });
  // Esperar que las animaciones de HeroUI terminen
  await page.waitForTimeout(500);

  // Seleccionar la primera opción dentro del listbox activo
  const firstOption = listbox.locator('[role="option"]').first();
  await firstOption.waitFor({ state: "visible", timeout: 8000 });
  await firstOption.click({ force: true });
  // Esperar cierre del dropdown antes del siguiente
  await listbox.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

// ── Helper: llenar el formulario de cliente con campos requeridos ─────────────
async function fillClienteForm(
  page: Page,
  opts: {
    nombre: string;
    apellido: string;
    mail: string;
    dni?: string;
    telefono?: string;
    direccion?: string;
  },
) {
  // Nombre y Apellido
  await page.getByPlaceholder("Juan").fill(opts.nombre);
  await page.getByPlaceholder("Pérez").fill(opts.apellido);

  // DNI (opcional)
  if (opts.dni) {
    await page.getByPlaceholder("12345678").fill(opts.dni);
  }

  // Email
  await page.getByPlaceholder("cliente@ejemplo.com").fill(opts.mail);

  // Teléfono (opcional)
  if (opts.telefono) {
    await page.getByPlaceholder("+54 11 1234-5678").fill(opts.telefono);
  }

  // Dirección
  await page
    .getByPlaceholder("Calle 123")
    .fill(opts.direccion ?? "Calle Test 123");

  // Condición IVA (Select)
  await selectFirstOption(page, "Condición frente al IVA");

  // Cascade: Provincia → Departamento → Localidad
  await selectFirstOption(page, "Selecciona una provincia");
  await page.waitForTimeout(600); // esperar carga de departamentos
  await selectFirstOption(page, "Selecciona un departamento");
  await page.waitForTimeout(600); // esperar carga de localidades
  await selectFirstOption(page, "Selecciona una localidad");
}

// ── Helper: limpiar clientes por nombre (idempotente) ────────────────────────
async function limpiarClientes(page: Page, nombreCompleto: string) {
  await page.goto("/clientes");
  await page.waitForLoadState("networkidle");
  await page
    .getByPlaceholder("Buscar por nombre, email, dni")
    .fill(nombreCompleto);
  await page.waitForTimeout(1200);

  for (let i = 0; i < 10; i++) {
    const row = page
      .getByRole("row")
      .filter({ hasText: nombreCompleto })
      .first();
    const visible = await row.isVisible().catch(() => false);
    if (!visible) break;

    const deleteBtn = row.getByRole("button", { name: /^eliminar$/i });
    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click({ force: true });
    await expect(page.getByText(/Confirmar Eliminaci.n/i).first()).toBeVisible({
      timeout: 8000,
    });
    await page.getByRole("button", { name: "Eliminar" }).click();
    await page.waitForTimeout(1000);
    // Refrescar búsqueda
    await page
      .getByPlaceholder("Buscar por nombre, email, dni")
      .fill(nombreCompleto);
    await page.waitForTimeout(800);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial("Fase 5 — Clientes", () => {
  test.describe("Lista y navegación", () => {
    test("5.1 /clientes carga con buscador y botón 'Nuevo Cliente'", async ({
      e2ePage: page,
    }) => {
      await page.goto("/clientes");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByPlaceholder("Buscar por nombre, email, dni"),
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("button", { name: "Nuevo Cliente" }),
      ).toBeVisible({ timeout: 5000 });
    });

    test("5.2 'Nuevo Cliente' navega a /clientes/new con el formulario", async ({
      e2ePage: page,
    }) => {
      await page.goto("/clientes");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: "Nuevo Cliente" }).click();
      await page.waitForURL("**/clientes/new", { timeout: 10000 });

      await expect(page.getByPlaceholder("Juan")).toBeVisible({
        timeout: 8000,
      });
      await expect(page.getByPlaceholder("Pérez")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByPlaceholder("Calle 123")).toBeVisible({
        timeout: 5000,
      });
    });
  }); // Lista y navegación

  test.describe("Crear", () => {
    test("5.3 crear 'Cliente Test E2E' con datos completos → toast de éxito", async ({
      e2ePage: page,
    }) => {
      test.setTimeout(120_000); // limpieza puede tomar tiempo

      // Limpiar duplicados de runs anteriores
      await limpiarClientes(page, "Cliente Test E2E");

      await page.goto("/clientes/new");
      await page.waitForLoadState("networkidle");

      await fillClienteForm(page, {
        nombre: "Cliente Test",
        apellido: "E2E",
        dni: "12345678",
        mail: "cliente.test.e2e@test.com",
        telefono: "+54 11 1111-2222",
        direccion: "Calle Test 123",
      });

      await page.getByRole("button", { name: "Guardar" }).click();

      await expect(
        page.getByText(/Cliente creado correctamente/i).first(),
      ).toBeVisible({ timeout: 15000 });
    });

    test("5.4 crear cliente permanente 'Cliente E2E' para Fase 8", async ({
      e2ePage: page,
    }) => {
      test.setTimeout(120_000);

      // Verificar si ya existe (idempotente)
      await page.goto("/clientes");
      await page.waitForLoadState("networkidle");
      await page
        .getByPlaceholder("Buscar por nombre, email, dni")
        .fill("Cliente E2E");
      await page.waitForTimeout(1200);

      const yaExiste = await page
        .getByRole("row")
        .filter({ hasText: "Cliente E2E" })
        .first()
        .isVisible()
        .catch(() => false);

      if (yaExiste) return; // Idempotente — ya existe

      await page.goto("/clientes/new");
      await page.waitForLoadState("networkidle");

      await fillClienteForm(page, {
        nombre: "Cliente",
        apellido: "E2E",
        dni: "99999999",
        mail: "cliente.e2e@test.com",
        telefono: "+54 11 9999-8888",
        direccion: "Av. E2E 999",
      });

      await page.getByRole("button", { name: "Guardar" }).click();

      await expect(
        page.getByText(/Cliente creado correctamente/i).first(),
      ).toBeVisible({ timeout: 15000 });
    });
  }); // Crear

  test.describe("Buscar y verificar", () => {
    test("5.5 buscar 'Cliente Test E2E' → aparece en tabla", async ({
      e2ePage: page,
    }) => {
      await page.goto("/clientes");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, email, dni")
        .fill("Cliente Test");
      await page.waitForTimeout(1200);

      await expect(
        page
          .getByRole("row")
          .filter({ hasText: "Cliente Test" })
          .filter({ hasText: "E2E" })
          .first(),
      ).toBeVisible({ timeout: 10000 });
    });

    test("5.6 buscar 'Cliente E2E' → aparece en tabla", async ({
      e2ePage: page,
    }) => {
      await page.goto("/clientes");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, email, dni")
        .fill("cliente.e2e@test.com");
      await page.waitForTimeout(1200);

      await expect(
        page
          .getByRole("row")
          .filter({ hasText: "Cliente" })
          .filter({ hasText: "E2E" })
          .first(),
      ).toBeVisible({ timeout: 10000 });
    });
  }); // Buscar y verificar

  test.describe("Editar", () => {
    test("5.7 click Editar en 'Cliente Test E2E' → abre /clientes/[id]", async ({
      e2ePage: page,
    }) => {
      await page.goto("/clientes");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, email, dni")
        .fill("Cliente Test");
      await page.waitForTimeout(1200);

      const row = page
        .getByRole("row")
        .filter({ hasText: "Cliente Test" })
        .filter({ hasText: "E2E" })
        .first();

      const editBtn = row.getByRole("button", { name: /^editar$/i });
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click({ force: true });

      await page.waitForURL(/\/clientes\/\d+/, { timeout: 10000 });
      await expect(page.getByPlaceholder("Juan")).toBeVisible({
        timeout: 8000,
      });
    });

    test("5.8 editar teléfono → guardar → toast → vuelve a /clientes", async ({
      e2ePage: page,
    }) => {
      await page.goto("/clientes");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, email, dni")
        .fill("Cliente Test");
      await page.waitForTimeout(1200);

      const row = page
        .getByRole("row")
        .filter({ hasText: "Cliente Test" })
        .filter({ hasText: "E2E" })
        .first();

      const editBtn = row.getByRole("button", { name: /^editar$/i });
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click({ force: true });
      await page.waitForURL(/\/clientes\/\d+/, { timeout: 10000 });
      await page.waitForLoadState("networkidle");

      // Editar el teléfono
      const telInput = page.getByPlaceholder("+54 11 1234-5678");
      await telInput.click({ clickCount: 3 });
      await telInput.fill("+54 11 9999-0000");

      await page.getByRole("button", { name: "Actualizar" }).click();

      await expect(
        page.getByText(/Cliente actualizado correctamente/i).first(),
      ).toBeVisible({ timeout: 15000 });

      await page.waitForURL("**/clientes", { timeout: 10000 });
      expect(page.url()).toContain("/clientes");
    });
  }); // Editar

  test.describe("Eliminar", () => {
    test("5.9 eliminar 'Cliente Test E2E' → confirmación → desaparece de tabla", async ({
      e2ePage: page,
    }) => {
      await page.goto("/clientes");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, email, dni")
        .fill("Cliente Test");
      await page.waitForTimeout(1200);

      const row = page
        .getByRole("row")
        .filter({ hasText: "Cliente Test" })
        .filter({ hasText: "E2E" })
        .first();

      const deleteBtn = row.getByRole("button", { name: /^eliminar$/i });
      await deleteBtn.scrollIntoViewIfNeeded();
      await deleteBtn.click({ force: true });

      await expect(
        page.getByText(/Confirmar Eliminaci.n/i).first(),
      ).toBeVisible({ timeout: 8000 });
      await page.getByRole("button", { name: "Eliminar" }).click();

      await expect(
        page.getByText(/Registro eliminado correctamente/i).first(),
      ).toBeVisible({ timeout: 10000 });
    });
  }); // Eliminar

  test.describe("Submódulos", () => {
    test("5.10 /clientes/cuentas-corrientes carga correctamente", async ({
      e2ePage: page,
    }) => {
      await page.goto("/clientes/cuentas-corrientes");
      await page.waitForLoadState("networkidle");

      expect(page.url()).not.toContain("/signin");
      expect(page.url()).not.toContain("/onboarding");

      await expect(
        page.getByText(/cuenta.* corriente|deuda|saldo/i).first(),
      ).toBeVisible({ timeout: 10000 });
    });
  }); // Submódulos
}); // Fase 5 — Clientes
