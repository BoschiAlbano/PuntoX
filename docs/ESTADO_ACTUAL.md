# 📍 Estado Actual del Proyecto — PuntoX

**Última actualización:** Febrero 2026 / Actual  
**Versión:** `0.1.0` (Pre-producción avanzada)  
**Calificación general:** 🟢 **9.0 / 10**

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
| **Base de Datos** | PostgreSQL (Supabase) + Prisma ORM | `6.14.0` | 🟢 50+ modelos, índices y soft deletes |
| **Autenticación** | Supabase Auth + JWT + TOTP (2FA) | `@supabase/ssr 0.8` | 🟢 Sesiones seguras, cookies HttpOnly |
| **Facturación Fiscal** | ARCA / AFIP WSFE SDK | `@arcasdk/core 1.3.1` | 🟢 Facturas A/B/C y Notas de Crédito A/B/C |
| **Validaciones** | Zod | `4.1.13` | 🟢 Schemas en todos los endpoints clave |
| **Testing** | Vitest + Playwright | `Vitest 4` / `Playwright 1.58` | 🟢 Suite unitaria + 14 fases E2E |

---

## 2. Matriz de Estado por Módulo

| Módulo | Documentación | Estado | Funcionalidades Clave |
|---|---|---|---|
| 🛒 **Ventas y POS** | [modules/ventas.md](modules/ventas.md) | 🟢 **100%** | Carrito rápido, atajos de teclado, descuentos, cálculo de IVA, múltiples formas de pago simultáneas, numeración correlativa por punto de venta. |
| 👥 **Clientes** | [modules/clientes.md](modules/clientes.md) | 🟢 **100%** | CRUD con `GenericCrud`, cascada de localidades/provincias, cuenta corriente, límites de crédito, registro de cobros e imputación de saldos. |
| 🚚 **Proveedores** | [modules/proveedores.md](modules/proveedores.md) | 🟢 **100%** | Directorio de proveedores, CUIT validado, cuenta corriente de compras a plazo y registro de pagos. |
| 📦 **Compras** | [modules/compras.md](modules/compras.md) | 🟢 **100%** | Recepción de mercaderías, incremento de stock por sucursal, actualización automática de costos y recalculo de listas de precios. |
| 💰 **Caja y Gastos** | [modules/caja.md](modules/caja.md) | 🟢 **100%** | Apertura/cierre por sucursal, arqueo físico vs. teórico, desglose por medio de pago, cálculo de ganancias y gastos clasificados por conceptos. |
| 🏷️ **Catálogo y Stock** | [productos/README.md](productos/README.md) | 🟢 **95%** | Artículos, marcas, rubros, unidades de medida, stock por sucursal (`ArticuloStock`), optimización WebP y catálogo compartido por código de barras. |
| 🏢 **Multi-Sucursal** | [multi-sucursal/README.md](multi-sucursal/README.md) | 🟢 **100%** | Aislamiento por sucursal, selector de sucursal activa en topbar, cajas independientes y asignación de empleados por sucursal. |
| ⚡ **Facturación AFIP/ARCA** | [modules/facturacion-afip.md](modules/facturacion-afip.md) | 🟢 **95%** | Facturas A/B/C, Notas de Crédito A/B/C con comprobante asociado, obtención de CAE, reintentos en lote (`bulk-reprocesar`) y gating por plan. |
| 🔐 **Auth & Seguridad** | [modules/autenticacion.md](modules/autenticacion.md) | 🟢 **95%** | Supabase Auth, login/registro, 2FA con TOTP y códigos de backup, dispositivos confiables, CSRF tokens y auditoría administrativa. |
| 🛡️ **Permisos y Roles** | [modules/permisos.md](modules/permisos.md) | 🟢 **100%** | `requirePermiso()` en backend, matriz de permisos granulares por módulo, rol SuperAdmin, Administrador y Empleado. |
| 👔 **Empleados & Auditoría** | [modules/empleados-roles.md](modules/empleados-roles.md) | 🟢 **100%** | CRUD de empleados, vinculación a cuentas de usuario, asignación de roles y bitácora de auditoría administrativa. |
| ⚙️ **Configuración** | [modules/configuracion.md](modules/configuracion.md) | 🟢 **100%** | Perfil comercial, preferencias de venta (stock negativo, venta sin caja), certificados fiscales (.crt/.key), branding y políticas de seguridad. |
| 📊 **Analíticas** | [modules/analiticas.md](modules/analiticas.md) | 🟢 **90%** | Dashboard con KPIs ejecutivos, gráficos de facturación diaria/mensual, alertas de stock y métricas financieras. |
| 💎 **Planes SaaS** | [saas/planes-saas.md](saas/planes-saas.md) | 🟡 **85%** | Tiers definidos (Básico, Premium, Ilimitado). Helper de validación `PlanFeatures` implementado, pendiente completar enforcement en todas las UI de creación. |
| 🔔 **Notificaciones** | [features/notificaciones.md](features/notificaciones.md) | 🟢 **100%** | Polling liviano, alertas de stock bajo y límites de crédito con auto-resolución al corregir condición. |

