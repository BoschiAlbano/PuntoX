# FASE 12 — Analytics y Reportes

## Objetivo

Verificar que el dashboard de analytics muestra KPIs, gráficos y métricas correctas. Testear los filtros de fecha y sucursal. Esta fase requiere que ya haya al menos una venta registrada.

## Archivos de test

- `e2e/journey/11-analiticas.spec.ts` _(nuevo)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas

### Dashboard Principal (`/dashboard`)

- [ ] **12.1** Ir a `/dashboard` → página carga sin errores
- [ ] **12.2** Stat cards visibles con valores numéricos (Ventas, Stock, Usuarios, etc.)
- [ ] **12.3** Sección "Top Productos" visible (puede estar vacía si no hay ventas)
- [ ] **12.4** Sección "Métodos de Pago" visible
- [ ] **12.5** Alertas de stock bajo visibles si hay productos con bajo stock

### Analytics (`/analiticas`)

- [ ] **12.6** Ir a `/analiticas` → página carga sin errores JavaScript
- [ ] **12.7** KPIs visibles: al menos "Total Ventas" y "Ticket Promedio"
- [ ] **12.8** Gráfico de ingresos renderizado (elemento `canvas` o `svg` presente)
- [ ] **12.9** Gráfico de métodos de pago visible
- [ ] **12.10** Filtro de fecha "Hoy" → datos se actualizan (o spinner aparece)
- [ ] **12.11** Filtro por sucursal → datos filtrados correctamente
- [ ] **12.12** Si la Fase 8 se ejecutó: KPI "Total Ventas" > 0

## Notas

- Si no hay ventas registradas, los KPIs mostrarán 0 o "sin datos". El test verifica la **estructura** de la página, no los valores exactos.
- Después de la Fase 8 (ventas), los datos deberían reflejarse aquí.

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/11-analiticas.spec.ts --project=chromium
```

## Dependencias

- Fase 0 (tenant E2E)
- Fase 8 (ventas realizadas) — para datos no vacíos

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 12
- **Tests pasando:** —
