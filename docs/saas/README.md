# 💎 Modelo SaaS y Planes de Suscripción — PuntoX

Este directorio contiene las definiciones de negocio y la arquitectura técnica de los planes de suscripción, límites de uso y feature gating del sistema **PuntoX**.

---

## Documentación de Planes SaaS

| Documento | Descripción |
|---|---|
| 📜 [planes-saas.md](planes-saas.md) | Definición formal de los 3 planes de suscripción (Plan Básico, Plan Premium, Plan Ilimitado), límites de sucursales, usuarios, productos y feature flags |
| 🛠️ [planes-saas-implementacion.md](planes-saas-implementacion.md) | Plan y estado de implementación del enforcement en código: schemas `PlanFeatures`, middleware, helpers en `src/lib/planes/` y validaciones backend/frontend |

---

## Tiers de Suscripción

| Característica | Plan Básico ($25.000) | Plan Premium ($45.000) | Plan Ilimitado ($0 / Admin) |
|---|---|---|---|
| **Sucursales máximas** | 1 | 3 | Sin límite (`null`) |
| **Usuarios/Empleados** | 3 | 10 | Sin límite (`null`) |
| **Artículos en catálogo** | 1.000 | 5.000 | Sin límite (`null`) |
| **Facturación Electrónica AFIP** | ❌ No incluida | ✅ Incluida | ✅ Incluida |
| **Soporte prioritario** | Estándar | ✅ Prioritario | ✅ Total |

---

## Enforcement en Código

- **Definición de Tipos**: `src/lib/planes/features.ts`
- **Helpers de Verificación**:
  - `puedeCrearSucursal(tenant)`
  - `puedeCrearUsuario(tenant)`
  - `puedeCrearArticulo(tenant)`
  - `planIncluyeAFIP(tenant)`
- **Endpoints de SuperAdmin**: `/admin/planes` y `/admin/tenants/[id]` para asignación y control de vencimiento (`FechaVencimiento`).
