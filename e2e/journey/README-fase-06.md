# FASE 6 — Gestión de Proveedores

## Objetivo

Realizar el CRUD completo de proveedores y verificar el módulo de cuentas corrientes de proveedores.

## Archivos de test

- `e2e/journey/05-proveedores.spec.ts` _(nuevo)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas

### CRUD Proveedores (`/proveedores`)

- [ ] **6.1** Ir a `/proveedores` → tabla y buscador visibles
- [ ] **6.2** Click "Nuevo" → modal con campos: Nombre, CUIT, Email, Teléfono, Dirección
- [ ] **6.3** Crear proveedor completo → guardar → aparece en tabla
- [ ] **6.4** Buscar el proveedor por nombre → resultado correcto
- [ ] **6.5** Editar teléfono del proveedor → guardar → verificar cambio en tabla
- [ ] **6.6** Intentar crear proveedor sin nombre → error de validación visible
- [ ] **6.7** Menú "Más opciones" en fila → opciones visibles

### Cuentas Corrientes (`/proveedores/cuentas-corrientes`)

- [ ] **6.8** Ir a `/proveedores/cuentas-corrientes` → tabla carga correctamente
- [ ] **6.9** Verificar que el proveedor creado puede tener cuenta corriente

### Cleanup

- [ ] **6.10** Eliminar el proveedor de prueba → confirmación → desaparece de tabla

## Datos de prueba

```
Nombre:    "Proveedor Test E2E"
CUIT:      "30-99887766-5"
Email:     "proveedor.test@e2e.com"
Teléfono:  "011-4444-5555"
Dirección: "Av. Corrientes 1234, CABA"
```

> El proveedor creado debe **quedar sin eliminar** — lo usa la Fase 9 (Compras).

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/05-proveedores.spec.ts --project=chromium
```

## Dependencias

- Fase 0 (tenant E2E)

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 10
- **Tests pasando:** —
