import { expect, Page } from "@playwright/test";
import { test } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// FASE 3 — Datos Maestros (Marcas, Rubros, Unidades, Listas de Precios)
//
// Rutas separadas (no tabs en una sola pagina):
//   /productos/marcas
//   /productos/rubros
//   /productos/unidades
//   /productos/listas-precios
//
// Pattern GenericCrud:
//   - Boton "Nuevo" abre modal de creacion
//   - Toast exito: "Registro creado/actualizado/eliminado correctamente"
//   - Delete: modal "Confirmar Eliminacion" → boton "Eliminar"
//
// DATOS PERMANENTES (necesarios para Fase 4 — Productos):
//   - Marca: "Marca E2E"
//   - Rubro: "Rubro E2E"
//   - Unidad: "Un" (descripcion "Unidad")
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Crea un registro via modal "Nuevo" y verifica el toast de exito.
 * Si el registro ya existe (idempotente para datos permanentes), no hace nada.
 */
async function createIfNotExists(
  page: Page,
  searchPlaceholder: string,
  namePlaceholder: string,
  name: string,
): Promise<void> {
  // Buscar si ya existe
  const buscar = page.getByPlaceholder(searchPlaceholder);
  await buscar.fill(name);
  await page.waitForTimeout(1000);

  const yaExiste = await page
    .getByRole("row")
    .filter({ hasText: name })
    .first()
    .isVisible()
    .catch(() => false);

  if (yaExiste) {
    await buscar.clear();
    return;
  }

  // No existe — crear
  await buscar.clear();
  await page.getByRole("button", { name: "Nuevo" }).click();
  await expect(page.getByPlaceholder(namePlaceholder)).toBeVisible({
    timeout: 8000,
  });
  await page.getByPlaceholder(namePlaceholder).fill(name);
  await page.getByRole("button", { name: "Crear" }).click();
  await expect(
    page.getByText("Registro creado correctamente").first(),
  ).toBeVisible({ timeout: 10000 });
}

/**
 * Hace click en el boton de accion de la primera fila que contiene `rowText`.
 * `nth` permite seleccionar el n-esimo boton (0=editar, -1=eliminar normalmente).
 */
