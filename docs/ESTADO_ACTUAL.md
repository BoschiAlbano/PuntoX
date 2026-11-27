# 📍 Estado Actual del Proyecto — PuntoX

**Última actualización:** 25 de noviembre de 2026 (último commit: `fbbd8d2`, 24/10/2026)
**Versión:** `0.1.0` (Pre-producción avanzada)
**Calificación general:** 🟢 **9.0 / 10**

> Estado verificado contra el código, no solo contra la documentación:
> `npx tsc --noEmit` limpio (exit 0) al 25/11/2026.

---

## 1. Resumen Ejecutivo y Stack

**PuntoX** es una plataforma SaaS multi-tenant y multi-sucursal de gestión comercial y punto de venta (POS / ERP liviano) desarrollada para comercios minoristas y mayoristas. Proporciona aislamiento estricto de datos por tenant, facturación electrónica integrada con ARCA (ex AFIP), control de stock por local físico, cuentas corrientes y analíticas financieras en tiempo real.

| Capa | Tecnología | Versión | Estado |
|---|---|---|---|
| **Framework Web** | Next.js (App Router) | `16.1.6` | 🟢 Moderno y optimizado |
| **Librería UI** | React | `19.1.0` | 🟢 Estable |
| **Componentes** | HeroUI (NextUI) | `2.8.5` | 🟢 Estandarizado con slots y overrides |
| **Estilos & CSS** | TailwindCSS + Vanilla CSS tokens | `v4` | 🟢 Sistema Kinetic Retail Ops |
| **Estado & Caching** | TanStack Query (React Query) + Zustand | `5.90.12` | 🟢 Configurado con staleTime y debounce |
| **Base de Datos** | PostgreSQL (Supabase) + Prisma ORM | `6.14.0` | 🟢 67 modelos, índices y soft deletes |
| **Autenticación** | Supabase Auth + JWT + TOTP (2FA) | `@supabase/ssr 0.8` | 🟢 Sesiones seguras, cookies HttpOnly |
| **Facturación Fiscal** | ARCA / AFIP WSFE SDK | `@arcasdk/core 1.3.1` | 🟢 Facturas A/B/C y Notas de Crédito A/B/C |
| **Validaciones** | Zod | `4.1.13` | 🟢 Schemas en todos los endpoints clave |
| **Testing** | Vitest + Playwright | `Vitest 4` / `Playwright 1.58` | 🟢 Unitarios 596/596; 🟡 E2E 5 de 14 fases |

---

## 2. Matriz de Estado por Módulo

