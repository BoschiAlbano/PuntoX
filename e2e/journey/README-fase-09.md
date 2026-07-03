# FASE 9 — Compras (Ingreso de Stock)

## Objetivo

Registrar una compra a un proveedor e ingreso de stock. Verificar que el stock de los productos se actualiza correctamente tras confirmar la compra.

## Archivos de test

- `e2e/journey/08-compras.spec.ts` _(nuevo)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas

### Pantalla de compras (`/compras`)

- [ ] **9.1** Ir a `/compras` → pantalla carga correctamente
- [ ] **9.2** Interfaz de nueva compra visible (formulario o botón "Nueva Compra")

### Flujo de compra

- [ ] **9.3** Iniciar nueva compra → seleccionar `"Proveedor Test E2E"` de la lista
- [ ] **9.4** Agregar `"Producto Test E2E"` con cantidad `10` y costo unitario `$500`
- [ ] **9.5** Verificar que el subtotal/total se calcula correctamente (`10 × $500 = $5000`)
- [ ] **9.6** Confirmar la compra → mensaje de éxito visible

### Validaciones

- [ ] **9.7** Intentar confirmar compra sin proveedor seleccionado → validación visible
- [ ] **9.8** Intentar agregar producto con cantidad 0 → validación visible

## Datos de prueba

```
Proveedor:  "Proveedor Test E2E" (creado en Fase 6)
Producto:   "Producto Test E2E" (creado en Fase 4)
Cantidad:   10 unidades
Costo:      $500 por unidad
Total:      $5000
```

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/08-compras.spec.ts --project=chromium
```

## Dependencias

- Fase 4 (producto "Producto Test E2E" existe)
- Fase 6 (proveedor "Proveedor Test E2E" existe)

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 8
- **Tests pasando:** —
