# Informe de validaciones insuficientes

Este documento lista **valores inválidos o en el límite** que el sistema acepta cuando no debería (por ejemplo descuento 200% en ventas). Sirve para priorizar correcciones con el equipo. Los tests en `src/test/validation/` ejercitan estos casos; cuando un test **falla** (el schema acepta el valor), el hallazgo se documenta aquí.

---

## 1. Resumen rápido

| Categoría | Cantidad | Detalle |
|-----------|----------|---------|
| **Hallazgos documentados** | 11 | Ver sección 2. |
| **Tests de validación** | `src/test/validation/*.test.ts` | Comprobantes, caja, gastos, cliente, producto, CtaCte, roles, usuario, iva, catalogos. |
| **Tests que fallan (esperado)** | 0 | Todos los hallazgos corregidos. |
| **Objetivo** | Detectar y documentar | No se corrigen en este informe; el equipo prioriza. |

---

## 2. Hallazgos (detalle)

Cada ítem sigue el formato: **Módulo / flujo** → **Campo o acción** → **Valor(es) probados** → **Comportamiento actual** → **Esperado** → **Dónde corregir** → **Prioridad**.

---

### 2.1. Ventas — Descuento en comprobante (porcentaje / monto) — Corregido

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Ventas — Creación de comprobante (venta). |
| **Estado** | **Corregido.** El schema en `comprobantes.ts` incluye refinamiento `descuento <= subtotal`. |

---

### 2.2. Caja — Monto inicial (abrir caja) sin máximo — Corregido

| Campo | Valor |
|-------|--------|
| **Estado** | **Corregido.** `abrirCajaSchema` tiene `.max(MONTO_CAJA_MAX)`. |

---

### 2.3. Caja — Monto de cierre sin máximo — Corregido

| Campo | Valor |
|-------|--------|
| **Estado** | **Corregido.** `cerrarCajaSchema` tiene `.max(MONTO_CAJA_MAX)`. |

---

### 2.4. Gastos — Monto de pago sin máximo — Corregido

| Campo | Valor |
|-------|--------|
| **Estado** | **Corregido.** `createGastoSchema` tiene `.max(999_999_999_999)` en pagos[].monto. |

---

### 2.5. Cliente — MontoMaximoCtaCte sin máximo — Corregido

| Campo | Valor |
|-------|--------|
| **Estado** | **Corregido.** `cliente.schema.ts` tiene `.max(999_999_999_999)` en create y update. |

---

### 2.6. Productos — Precio público negativo — Corregido

| Campo | Valor |
|-------|--------|
| **Módulo / flujo** | Productos — Crear producto. |
| **Estado** | **Corregido.** `producto.schema.ts` tiene `.min(0)` en `PrecioPublico` y `PrecioPublico2` (create y update). |

---

### 2.7. Cta. Cte. Cliente — Monto de pago sin máximo — Corregido

| Campo | Valor |
|-------|--------|
| **Estado** | **Corregido.** `pagoCtaCteSchema` tiene `.max(999_999_999_999)` en monto. |

---

### 2.8. Roles — Nombre de rol sin máximo de longitud — Corregido

| Campo | Valor |
|-------|--------|
| **Estado** | **Corregido.** `rolSchema` tiene `.max(250)` en nombre. |

---

### 2.9. Configuración — Monto máximo retiro de caja sin tope — Corregido

| Campo | Valor |
|-------|--------|
| **Estado** | **Corregido.** `payloadSchema` tiene `.max(999_999_999_999)` en montoMaximoRetiroCaja. |

---

### 2.10. Usuario (empleado) — nombreUsuario sin máximo de longitud — Corregido

| Campo | Valor |
|-------|--------|
| **Estado** | **Corregido.** `createUsuarioSchema` tiene `.max(100)` en nombreUsuario. |

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

- Guía completa (comandos, cobertura, resumen ejecución): [GUIA.md](GUIA.md).
- Plan y principios: [PLAN-TESTING.md](PLAN-TESTING.md).
- Tests que fallan o no se ejecutan: [INFORME-FALLOS.md](INFORME-FALLOS.md).

---

*Última actualización: Febrero 2025.*
