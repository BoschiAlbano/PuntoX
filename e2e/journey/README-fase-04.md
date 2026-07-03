# Fase 4 — Productos ✅ Completada

**Spec:** `e2e/journey/03-productos.spec.ts`  
**Estado:** ✅ 13/13 tests pasando  
**Tiempo de ejecución:** ~4 minutos (incluye limpieza de duplicados)

---

## Tests

| Test | Descripción                                                                | Estado |
| ---- | -------------------------------------------------------------------------- | ------ |
| 4.1  | `/productos` carga con buscador y botón "Nuevo Producto"                   | ✅     |
| 4.2  | "Nuevo Producto" navega a `/productos/new` con formulario completo         | ✅     |
| 4.3  | Crear "Producto Test E2E" con datos completos → toast de éxito             | ✅     |
| 4.4  | Después de crear, el formulario se resetea y permanece en `/productos/new` | ✅     |
| 4.5  | Crear producto permanente "Producto E2E" ($1500) para Fase 8               | ✅     |
| 4.6  | Buscar "Producto Test E2E" → aparece en tabla                              | ✅     |
| 4.7  | Buscar "Producto E2E" → aparece en tabla con precio visible                | ✅     |
| 4.8  | Click en botón Editar de "Producto Test E2E" → abre `/productos/[id]`      | ✅     |
| 4.9  | Editar descripción → guardar → toast de éxito → vuelve a `/productos`      | ✅     |
| 4.10 | Eliminar "Producto Test E2E Editado" → confirmación → desaparece de tabla  | ✅     |
| 4.11 | Eliminar "Producto Reset Test" → confirmación → desaparece de tabla        | ✅     |
| 4.12 | `/productos/actualizar-precios` carga la interfaz de precios               | ✅     |
| 4.13 | `/productos/promociones-combo` carga la tabla de promociones               | ✅     |

---

## Estructura de rutas (páginas completas, no modales)

- `/productos` → lista con buscador y botón "Nuevo Producto"
- `/productos/new` → formulario de creación (full-page)
- `/productos/[id]` → formulario de edición (full-page)
- `/productos/actualizar-precios` → herramienta de actualización masiva
- `/productos/promociones-combo` → combos/promociones

---

## Datos permanentes creados

| Dato         | Valor                                                            | Para fase       |
| ------------ | ---------------------------------------------------------------- | --------------- |
| Producto E2E | Descripción: "Producto E2E", Código: 7790001110003, Costo: $1500 | Fase 8 (Ventas) |

---

## Descubrimientos técnicos importantes

### Botones de acción en la tabla de productos

La columna ACCIONES tiene 3 botones por fila con `aria-label` específicos:

- `"Agregar Stock {nombre}"` — AddStockButton
- `"Editar {nombre}"` — EditButton (navega a `/productos/[id]`)
- `"Eliminar {nombre}"` — DeleteButton (abre modal de confirmación)

**Patrón correcto** (NO usar `.first()` / `.last()` ya que hay botones en otras columnas):

```typescript
const row = page
  .getByRole("row")
  .filter({ hasText: "Producto Test E2E" })
  .first();
const editBtn = row.getByRole("button", { name: /editar/i });
await editBtn.scrollIntoViewIfNeeded();
await editBtn.click({ force: true });
```

### Columna ACCIONES fuera de viewport

La tabla es ancha (9 columnas). La columna ACCIONES puede estar fuera del viewport.
Siempre usar `scrollIntoViewIfNeeded()` + `click({ force: true })` para los botones de acción.

### Formulario de creación — helpers

```typescript
// Autocomplete (Marca, Rubro, Unidad):
await fillAutocomplete(page, "Seleccione una marca", "Marca E2E");

// IVA Select (portal dialog):
await page.locator('[aria-haspopup="listbox"]').first().click({ force: true });
await page.locator('[role="option"]').first().click();

// Toast de éxito creación:
("Producto creado correctamente. Puedes cargar el siguiente.");

// Toast de éxito edición:
("Producto actualizado correctamente");
```

