# Informe de validaciones insuficientes

Este documento lista **valores inválidos o en el límite** que el sistema acepta cuando no debería (por ejemplo descuento 200% en ventas). Sirve para priorizar correcciones con el equipo. Los tests en `src/test/validation/` ejercitan estos casos; cuando un test **falla** (el schema acepta el valor), el hallazgo se documenta aquí.

---

## 1. Resumen rápido

| Categoría | Cantidad | Detalle |
|-----------|----------|---------|
| **Hallazgos documentados** | 11 | Ver sección 2. |
| **Tests de validación** | `src/test/validation/*.test.ts` | Comprobantes, caja, gastos, cliente, producto, CtaCte, roles, usuario, iva, catalogos. |
| **Tests que fallan (esperado)** | 10 | Hasta que se añadan las validaciones; ver [Cómo usar](#3-cómo-usar-este-informe). |
| **Objetivo** | Detectar y documentar | No se corrigen en este informe; el equipo prioriza. |

---

## 2. Hallazgos (detalle)

Cada ítem sigue el formato: **Módulo / flujo** → **Campo o acción** → **Valor(es) probados** → **Comportamiento actual** → **Esperado** → **Dónde corregir** → **Prioridad**.

---

### 2.1. Ventas — Descuento en comprobante (porcentaje / monto)

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Ventas — Creación de comprobante (venta). |
| **Campo o acción** | Descuento: en UI es porcentaje (input sin límite); en API se envía como monto `descuento = subtotal * (porcentaje/100)`. |
| **Valor(es) probados** | Porcentaje 200% (o monto de descuento mayor que el subtotal). |
| **Comportamiento actual** | El schema Zod acepta `descuento` con solo `.nonnegative()` (sin máximo). La UI permite cualquier número. Con 200% el total pasa a negativo. |
| **Comportamiento esperado** | Rechazar porcentaje &gt; 100% en UI; en backend rechazar `descuento` cuando sea mayor que el subtotal (o validar porcentaje 0–100 si se envía porcentaje). |
| **Dónde corregir** | `src/lib/services/comprobantes.ts`: añadir validación (p. ej. refinamiento que exija `descuento <= subtotal` o schema de porcentaje 0–100). `src/components/ventas/VentaFooter.tsx`: input con `min={0}` y `max={100}` (y/o validación al enviar). |
| **Prioridad** | **Alta** |

---

### 2.2. Caja — Monto inicial (abrir caja) sin máximo

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Caja — Apertura de caja. |
| **Campo o acción** | `montoInicial` en el schema de abrir caja. |
| **Valor(es) probados** | `1e12` (monto muy alto). |
| **Comportamiento actual** | El schema solo exige `.min(0)`. Acepta cualquier número no negativo. |
| **Comportamiento esperado** | Rechazar montos por encima de un tope razonable (p. ej. según configuración o límite fijo). |
| **Dónde corregir** | `src/app/api/caja/route.ts`: `abrirCajaSchema` — añadir `.max(...)` o refinamiento. |
| **Prioridad** | **Media** |

---

### 2.3. Caja — Monto de cierre sin máximo

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Caja — Cierre de caja. |
| **Campo o acción** | `montoCierre` en el schema de cerrar caja. |
| **Valor(es) probados** | `1e12`. |
| **Comportamiento actual** | Solo `.min(0)`. Acepta cualquier monto no negativo. |
| **Comportamiento esperado** | Rechazar montos excesivos. |
| **Dónde corregir** | `src/app/api/caja/route.ts`: `cerrarCajaSchema` — añadir `.max(...)` o refinamiento. |
| **Prioridad** | **Media** |

---

### 2.4. Gastos — Monto de pago sin máximo

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Gastos — Creación de gasto. |
| **Campo o acción** | `pagos[].monto` en el schema de gasto. |
| **Valor(es) probados** | `1e15`. |
| **Comportamiento actual** | Solo `.min(0.01)`. Acepta montos arbitrariamente grandes. |
| **Comportamiento esperado** | Rechazar montos por encima de un tope (configuración o límite). |
| **Dónde corregir** | `src/app/api/gastos/route.ts`: `createGastoSchema` — en el objeto de pago, añadir `.max(...)` al monto. |
| **Prioridad** | **Media** |

---

### 2.5. Cliente — MontoMaximoCtaCte sin máximo (crear y actualizar)

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Clientes — Crear y actualizar cliente. |
| **Campo o acción** | `MontoMaximoCtaCte` en create y update. |
| **Valor(es) probados** | `1e15`. |
| **Comportamiento actual** | Solo `.min(0)`. Acepta montos arbitrariamente grandes. |
| **Comportamiento esperado** | Rechazar montos por encima de un tope razonable. |
| **Dónde corregir** | `src/lib/validations/cliente.schema.ts`: añadir `.max(...)` a `MontoMaximoCtaCte`. |
| **Prioridad** | **Media** |

---

### 2.6. Productos — Precio público negativo

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Productos — Crear producto. |
| **Campo o acción** | `Precio.PrecioPublico` (y `PrecioPublico2`). |
| **Valor(es) probados** | `-1`. |
| **Comportamiento actual** | El schema usa `.number()` sin `.min(0)`. Acepta precios negativos. |
| **Comportamiento esperado** | Rechazar precios negativos (p. ej. `.min(0)` o `.nonnegative()`). |
| **Dónde corregir** | `src/lib/validations/producto.schema.ts`: en `createProductoSchema` y `updateProductoSchema`, añadir `.min(0)` a `PrecioPublico` y `PrecioPublico2`. |
| **Prioridad** | **Alta** |

---

### 2.7. Cta. Cte. Cliente — Monto de pago sin máximo

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Cuenta corriente cliente — Registrar pago. |
| **Campo o acción** | `monto` en el schema de pago. |
| **Valor(es) probados** | `1e15`. |
| **Comportamiento actual** | Solo `.positive()`. Acepta montos arbitrariamente grandes. |
| **Comportamiento esperado** | Rechazar montos por encima de un tope. |
| **Dónde corregir** | `src/app/api/CtaCteCliente/route.ts`: `pagoCtaCteSchema` — añadir `.max(...)` al monto. |
| **Prioridad** | **Media** |

---

### 2.8. Roles — Nombre de rol sin máximo de longitud

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Empleados — Crear/editar rol. |
| **Campo o acción** | `nombre` en el schema de rol. |
| **Valor(es) probados** | String de 50001 caracteres. |
| **Comportamiento actual** | Solo `.min(1)`. Acepta cadenas de longitud arbitraria (riesgo de overflow en DB o DoS). |
| **Comportamiento esperado** | Rechazar nombres por encima de un máximo (p. ej. 250 caracteres). |
| **Dónde corregir** | `src/app/api/roles/route.ts`: `rolSchema` — añadir `.max(250)` (o el límite del campo en DB) a `nombre`. |
| **Prioridad** | **Media** |

---

### 2.9. Configuración — Monto máximo retiro de caja sin tope

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Configuración — Guardar preferencias (retiro de caja). |
| **Campo o acción** | `montoMaximoRetiroCaja`. |
| **Valor(es) probados** | No testeado por schema (no exportado); revisión manual. |
| **Comportamiento actual** | Solo `.min(0)`. Sin máximo. |
| **Comportamiento esperado** | Rechazar montos excesivos. |
| **Dónde corregir** | `src/app/api/configuracion/route.ts`: `payloadSchema` — añadir `.max(...)` a `montoMaximoRetiroCaja`. |
| **Prioridad** | **Baja** |

---

### 2.10. Usuario (empleado) — nombreUsuario sin máximo de longitud

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Empleados — Crear/editar usuario (schema de validación). |
| **Campo o acción** | `nombreUsuario` en createUsuarioSchema. |
| **Valor(es) probados** | String de 501 caracteres. |
| **Comportamiento actual** | Solo `.min(1)`. Acepta cadenas de longitud arbitraria. |
| **Comportamiento esperado** | Rechazar nombres por encima de un máximo (p. ej. 50 o 100 según límite en DB). |
| **Dónde corregir** | `src/lib/validations/usuario.schema.ts`: añadir `.max(50)` o `.max(100)` a `nombreUsuario`. |
| **Prioridad** | **Media** |

---

## 3. Cómo usar este informe

1. **Ejecutar tests de validación:**  
   `npx vitest run src/test/validation`

2. **Interpretar resultados:**  
   - Si un test **falla** (el schema acepta un valor inválido), ese caso debe estar documentado en la sección 2 y el equipo debe corregir schema/UI.
   - Cuando se corrija, el test debería **pasar** y se puede marcar el ítem como "Corregido (PR #X)" en este informe.

3. **Añadir nuevos ítems:**  
   Mismo formato: módulo, campo, valor probado, actual vs esperado, dónde corregir, prioridad.

---

## 4. Referencias

- Plan: tests de validación y documentación de hallazgos.
- Guía de testing: [GUIA.md](GUIA.md).
- Tests que fallan o no se ejecutan: [INFORME-FALLOS.md](INFORME-FALLOS.md).

---

*Última actualización: Febrero 2025.*
