# FASE 11 — Sucursales

## Objetivo

Gestionar sucursales del tenant: crear, editar, buscar y eliminar. Verificar la asignación de usuarios a sucursales y el cambio de sucursal activa.

## Archivos de test

- `e2e/journey/10-sucursales.spec.ts` _(nuevo)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas

### CRUD Sucursales (`/sucursales`)

- [ ] **11.1** Ir a `/sucursales` → tabla con "Casa Central" visible (sucursal creada en setup)
- [ ] **11.2** Click "Nueva Sucursal" → modal con campos: Nombre, Dirección, Teléfono
- [ ] **11.3** Crear sucursal `"Sucursal Test E2E"` con dirección → guardar → aparece en tabla
- [ ] **11.4** Buscar `"Sucursal Test E2E"` en buscador → resultado correcto
- [ ] **11.5** Editar la sucursal → cambiar nombre a `"Sucursal E2E Editada"` → guardar → verificar
- [ ] **11.6** Intentar crear sucursal sin nombre → validación visible

### Asignación de usuarios

- [ ] **11.7** Abrir detalle de la sucursal → sección de usuarios asignados visible
- [ ] **11.8** Asignar `"emp_test_e2e"` (de Fase 10) a la sucursal → guardar

### Cambio de sucursal

- [ ] **11.9** Selector de sucursal en el header → cambiar a `"Sucursal E2E Editada"` → sistema usa nueva sucursal
- [ ] **11.10** Volver a `"Casa Central"` como sucursal activa

### Cleanup

- [ ] **11.11** Eliminar la sucursal de prueba → confirmación → desaparece

## Datos de prueba

```
Nombre:    "Sucursal Test E2E"
Dirección: "Av. San Martín 500, Buenos Aires"
Teléfono:  "011-3333-4444"
```

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/10-sucursales.spec.ts --project=chromium
```

## Dependencias

- Fase 10 (empleado "emp_test_e2e" para asignar a la sucursal) — opcional

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 11
- **Tests pasando:** —