| Módulo | Documentación | Estado | Funcionalidades Clave |
|---|---|---|---|
| 🛒 **Ventas y POS** | [modules/ventas.md](modules/ventas.md) | 🟢 **100%** | Carrito rápido, atajos de teclado, descuentos, cálculo de IVA, múltiples formas de pago simultáneas, numeración correlativa por punto de venta, pestañas "Carrito / Buscar productos" en desktop y mobile. |
| 👥 **Clientes** | [modules/clientes.md](modules/clientes.md) | 🟢 **100%** | CRUD con `GenericCrud`, cascada de localidades/provincias, cuenta corriente, límites de crédito, registro de cobros e imputación de saldos. |
| 🚚 **Proveedores** | [modules/proveedores.md](modules/proveedores.md) | 🟢 **100%** | Directorio de proveedores, CUIT validado, cuenta corriente de compras a plazo y registro de pagos. *(El Portal de Proveedores B2B es una feature aparte, no iniciada — ver §5.)* |
| 📦 **Compras** | [modules/compras.md](modules/compras.md) | 🟢 **100%** | Recepción de mercaderías, búsqueda de productos, incremento de stock por sucursal, actualización automática de costos y recálculo de listas de precios. |
| 💰 **Caja y Gastos** | [modules/caja.md](modules/caja.md) | 🟢 **100%** | Apertura/cierre por sucursal, arqueo físico vs. teórico, desglose por medio de pago, cálculo de ganancias y gastos clasificados por conceptos. |
| 🏷️ **Catálogo y Stock** | [productos/README.md](productos/README.md) | 🟢 **95%** | Artículos, combos, marcas, rubros, unidades de medida, stock por sucursal (`ArticuloStock`), optimización WebP y caché de imágenes compartido por código de barras. |
| 🏢 **Multi-Sucursal** | [multi-sucursal/README.md](multi-sucursal/README.md) | 🟢 **100%** | Aislamiento por sucursal, selector de sucursal activa en topbar, cajas independientes y asignación de empleados por sucursal. |
| ⚡ **Facturación AFIP/ARCA** | [modules/facturacion-afip.md](modules/facturacion-afip.md) | 🟢 **95%** | Facturas A/B/C, Notas de Crédito A/B/C con comprobante asociado, obtención de CAE, reintentos en lote (`bulk-reprocesar`) y gating por plan. **Falta:** Notas de Débito, Factura E y M. |
| 🔐 **Auth & Seguridad** | [modules/autenticacion.md](modules/autenticacion.md) | 🟢 **95%** | Supabase Auth, login/registro, 2FA con TOTP y códigos de backup, dispositivos confiables, CSRF tokens y auditoría administrativa. **Falta:** rate limiting. |
| 🛡️ **Permisos y Roles** | [modules/permisos.md](modules/permisos.md) | 🟢 **100%** | `requirePermiso()` en backend, matriz de permisos granulares por módulo, rol SuperAdmin, Administrador y Empleado. |
| 👔 **Empleados & Auditoría** | [modules/empleados-roles.md](modules/empleados-roles.md) | 🟢 **95%** | CRUD de empleados, vinculación a cuentas de usuario, asignación de roles y bitácora de auditoría. **Falta:** el reenvío de invitación no envía email real (solo audita). |
| ⚙️ **Configuración** | [modules/configuracion.md](modules/configuracion.md) | 🟢 **100%** | Perfil comercial, preferencias de venta (stock negativo, venta sin caja), certificados fiscales (.crt/.key), branding y políticas de seguridad. |
| 📊 **Analíticas** | [modules/analiticas.md](modules/analiticas.md) | 🟢 **90%** | Dashboard con KPIs ejecutivos, gráficos de facturación diaria/mensual, alertas de stock y métricas financieras. |
| 💎 **Planes SaaS** | [saas/planes-saas-implementacion.md](saas/planes-saas-implementacion.md) | 🟢 **95%** | Tiers Básico / Intermedio / Pro (+ Ilimitado interno). Enforcement en API y UI de sucursales, usuarios, artículos/combos y facturación ARCA, verificado contra los datos reales (27/11/2026). Límites editables desde `/admin/planes` con campos validados. **Falta:** prueba manual en la app y definir precios. |
| 🔔 **Notificaciones** | [features/notificaciones.md](features/notificaciones.md) | 🟢 **100%** | Polling liviano, alertas de stock bajo y límites de crédito con auto-resolución al corregir condición. |

---

## 3. Estado de la Suite de Pruebas

### Pruebas Unitarias y de Integración (Vitest)
- **Suite**: 146 archivos `*.test.ts(x)` dentro de `src/` (co-ubicados junto al código y en `src/test/`), 591 tests. Corre completa en ~100 s.
- **Estado (25/11/2026)**: 🟢 **596/596 en verde** (146 archivos).
  - Los tests de API usan el `handleError` real (antes lo mockeaban con un stub que devolvía siempre 500 y ocultaba errores).
  - `next/navigation` está mockeado globalmente en `src/test/setup.ts`; `src/test/render.tsx` provee `renderWithQueryClient()` para componentes que usan React Query.