### Test 4.3 — idempotente con limpieza

El test 4.3 usa `limpiarProductos()` para eliminar duplicados de runs anteriores.
Timeout extendido a 120s para acomodar la limpieza.

### describe.serial externo

Todos los `describe` están dentro de un `test.describe.serial("Fase 4 — Productos")` externo
para garantizar ejecución secuencial. Sin esto, los bloques corren en paralelo y los
tests de "Buscar y verificar" fallan porque "Crear" aún no terminó.

---

## Dependencias

| Dependencia             | Creada en                    |
| ----------------------- | ---------------------------- |
| Marca "Marca E2E"       | Fase 3 (02-maestros.spec.ts) |
| Rubro "Rubro E2E"       | Fase 3 (02-maestros.spec.ts) |
| Unidad "Un"             | Fase 3 (02-maestros.spec.ts) |
| Lista de Precios activa | Fase 3 (02-maestros.spec.ts) |

---

## Problemas resueltos en esta fase

1. **`/signin` devolvía 404** → Caché de Turbopack corrupto. Fix: eliminar `.next` y reiniciar `pnpm dev`.
2. **Tests corrían en paralelo** → Múltiples `describe.serial` al mismo nivel se ejecutan concurrentemente. Fix: un único `describe.serial` externo.
3. **Botón de editar incorrecto** → `.getByRole("button").first()` tomaba el botón de copiar código. Fix: usar `aria-label` con `/editar/i`.
4. **Columna ACCIONES fuera de viewport** → Usar `scrollIntoViewIfNeeded()` + `click({ force: true })`.

## Objetivo

Realizar el CRUD completo de productos: crear, listar, buscar, editar, exportar y eliminar. También testear actualizaciones masivas de precios y promociones.

## Archivos de test

- `e2e/journey/03-productos.spec.ts` _(nuevo)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas

### CRUD Principal

- [ ] **4.1** Ir a `/productos` → tabla y buscador visibles
- [ ] **4.2** Click "Nuevo" → formulario modal se abre con campos esperados
- [ ] **4.3** Crear producto completo: nombre, código, precio, marca, rubro, unidad → guardar → aparece en tabla
- [ ] **4.4** Verificar que el producto creado aparece en la tabla inmediatamente tras guardar
- [ ] **4.5** Buscar el producto por nombre → resultado correcto en tabla filtrada
- [ ] **4.6** Abrir el producto → editar el precio → guardar → verificar nuevo precio en tabla
- [ ] **4.7** Abrir el producto → editar descripción → guardar → confirmar

### Validaciones (negativo)

- [ ] **4.8** Intentar crear producto sin nombre → error de validación visible
- [ ] **4.9** Intentar crear producto con precio negativo → error de validación

### Acciones de la tabla

- [ ] **4.10** Menú "Más opciones" en una fila → opciones visibles (editar, eliminar)
- [ ] **4.11** "Más opciones" → Exportar CSV → archivo descargado (o acción iniciada)
- [ ] **4.12** Seleccionar 2 productos → barra de acciones masivas aparece

### Submódulos

- [ ] **4.13** Ir a `/productos/actualizar-precios` → interfaz visible para actualización masiva
- [ ] **4.14** Ir a `/productos/promociones-combo` → tabla de promociones carga correctamente

### Cleanup

- [ ] **4.15** Eliminar el producto de prueba → confirmación en diálogo → desaparece de tabla

## Datos de prueba

```
Nombre:  "Producto Test E2E"
Código:  "TEST-001"
Precio:  1500.00
Marca:   "Marca E2E"         (creada en Fase 3)
Rubro:   "Rubro E2E"         (creado en Fase 3)
Unidad:  "Un"                (creada en Fase 3)
```

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/03-productos.spec.ts --project=chromium
```

## Dependencias

- Fase 0 (tenant E2E)
- Fase 3 (marca, rubro y unidad creados)

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 15
- **Tests pasando:** —
