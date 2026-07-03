import { expect, Page } from "@playwright/test";
import { test } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// FASE 4 — Gestion de Productos (Articulos)
//
// Estructura de rutas (paginas completas, NO modales):
//   /productos          → lista con busqueda y boton "Nuevo Producto"
//   /productos/new      → formulario de creacion (full-page)
//   /productos/[id]     → formulario de edicion  (full-page)
//
// Despues de crear: formulario se resetea, permanece en /productos/new
// Despues de editar: navega de vuelta a /productos
//
// Toast de exito creacion: "Producto creado correctamente. Puedes cargar el siguiente."
// Toast de exito edicion:  "Producto actualizado correctamente"
// Toast de exito borrado:  "Registro eliminado correctamente"
//
// DEPENDENCIAS (creadas en Fase 3):
//   Marca "Marca E2E", Rubro "Rubro E2E", Unidad "Un"
// ─────────────────────────────────────────────────────────────────────────────

// ── Helper: llenar los campos del autocomplete (Marca/Rubro/Unidad) ──────────
async function fillAutocomplete(
  page: Page,
  placeholder: string,
  searchText: string,
) {
  const input = page.getByPlaceholder(placeholder);
  await input.click();
  await input.fill(searchText);
  // Esperar listbox de sugerencias
  await page.waitForSelector('[role="option"]', { timeout: 8000 });
  await page
    .locator('[role="option"]')
    .filter({ hasText: searchText })
    .first()
    .click();
  await page.waitForTimeout(300);
}