- **Áreas Cubiertas**:
  - Validaciones de schemas Zod (Caja, Gastos, Comprobantes, Clientes, Productos, Proveedores).
  - Endpoints de API (sucursales, empleados, productos, auth/me, facturación, etc.).
  - Cálculo de precios, IVA, totales y balances de cuentas corrientes.
  - Lógica de permisos, planes (`src/lib/planes/features.test.ts`) y middleware de autenticación.
  - Formateadores y utilidades de serialización BigInt.

### Pruebas E2E de Viaje de Usuario (Playwright)
- **Matriz de Cobertura**: 14 fases documentadas en [`e2e/journey/README.md`](../e2e/journey/README.md).
- **Completadas (5/14)**: Fase 0 Setup SuperAdmin · Fase 1 Autenticación · Fase 2 Onboarding · Fase 3 Maestros · Fase 4 Productos.
- **Pendientes (9/14)**: Clientes, Proveedores, Caja, Ventas, Compras, Empleados y Roles, Sucursales, Analytics y Viaje Completo.

---

## 4. Arquitectura y Patrones del Código

1. **Patrón CRUD Genérico**:
   - `GenericCrud` + `GenericTable` orquesta el 90% de las pantallas maestras.
   - Soporta búsqueda debounced del lado del servidor, filtros combinados, exportación CSV/XLS y acciones masivas (`BulkSelectionContext`).
2. **Manejo de Errores Unificado**:
   - Helper `handleError()` en `src/lib/errors/handler.ts`. Usado en 86 de 94 rutas de API; las 8 restantes son rutas internas de auth, cron y `api/test`.
3. **Manejo Seguro de Identificadores y Multi-Tenancy**:
   - Validación estricta de `tenantId` en `getAuthContext()`. **Sin fallbacks inseguros** (`tenantId || 1` eliminados por completo).
   - Las únicas rutas sin autenticación son catálogos públicos (provincias, localidades, departamentos, condiciones de IVA) y helpers del login.
   - IDs representados como `BigInt` en Prisma, serializados a string/number en los adaptadores.
4. **Optimización de Peticiones y Caching**:
   - React Query configurado con `staleTime: 60s` para datos operativos y `5m` para tablas maestras.
   - Mutaciones invalidan selectivamente las query keys afectadas.

---

## 5. Pendientes

### Funcionalidades nuevas
| Feature | Estado | Documento |
|---|---|---|
| 🏬 **Portal de Proveedores / Marketplace B2B** | 🟡 Spec escrita (SDD), sin código | [features/portal-proveedores-marketplace.md](features/portal-proveedores-marketplace.md) |
| 🧾 **Notas de Débito A/B/C (ARCA)** | 🔴 No iniciado (códigos AFIP ya reservados en `src/lib/constants/afip.ts`) | — |
| 🗑️ **Reset / purga de tienda** (total o desde una fecha) | 🔴 No iniciado | — |
| 🌎 **Factura E / Factura M (ARCA)** | ⚪ Solo si algún cliente lo necesita | — |

### Cabos sueltos
- **Email de invitación a empleados**: `src/app/api/empleados/reenviar-invitacion/route.ts` solo registra auditoría (TODO).
- **Prueba manual de planes**: checklist pendiente en [saas/planes-saas-implementacion.md](saas/planes-saas-implementacion.md).
- **Landing / SEO**: falta `og-image.png` y el handle real de Twitter en `src/app/page.tsx`.

### Calidad e infraestructura
- **E2E**: fases 5 a 13, priorizando Caja y Ventas.
- **Rate limiting**: no implementado; prioridad en `/api/auth/*`.
- Monitoreo (Sentry), logging estructurado y caché distribuido (Redis/Upstash).
- Refactor de pantallas largas (ventas, empleados, configuración).

---

## 6. Próximas Tareas Prioritarias

1. **Cerrar cabos sueltos**: prueba manual de planes + email real de invitación.
2. **Rate limiting en `/api/auth/*`** antes de abrir a más clientes.
3. **E2E de Caja y Ventas** (fases 7 y 8, núcleo del negocio).
4. **Portal de Proveedores**: implementar siguiendo la spec `SPEC-PROV-001`.
