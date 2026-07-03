# FASE 13 — Viaje Completo del Usuario (Integration E2E)

## Objetivo

Simular en un solo flujo continuo el día laboral completo de un comerciante usando PuntoX por primera vez. Este test valida la integración de todos los módulos de punta a punta.

## Archivos de test

- `e2e/journey/12-viaje-completo.spec.ts` _(nuevo)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Prerequisitos

> ⚠️ Esta fase asume que las Fases 3-6 ya se ejecutaron y los datos maestros existen.
> Si se corre en un entorno limpio, los pasos de setup están incluidos en el mismo test.

## Tareas — Los 8 pasos del día laboral

### PASO 1: Login y bienvenida

- [ ] **13.1** Login con `admin_e2e` / `E2Etest123!` → redirige a `/ventas`
- [ ] **13.2** Sidebar visible con todos los módulos habilitados

### PASO 2: Configurar la tienda

- [ ] **13.3** Ir a `/configuracion` → completar nombre del negocio y guardar
- [ ] **13.4** Confirmación de guardado visible

### PASO 3: Cargar catálogo (si no existe)

- [ ] **13.5** Verificar que `"Marca E2E"` existe en `/productos` tab Marcas (o crearla)
- [ ] **13.6** Verificar que `"Producto Test E2E"` existe en `/productos` (o crearlo con precio $1500)

### PASO 4: Cargar un cliente (si no existe)

- [ ] **13.7** Verificar que `"Cliente Test E2E"` existe en `/clientes` (o crearlo)

### PASO 5: Abrir la caja

- [ ] **13.8** Ir a `/caja` → verificar estado (si está cerrada, abrirla)
- [ ] **13.9** Caja queda abierta con monto registrado

### PASO 6: Realizar una venta

- [ ] **13.10** Ir a `/ventas` → buscar `"Producto Test E2E"`
- [ ] **13.11** Agregar al carrito con cantidad 2
- [ ] **13.12** Asignar cliente `"Cliente Test E2E"`
- [ ] **13.13** Pago en efectivo con $5000
- [ ] **13.14** Confirmar venta → éxito

### PASO 7: Cerrar la caja

- [ ] **13.15** Ir a `/caja` → cerrar la caja completando el formulario de cierre
- [ ] **13.16** Verificar que la caja quedó cerrada

### PASO 8: Ver resultados

- [ ] **13.17** Ir a `/dashboard` → stat cards actualizadas con datos del día
- [ ] **13.18** Ir a `/analiticas` → gráficos cargados
- [ ] **13.19** Buscar el comprobante generado en `/comprobantes` (si aplica)

## Duración estimada

~5-8 minutos de ejecución (el test más largo de la suite).

## Cómo ejecutar

```bash
# Ejecutar solo esta fase
pnpm test:e2e -- e2e/journey/12-viaje-completo.spec.ts --project=chromium

# Ejecutar toda la suite journey en orden
pnpm test:e2e -- e2e/journey/ --project=chromium
```

## Dependencias

- Fase 0 (tenant E2E creado)
- Incluye verificaciones defensivas para que pueda correr standalone

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 19
- **Tests pasando:** —