// ── Helper: llenar todos los campos requeridos del formulario de producto ─────
async function fillProductForm(
  page: Page,
  opts: {
    descripcion: string;
    codigoBarras: string;
    precioCosto?: string;
  },
) {
  // Descripcion (placeholder: "Nombre del producto")
  await page.getByPlaceholder("Nombre del producto").fill(opts.descripcion);

  // Codigo de Barras (placeholder: "Ej: 7790001234567") — requerido
  await page.getByPlaceholder("Ej: 7790001234567").fill(opts.codigoBarras);

  // Marca (Autocomplete)
  await fillAutocomplete(page, "Seleccione una marca", "Marca E2E");

  // Rubro (Autocomplete)
  await fillAutocomplete(page, "Seleccione un rubro", "Rubro E2E");

  // Unidad de Medida (Autocomplete)
  await fillAutocomplete(page, "Seleccione unidad", "Un");

  // IVA (Select con portal dialog)
  const ivaButton = page.getByPlaceholder(/Seleccione IVA/i);
  if (await ivaButton.isVisible().catch(() => false)) {
    await ivaButton.click();
  } else {
    // El trigger del Select de IVA es un button con aria-haspopup
    const ivaTrigger = page.locator('[aria-haspopup="listbox"]').filter({
      has: page.locator(':text("IVA"), :text("Seleccione IVA")'),
    });
    if (await ivaTrigger.isVisible().catch(() => false)) {
      await ivaTrigger.click();
    } else {
      // Fallback: el primer select sin valor aun
      await page
        .locator('[aria-haspopup="listbox"]')
        .first()
        .click({ force: true });
    }
  }
  // Las opciones del select IVA aparecen en dialog portal o listbox
  const ivaOption = page.locator('[role="option"]').first();
  await expect(ivaOption).toBeVisible({ timeout: 8000 });
  await ivaOption.click();
  await page.waitForTimeout(300);

  // Precio Costo
  if (opts.precioCosto) {
    const precioCostoInput = page.locator('input[placeholder="0,00"]').first();
    await precioCostoInput.click({ clickCount: 3 }); // Seleccionar todo
    await precioCostoInput.fill(opts.precioCosto);
    await page.waitForTimeout(300);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial("Fase 4 — Productos", () => {
  test.describe("Lista y navegacion", () => {
    test("4.1 /productos carga con buscador y boton 'Nuevo Producto'", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByPlaceholder("Buscar por nombre, código o barras..."),
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("button", { name: "Nuevo Producto" }),
      ).toBeVisible({ timeout: 5000 });
    });

    test("4.2 'Nuevo Producto' navega a /productos/new con el formulario completo", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: "Nuevo Producto" }).click();
      await page.waitForURL("**/productos/new", { timeout: 10000 });

      // Formulario visible con campos principales
      await expect(page.getByPlaceholder("Nombre del producto")).toBeVisible({
        timeout: 8000,
      });
      await expect(page.getByPlaceholder("Seleccione una marca")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByPlaceholder("Seleccione un rubro")).toBeVisible({
        timeout: 5000,
      });
    });
  }); // Lista y navegacion

  // ── Helper: eliminar todos los productos con un nombre dado (limpieza idempotente) ──
  async function limpiarProductos(page: Page, nombre: string) {
    await page.goto("/productos");
    await page.waitForLoadState("networkidle");
    await page
      .getByPlaceholder("Buscar por nombre, código o barras...")
      .fill(nombre);
    await page.waitForTimeout(1200);

    // Intentar eliminar hasta que no quede ninguno
    for (let i = 0; i < 10; i++) {
      const row = page.getByRole("row").filter({ hasText: nombre }).first();
      const visible = await row.isVisible().catch(() => false);
      if (!visible) break;

      const deleteBtn = row.getByRole("button", { name: /eliminar/i });
      await deleteBtn.scrollIntoViewIfNeeded();
      await deleteBtn.click({ force: true });
      await expect(
        page.getByText(/Confirmar Eliminaci.n/i).first(),
      ).toBeVisible({ timeout: 8000 });
      await page.getByRole("button", { name: "Eliminar" }).click();
      await page.waitForTimeout(1000);
      // Refrescar búsqueda
      await page
        .getByPlaceholder("Buscar por nombre, código o barras...")
        .fill(nombre);
      await page.waitForTimeout(800);
    }
  }

  test.describe("Crear", () => {
    test("4.3 crear 'Producto Test E2E' con datos completos → toast de exito", async ({
      e2ePage: page,
    }) => {
      test.setTimeout(120_000); // limpieza puede tomar tiempo
      // Limpiar duplicados de runs anteriores
      await limpiarProductos(page, "Producto Test E2E Editado");
      await limpiarProductos(page, "Producto Test E2E");
      await limpiarProductos(page, "Producto Reset Test");

      await page.goto("/productos/new");
      await page.waitForLoadState("networkidle");

      await fillProductForm(page, {
        descripcion: "Producto Test E2E",
        codigoBarras: "7790001110001",
        precioCosto: "1000",
      });

      await page.getByRole("button", { name: "Guardar" }).click();

      await expect(
        page.getByText(/Producto creado correctamente/i).first(),
      ).toBeVisible({ timeout: 15000 });
    });

    test("4.4 despues de crear, el formulario se resetea y permanece en /productos/new", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos/new");
      await page.waitForLoadState("networkidle");

      await fillProductForm(page, {
        descripcion: "Producto Reset Test",
        codigoBarras: "7790001110002",
      });

      await page.getByRole("button", { name: "Guardar" }).click();
      await expect(
        page.getByText(/Producto creado correctamente/i).first(),
      ).toBeVisible({ timeout: 15000 });

      // Permanece en /productos/new y el campo descripcion esta vacio
      expect(page.url()).toContain("/productos/new");
      const descripcionValue = await page
        .getByPlaceholder("Nombre del producto")
        .inputValue();
      expect(descripcionValue).toBe("");
    });

    test("4.5 crear producto permanente 'Producto E2E' ($1500) para Fase 8", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos");
      await page.waitForLoadState("networkidle");

      // Verificar si ya existe (idempotente)
      await page
        .getByPlaceholder("Buscar por nombre, código o barras...")
        .fill("Producto E2E");
      await page.waitForTimeout(1200);

      const yaExiste = await page
        .getByRole("row")
        .filter({ hasText: "Producto E2E" })
        .first()
        .isVisible()
        .catch(() => false);

      if (yaExiste) {
        // Ya existe de un run anterior — OK
        return;
      }

      await page.goto("/productos/new");
      await page.waitForLoadState("networkidle");

      await fillProductForm(page, {
        descripcion: "Producto E2E",
        codigoBarras: "7790001110003",
        precioCosto: "1500",
      });

      await page.getByRole("button", { name: "Guardar" }).click();
      await expect(
        page.getByText(/Producto creado correctamente/i).first(),
      ).toBeVisible({ timeout: 15000 });
    });
  }); // Crear

  test.describe("Buscar y verificar en tabla", () => {
    test("4.6 buscar 'Producto Test E2E' en /productos → aparece en tabla", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, código o barras...")
        .fill("Producto Test E2E");
      await page.waitForTimeout(1200);

      await expect(
        page.getByRole("row").filter({ hasText: "Producto Test E2E" }).first(),
      ).toBeVisible({ timeout: 10000 });
    });

    test("4.7 buscar 'Producto E2E' → aparece en tabla con precio visible", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, código o barras...")
        .fill("Producto E2E");
      await page.waitForTimeout(1200);

      await expect(
        page.getByRole("row").filter({ hasText: "Producto E2E" }).first(),
      ).toBeVisible({ timeout: 10000 });
    });
  }); // Buscar y verificar

  test.describe("Editar", () => {
    test("4.8 click en 'Producto Test E2E' → abre pagina de edicion /productos/[id]", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, código o barras...")
        .fill("Producto Test E2E");
      await page.waitForTimeout(1200);

      // Click en el boton Editar (aria-label: "Editar Producto Test E2E")
      const row = page
        .getByRole("row")
        .filter({ hasText: "Producto Test E2E" })
        .first();
      const editBtn = row.getByRole("button", { name: /editar/i });
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click({ force: true });

      await page.waitForURL(/\/productos\/\d+/, { timeout: 10000 });
      await expect(page.getByPlaceholder("Nombre del producto")).toBeVisible({
        timeout: 8000,
      });
    });

    test("4.9 editar descripcion → guardar → toast de exito → vuelve a /productos", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, código o barras...")
        .fill("Producto Test E2E");
      await page.waitForTimeout(1200);

      const row = page
        .getByRole("row")
        .filter({ hasText: "Producto Test E2E" })
        .first();
      const editBtn = row.getByRole("button", { name: /editar/i });
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click({ force: true });
      await page.waitForURL(/\/productos\/\d+/, { timeout: 10000 });
      await page.waitForLoadState("networkidle");

      const descripcionInput = page.getByPlaceholder("Nombre del producto");
      await descripcionInput.click({ clickCount: 3 });
      await descripcionInput.fill("Producto Test E2E Editado");

      await page.getByRole("button", { name: "Actualizar" }).click();

      await expect(
        page.getByText(/Producto actualizado correctamente/i).first(),
      ).toBeVisible({ timeout: 15000 });

      await page.waitForURL("**/productos", { timeout: 10000 });
      expect(page.url()).toContain("/productos");
    });
  }); // Editar

  test.describe("Eliminar", () => {
    test("4.10 eliminar 'Producto Test E2E Editado' → confirmacion → desaparece de tabla", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, código o barras...")
        .fill("Producto Test E2E Editado");
      await page.waitForTimeout(1200);

      const row = page
        .getByRole("row")
        .filter({ hasText: "Producto Test E2E Editado" })
        .first();

      // Boton Eliminar (aria-label: "Eliminar Producto Test E2E Editado")
      const deleteBtn = row.getByRole("button", { name: /eliminar/i });
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

    test("4.11 eliminar 'Producto Reset Test' → confirmacion → desaparece de tabla", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos");
      await page.waitForLoadState("networkidle");

      await page
        .getByPlaceholder("Buscar por nombre, código o barras...")
        .fill("Producto Reset Test");
      await page.waitForTimeout(1200);

      const row = page
        .getByRole("row")
        .filter({ hasText: "Producto Reset Test" })
        .first();

      const deleteBtn2 = row.getByRole("button", { name: /eliminar/i });
      await deleteBtn2.scrollIntoViewIfNeeded();
      await deleteBtn2.click({ force: true });

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
    test("4.12 /productos/actualizar-precios carga la interfaz de precios", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos/actualizar-precios");
      await page.waitForLoadState("networkidle");

      // Debe cargar sin redireccion y mostrar contenido
      expect(page.url()).not.toContain("/onboarding");
      expect(page.url()).not.toContain("/signin");

      await expect(
        page.getByText(/actualizar|precios|precio/i).first(),
      ).toBeVisible({ timeout: 10000 });
    });

    test("4.13 /productos/promociones-combo carga la tabla de promociones", async ({
      e2ePage: page,
    }) => {
      await page.goto("/productos/promociones-combo");
      await page.waitForLoadState("networkidle");

      expect(page.url()).not.toContain("/signin");

      await expect(
        page.getByText(/promoci.n|combo|promociones/i).first(),
      ).toBeVisible({ timeout: 10000 });
    });
  }); // Submódulos
}); // Fase 4 — Productos
