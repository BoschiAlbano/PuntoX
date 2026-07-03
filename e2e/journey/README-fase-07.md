# FASE 7 — Operación de Caja

## Objetivo

Verificar el ciclo completo de la caja: abrir con monto inicial, registrar gastos, revisar cobros del día y cerrar la caja. Verificar el historial de cajas.

## Archivos de test

- `e2e/journey/06-caja.spec.ts` _(nuevo, extiende el existente)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas

### Apertura de caja

- [ ] **7.1** Ir a `/caja` → verificar estado inicial (abierta o cerrada)
- [ ] **7.2** Si la caja está cerrada: click "Abrir Caja" → modal se abre
- [ ] **7.3** Ingresar monto inicial `$5000` → confirmar → caja queda abierta
- [ ] **7.4** Verificar que tras abrir: botón "Cerrar Caja" visible y "Abrir Caja" desaparece
- [ ] **7.5** Intentar abrir caja con monto inicial vacío → validación visible

### Gastos (`/caja/gastos`)

- [ ] **7.6** Ir a tab "Gastos" o `/caja/gastos` → tabla visible
- [ ] **7.7** Crear gasto: descripción `"Gasto Test E2E"`, monto `$200` → guardar
- [ ] **7.8** Verificar que el gasto aparece en la lista con monto correcto
- [ ] **7.9** Intentar crear gasto sin descripción → validación visible
- [ ] **7.10** Intentar crear gasto con monto 0 o negativo → validación

### Cobros

- [ ] **7.11** Ir a tab "Cobros" → contenido del día visible (puede estar vacío si no hay ventas aún)

### Cierre de caja

- [ ] **7.12** Click "Cerrar Caja" → modal de cierre aparece
- [ ] **7.13** Completar el cierre → confirmar → caja queda cerrada
- [ ] **7.14** Verificar que tras cerrar: botón "Abrir Caja" vuelve a aparecer
- [ ] **7.15** Intentar cerrar caja con monto vacío → validación

### Historial

- [ ] **7.16** Ir a tab "Historial" o lista de cajas → al menos un registro visible

## Datos de prueba

```
Monto inicial de caja: $5000
Gasto: "Gasto Test E2E" / $200
```

> ⚠️ Al terminar esta fase la caja debe quedar **ABIERTA** porque la Fase 8 (Ventas) la necesita.
> El test 7.12-7.14 se puede dividir: cerrar como último paso, o saltear para que Fase 8 pueda vender.

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/06-caja.spec.ts --project=chromium
```

## Dependencias

- Fase 0 (tenant E2E)

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 16
- **Tests pasando:** —
