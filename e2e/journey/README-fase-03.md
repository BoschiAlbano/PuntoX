# FASE 3 — Datos Maestros (Marcas, Rubros, Unidades, Listas de Precios)

## Objetivo

Crear y gestionar los datos maestros del catálogo que serán usados como prerrequisitos para crear productos. Estos datos deben existir antes de la Fase 4.

## Archivos de test

- `e2e/journey/02-maestros.spec.ts` _(nuevo)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas

### Marcas (`/productos` → tab "Marcas")

- [ ] **3.1** Tab "Marcas" visible en `/productos`
- [ ] **3.2** Crear marca `"Marca Test E2E"` → guardar → aparece en tabla
- [ ] **3.3** Buscar `"Marca Test E2E"` en buscador → resultado correcto
- [ ] **3.4** Editar marca → cambiar nombre a `"Marca Test E2E Editada"` → guardar → verificar cambio
- [ ] **3.5** Eliminar la marca editada → confirmación → desaparece de tabla

### Rubros (`/productos` → tab "Rubros")

- [ ] **3.6** Tab "Rubros" visible en `/productos`
- [ ] **3.7** Crear rubro `"Rubro Test E2E"` → guardar → aparece en tabla
- [ ] **3.8** Editar rubro → guardar → verificar
- [ ] **3.9** Eliminar rubro de prueba → confirmación

### Unidades de Medida (`/productos` → tab "Unidades")

- [ ] **3.10** Crear unidad `"Unidad"` descripción `"Unidad genérica"` → guardar
- [ ] **3.11** Verificar que la unidad aparece en tabla
- [ ] **3.12** Eliminar unidad de prueba

### Listas de Precios (`/productos/listas-precios`)

- [ ] **3.13** Acceder a `/productos/listas-precios` → tabla visible
- [ ] **3.14** Crear lista `"Lista Mayorista E2E"` con porcentaje → guardar
- [ ] **3.15** Verificar que la lista creada aparece

### Datos que DEBEN quedar creados para la Fase 4

> ⚠️ Estos registros NO se eliminan al final de la fase — los necesita la Fase 4.

- [ ] Marca: `"Marca E2E"` (permanente para productos)
- [ ] Rubro: `"Rubro E2E"` (permanente para productos)
- [ ] Unidad: `"Un"` con descripción `"Unidad"` (permanente para productos)

## Datos de prueba

```
Marca temporal:    "Marca Test E2E" → renombrar/eliminar
Rubro temporal:    "Rubro Test E2E" → renombrar/eliminar
Unidad temporal:   "Temporal" → eliminar

Marca permanente:  "Marca E2E"
Rubro permanente:  "Rubro E2E"
Unidad permanente: "Un" (descripción: "Unidad")
Lista de precios:  "Lista Mayorista E2E"
```

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/02-maestros.spec.ts --project=chromium
```

## Dependencias

- Fase 0 (tenant E2E creado)
- Fase 1 (login funciona)

## Estado

- **Implementación:** ✅ Completada
- **Tests escritos:** 17 / 17
- **Tests pasando:** 17 / 17

## Descubrimientos clave

- Los modales usan `<p>` no `<h2>` para los títulos → usar `getByText()` no `getByRole("heading")`
- El botón ACCIONES por fila: `first` = lápiz (editar), `last` = papelera (borrar)
- Para verificar filas en tabla: usar `getByRole("row").filter({ hasText: name })` no `getByRole("cell")`
- Datos permanentes creados: Marca E2E ✅, Rubro E2E ✅, Un (unidad) ✅, Lista Mayorista E2E ✅
