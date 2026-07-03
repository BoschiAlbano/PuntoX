# FASE 8 — Flujo de Venta Completa

## Objetivo

Realizar una venta completa desde la búsqueda del producto hasta la confirmación y generación del comprobante. Probar carrito, descuentos, métodos de pago y validaciones.

## Archivos de test

- `e2e/journey/07-ventas.spec.ts` _(nuevo, extiende el existente)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas

### Acceso e interfaz

- [ ] **8.1** Ir a `/ventas` → barra de búsqueda/escáner visible
- [ ] **8.2** Botón "Confirmar Venta" visible (o equivalente)
- [ ] **8.3** Sección de totales visible (subtotal, total)

### Carrito — Agregar productos

- [ ] **8.4** Buscar `"Producto Test E2E"` → aparece en sugerencias
- [ ] **8.5** Seleccionar el producto → aparece en el carrito con precio $1500
- [ ] **8.6** Aumentar cantidad a 2 → subtotal se actualiza a $3000
- [ ] **8.7** Agregar un segundo producto diferente → carrito muestra 2 ítems
- [ ] **8.8** Eliminar el segundo producto → carrito vuelve a 1 ítem

### Carrito — Cliente y descuentos

- [ ] **8.9** Asignar cliente `"Cliente Test E2E"` a la venta
- [ ] **8.10** Aplicar descuento del 10% → total se recalcula correctamente
- [ ] **8.11** Quitar el descuento → total vuelve al valor original

### Pago y confirmación

- [ ] **8.12** Seleccionar método de pago "Efectivo" → campo de monto aparece
- [ ] **8.13** Ingresar monto `$5000` (mayor al total para probar vuelto)
- [ ] **8.14** Confirmar venta → modal de éxito o redirección a comprobante
- [ ] **8.15** Verificar que se genera un comprobante (número, monto, cliente visible)

### Validaciones

- [ ] **8.16** Intentar confirmar venta con carrito vacío → validación visible

## Datos de prueba

- Producto: `"Producto Test E2E"` a $1500 (creado en Fase 4)
- Cliente: `"Cliente Test E2E"` (creado en Fase 5)
- Pago efectivo: $5000

## Prerrequisitos críticos

> ⚠️ La **caja debe estar abierta** antes de ejecutar esta fase.
> Si la Fase 7 cerró la caja, reabrirla con monto inicial antes de correr estos tests.

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/07-ventas.spec.ts --project=chromium
```

## Dependencias

- Fase 0 (tenant E2E)
- Fase 3 (maestros) → Fase 4 (producto "Producto Test E2E" existe)
- Fase 5 (cliente "Cliente Test E2E" existe)
- Fase 7 (caja abierta)

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 16
- **Tests pasando:** —