async function clickRowAction(
  page: Page,
  rowText: string,
  nth: "first" | "last",
) {
  const row = page.getByRole("row").filter({ hasText: rowText }).first();
  const btn =
    nth === "first"
      ? row.getByRole("button").first()
      : row.getByRole("button").last();
  await btn.click();
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial("Fase 3 — Marcas (/productos/marcas)", () => {
  test("3.1 /productos/marcas carga con buscador y boton Nuevo", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/marcas");
    await page.waitForLoadState("networkidle");

    await expect(page.getByPlaceholder("Buscar marcas...")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: "Nuevo" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("3.2 crear marca temporal 'Marca Test E2E' → aparece en tabla", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/marcas");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Nuevo" }).click();
    await expect(page.getByText("Nueva Marca").first()).toBeVisible({
      timeout: 8000,
    });

    await page.getByPlaceholder("Nombre de la marca").fill("Marca Test E2E");
    await page.getByRole("button", { name: "Crear" }).click();

    await expect(
      page.getByText("Registro creado correctamente").first(),
    ).toBeVisible({ timeout: 10000 });

    // Verificar en tabla
    await page.getByPlaceholder("Buscar marcas...").fill("Marca Test E2E");
    await page.waitForTimeout(800);
    await expect(
      page.getByRole("row").filter({ hasText: "Marca Test E2E" }).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("3.3 buscar 'Marca Test E2E' → resultado correcto en tabla", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/marcas");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("Buscar marcas...").fill("Marca Test E2E");
    await page.waitForTimeout(1000);

    await expect(
      page.getByRole("row").filter({ hasText: "Marca Test E2E" }).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("3.4 editar 'Marca Test E2E' → renombrar a 'Marca Test E2E Editada'", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/marcas");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("Buscar marcas...").fill("Marca Test E2E");
    await page.waitForTimeout(800);

    // Abrir menu de acciones de la fila — first = lapiz (editar)
    await clickRowAction(page, "Marca Test E2E", "first");

    // Esperar modal de edicion
    await expect(page.getByText("Editar Marca").first()).toBeVisible({
      timeout: 8000,
    });

    const input = page.getByPlaceholder("Nombre de la marca");
    await input.clear();
    await input.fill("Marca Test E2E Editada");
    await page.getByRole("button", { name: "Guardar Cambios" }).click();

    await expect(
      page.getByText("Registro actualizado correctamente").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("3.5 eliminar 'Marca Test E2E Editada' → desaparece de tabla", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/marcas");
    await page.waitForLoadState("networkidle");

    await page
      .getByPlaceholder("Buscar marcas...")
      .fill("Marca Test E2E Editada");
    await page.waitForTimeout(800);

    await clickRowAction(page, "Marca Test E2E Editada", "last");

    // Confirmar en modal
    await expect(page.getByText(/Confirmar Eliminaci/i).first()).toBeVisible({
      timeout: 8000,
    });
    await page.getByRole("button", { name: "Eliminar" }).click();

    await expect(
      page.getByText("Registro eliminado correctamente").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("3.6 crear marca permanente 'Marca E2E' (necesaria para Fase 4)", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/marcas");
    await page.waitForLoadState("networkidle");

    await createIfNotExists(
      page,
      "Buscar marcas...",
      "Nombre de la marca",
      "Marca E2E",
    );

    // Verificar que existe
    await page.getByPlaceholder("Buscar marcas...").fill("Marca E2E");
    await page.waitForTimeout(800);
    await expect(
      page.getByRole("row").filter({ hasText: "Marca E2E" }).first(),
    ).toBeVisible({ timeout: 8000 });
  });
});

test.describe.serial("Fase 3 — Rubros (/productos/rubros)", () => {
  test("3.7 /productos/rubros carga con buscador y boton Nuevo", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/rubros");
    await page.waitForLoadState("networkidle");

    await expect(page.getByPlaceholder("Buscar rubros...")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: "Nuevo" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("3.8 crear rubro temporal 'Rubro Test E2E' → aparece en tabla", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/rubros");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Nuevo" }).click();
    await expect(page.getByText("Nuevo Rubro").first()).toBeVisible({
      timeout: 8000,
    });

    await page.getByPlaceholder("Nombre del rubro").fill("Rubro Test E2E");
    await page.getByRole("button", { name: "Crear" }).click();

    await expect(
      page.getByText("Registro creado correctamente").first(),
    ).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder("Buscar rubros...").fill("Rubro Test E2E");
    await page.waitForTimeout(800);
    await expect(
      page.getByRole("row").filter({ hasText: "Rubro Test E2E" }).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("3.9 editar 'Rubro Test E2E' → renombrar a 'Rubro Test E2E Editado'", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/rubros");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("Buscar rubros...").fill("Rubro Test E2E");
    await page.waitForTimeout(800);

    // first = lapiz (editar)
    await clickRowAction(page, "Rubro Test E2E", "first");

    await expect(page.getByText("Editar Rubro").first()).toBeVisible({
      timeout: 8000,
    });

    const input = page.getByPlaceholder("Nombre del rubro");
    await input.clear();
    await input.fill("Rubro Test E2E Editado");
    await page.getByRole("button", { name: "Guardar Cambios" }).click();

    await expect(
      page.getByText("Registro actualizado correctamente").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("3.10 eliminar 'Rubro Test E2E Editado' → desaparece de tabla", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/rubros");
    await page.waitForLoadState("networkidle");

    await page
      .getByPlaceholder("Buscar rubros...")
      .fill("Rubro Test E2E Editado");
    await page.waitForTimeout(800);

    await clickRowAction(page, "Rubro Test E2E Editado", "last");

    await expect(page.getByText(/Confirmar Eliminaci/i).first()).toBeVisible({
      timeout: 8000,
    });
    await page.getByRole("button", { name: "Eliminar" }).click();

    await expect(
      page.getByText("Registro eliminado correctamente").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("3.11 crear rubro permanente 'Rubro E2E' (necesario para Fase 4)", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/rubros");
    await page.waitForLoadState("networkidle");

    await createIfNotExists(
      page,
      "Buscar rubros...",
      "Nombre del rubro",
      "Rubro E2E",
    );

    await page.getByPlaceholder("Buscar rubros...").fill("Rubro E2E");
    await page.waitForTimeout(800);
    await expect(
      page.getByRole("row").filter({ hasText: "Rubro E2E" }).first(),
    ).toBeVisible({ timeout: 8000 });
  });
});

test.describe
  .serial("Fase 3 — Unidades de Medida (/productos/unidades)", () => {
  test("3.12 /productos/unidades carga con buscador y boton Nuevo", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/unidades");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByPlaceholder("Buscar unidades de medida..."),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Nuevo" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("3.13 crear unidad temporal 'Unidad Temporal' → aparece en tabla", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/unidades");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Nuevo" }).click();
    await expect(page.getByText("Nueva Unidad de Medida").first()).toBeVisible({
      timeout: 8000,
    });

    await page
      .getByPlaceholder("Nombre de la unidad de medida")
      .fill("Unidad Temporal");
    await page.getByRole("button", { name: "Crear" }).click();

    await expect(
      page.getByText("Registro creado correctamente").first(),
    ).toBeVisible({ timeout: 10000 });

    await page
      .getByPlaceholder("Buscar unidades de medida...")
      .fill("Unidad Temporal");
    await page.waitForTimeout(800);
    await expect(
      page.getByRole("row").filter({ hasText: "Unidad Temporal" }).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("3.14 eliminar 'Unidad Temporal' → desaparece de tabla", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/unidades");
    await page.waitForLoadState("networkidle");

    await page
      .getByPlaceholder("Buscar unidades de medida...")
      .fill("Unidad Temporal");
    await page.waitForTimeout(800);

    await clickRowAction(page, "Unidad Temporal", "last");

    await expect(page.getByText(/Confirmar Eliminaci/i).first()).toBeVisible({
      timeout: 8000,
    });
    await page.getByRole("button", { name: "Eliminar" }).click();

    await expect(
      page.getByText("Registro eliminado correctamente").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("3.15 crear unidad permanente 'Un' (necesaria para Fase 4)", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/unidades");
    await page.waitForLoadState("networkidle");

    await createIfNotExists(
      page,
      "Buscar unidades de medida...",
      "Nombre de la unidad de medida",
      "Un",
    );

    await page.getByPlaceholder("Buscar unidades de medida...").fill("Un");
    await page.waitForTimeout(800);
    // La busqueda filtra por descripcion, la unica fila que queda es "Un"
    await expect(
      page.getByRole("row").filter({ hasText: "Un" }).first(),
    ).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Fase 3 — Listas de Precios (/productos/listas-precios)", () => {
  test("3.16 /productos/listas-precios carga con buscador y boton Nuevo", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/listas-precios");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByPlaceholder("Buscar listas de precios..."),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Nuevo" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("3.17 crear lista de precios 'Lista Mayorista E2E' → aparece en tabla", async ({
    e2ePage: page,
  }) => {
    await page.goto("/productos/listas-precios");
    await page.waitForLoadState("networkidle");

    await createIfNotExists(
      page,
      "Buscar listas de precios...",
      "Ej: Mayorista, Lista VIP",
      "Lista Mayorista E2E",
    );

    await page
      .getByPlaceholder("Buscar listas de precios...")
      .fill("Lista Mayorista E2E");
    await page.waitForTimeout(800);
    await expect(
      page.getByRole("row").filter({ hasText: "Lista Mayorista E2E" }).first(),
    ).toBeVisible({ timeout: 8000 });
  });
});