---

## 3. Estado de la Suite de Pruebas

### Pruebas Unitarias y de Integración (Vitest)
- **Suite**: 19+ archivos de test en `src/test/`.
- **Áreas Cubiertas**:
  - Validaciones de schemas Zod (Caja, Gastos, Comprobantes, Clientes, Productos, Proveedores).
  - Cálculo de precios, IVA, totales y balances de cuentas corrientes.
  - Lógica de permisos y middleware de autenticación.
  - Formateadores y utilidades de serialización BigInt.

### Pruebas E2E de Viaje de Usuario (Playwright)
- **Matriz de Cobertura**: 14 fases documentadas en [`e2e/journey/README.md`](../e2e/journey/README.md).
- **Fases Completadas (Smoke & Core)**:
  - Fase 0: Setup y creación de Tenant E2E vía panel SuperAdmin.
  - Fase 1: Autenticación completa y control de sesiones.
  - Fase 2: Onboarding y configuración de tienda.
  - Fase 3: Maestros (Marcas, Rubros, Unidades, Listas de Precios).
  - Fase 4: Catálogo de Productos y Stock.
- **Fases en Curso**: Clientes, Proveedores, Caja, Ventas, Compras, Sucursales, Analytics y Viaje Completo.

---

## 4. Arquitectura y Patrones del Código

1. **Patrón CRUD Genérico**:
   - `GenericCrud` + `GenericTable` orquesta el 90% de las pantallas maestras.
   - Soporta búsqueda debounced del lado del servidor, filtros combinados, exportación CSV/XLS y acciones masivas (`BulkSelectionContext`).
2. **Manejo de Errores Unificado**:
   - Helper `handleError()` en `src/lib/errors/handler.ts` normaliza errores de Zod, Prisma, Auth y llamadas externas en respuestas JSON estandarizadas.
3. **Manejo Seguro de Identificadores y Multi-Tenancy**:
   - Validación estricta de `tenantId` en `getAuthContext()`. Sin fallbacks inseguros.
   - IDs representados como `BigInt` en Prisma, serializados a string/number en los adaptadores.
4. **Optimización de Peticiones y Caching**:
   - React Query configurado con `staleTime: 60s` para datos operativos y `5m` para tablas maestras.
   - Mutaciones invalidan selectivamente las query keys afectadas.

---

## 5. Próximas Tareas Prioritarias

1. **Gating de Planes SaaS**: Completar el bloqueo visual y en API cuando un comercio supera el límite de sucursales, usuarios o productos de su plan ([saas/planes-saas-implementacion.md](saas/planes-saas-implementacion.md)).
2. **Búsqueda en Pestañas POS**: Integrar el modo alternado de pestaña "Carrito" / "Buscar productos" en `VentasScreen` ([features/ventas-busqueda-tabs.md](features/ventas-busqueda-tabs.md)).
3. **Completar Fases E2E restantes**: Continuar la ejecución de los specs de viaje de usuario (Caja, Ventas, Cuentas Corrientes).
