# 💎 Modelo SaaS y Planes de Suscripción — PuntoX

Este directorio contiene las definiciones de negocio y la arquitectura técnica de los planes de suscripción, límites de uso y feature gating del sistema **PuntoX**.

---

## Documentación de Planes SaaS

| Documento | Descripción |
|---|---|
| 📜 [planes-saas.md](planes-saas.md) | Definición de los planes de suscripción (Básico, Intermedio, Pro e Ilimitado interno), límites de sucursales, usuarios, artículos y ARCA |
| 🛠️ [planes-saas-implementacion.md](planes-saas-implementacion.md) | Plan y estado de implementación del enforcement en código: schemas `PlanFeatures`, middleware, helpers en `src/lib/planes/` y validaciones backend/frontend |

---

## Tiers de Suscripción

| Plan | Precio (ejemplo) | Sucursales | Usuarios | Artículos | ARCA | Para quién |
|---|---|---|---|---|---|---|
| Plan Básico | $25.000 | 1 | 3 | 1.000 | ✅ | Negocio chico, una sucursal |
| Plan Intermedio | $40.000 | 1 | 8 | 5.000 | ✅ | Negocio más grande, una sucursal |
| Plan Pro | $60.000 | Sin límite | Sin límite | Sin límite | ✅ | Varias sucursales |
| Plan Ilimitado | $0 | Sin límite | Sin límite | Sin límite | ✅ | Uso interno (administración) |

Precios de ejemplo (vigente desde 27/11/2026). Los usuarios incluyen al dueño o administrador.

---

## Enforcement en Código

- **Definición de Tipos**: `src/lib/planes/features.ts`
- **Servidor** (`src/lib/planes/features.ts`):
  - `assertDentroDeLimite(tenantId, "sucursales" | "usuarios" | "articulos")` — 403 al superar el límite (POST de sucursales, empleados y productos/combos).
  - `notificarSiAlcanzoLimite(...)` — aviso in-app a los administradores al llegar al máximo.
  - `planIncluyeAFIP(tenantId)` — emisión y reproceso de comprobantes ARCA.
  - `parsePlanFeatures` / `serializarPlanFeatures` — JSON de `PlanSaaS.Caracteristicas`.
- **Cliente**: `usePlanFeatures()` (`puedeCrearSucursal`, `puedeCrearUsuario`, `puedeCrearArticulo`, `tieneAFIP`) para desactivar botones.
- **Validación de planes**: `src/lib/validations/planSaas.schema.ts` (Zod) en `/api/admin/planes`.
- **Endpoints de SuperAdmin**: `/admin/planes` y `/admin/tenants/[id]` para asignación y control de vencimiento (`FechaVencimiento`).
