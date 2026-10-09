# 📚 Centro de Documentación — PuntoX

Bienvenido al índice maestro de documentación de **PuntoX**. Esta guía organiza y referencia toda la información técnica, funcional, de arquitectura, diseño y pruebas del sistema para que cualquier desarrollador, usuario o agente de IA pueda entender rápidamente el estado del proyecto y ubicar cualquier recurso.

---

## 🚀 Acceso Rápido y Estado Global

| Documento | Descripción | Estado |
|---|---|---|
| 📍 **[ESTADO_ACTUAL.md](ESTADO_ACTUAL.md)** | **Estado general del sistema**, módulos terminados, pendientes, métricas y tecnologías | 🟢 Actualizado |
| 🏗️ **[ARCHITECTURE.md](ARCHITECTURE.md)** | **Arquitectura técnica**, modelos Prisma, multi-tenancy, flujo de datos y dependencias | 🟢 Completo |
| 🗺️ **[ROADMAP.md](ROADMAP.md)** | **Prioridades de desarrollo**, sprints, mejoras recomendadas y backlog de ideas | 🟢 Activo |
| 📝 **[CHANGELOG.md](CHANGELOG.md)** | **Historial de cambios**, versiones y registros de sesiones | 🟢 Mantenido |
| 🛡️ **[SECURITY.md](SECURITY.md)** | **Políticas de seguridad**, multi-tenant, CSRF tokens, 2FA y manejo de sesiones | 🟢 Estable |
| 🧪 **[TESTING.md](TESTING.md)** | **Estrategia unificada de testing** (Vitest unitarios + 14 fases E2E con Playwright) | 🟢 19+ suites |
| 🤖 **[AGENTS.md](../AGENTS.md)** | **Guía para desarrolladores y Agentes IA** (convenciones, CRUD, hooks y reglas) | 🟢 Esencial |
| 🎨 **[DESIGN.md](../DESIGN.md)** | **Sistema de diseño maestro Kinetic Retail Ops** (colores, tipografía y componentes) | 🟢 Estandarizado |

---

## 📂 Navegación por Categorías

```
docs/
├── modules/           # 📦 Módulos de dominio y lógica de negocio
├── productos/         # 🏷️ Catálogo, control de existencias e imágenes
├── multi-sucursal/    # 🏢 Arquitectura y gestión multi-sucursal
├── ui/                # 🎨 UI, GenericCrud, componentes y tablas HeroUI
├── saas/              # 💎 Planes de suscripción, límites y feature gating
├── features/          # 🚀 Especificaciones técnicas de funcionalidades
├── optimizaciones/    # ⚡ Rendimiento, caching React Query y optimización de Auth
└── testing/           # 🧪 Guías, reportes de validaciones y suites de prueba
```

---

### 1. 📦 Módulos de Negocio ([Ver Índice](modules/README.md))

Documentación técnica y funcional de cada módulo del sistema:

| Módulo | Documento | Alcance y Funcionalidades |
|---|---|---|
| 🛒 **Ventas y POS** | [modules/ventas.md](modules/ventas.md) | Punto de venta rápido, carrito, atajos `Ctrl+K`, múltiples formas de pago, cálculo de IVA y comprobantes. |
| 👥 **Clientes** | [modules/clientes.md](modules/clientes.md) | CRUD de clientes, condición fiscal, cuentas corrientes, límites de crédito y cobranzas FIFO. |
| 🚚 **Proveedores** | [modules/proveedores.md](modules/proveedores.md) | Directorio de proveedores, datos fiscales CUIT, cuentas corrientes y pagos. |
| 📦 **Compras** | [modules/compras.md](modules/compras.md) | Recepción de mercadería, incremento de stock en sucursal, actualización de costos y recalculo de precios de venta. |
| 💰 **Caja y Gastos** | [modules/caja.md](modules/caja.md) | Apertura/cierre de turnos por sucursal, arqueo de fondos, cálculo de ganancias y gastos operativos clasificados por conceptos. |
| ⚡ **Facturación AFIP** | [modules/facturacion-afip.md](modules/facturacion-afip.md) | Facturas A/B/C, Notas de Crédito A/B/C con CAE vía Web Services ARCA, gestión de certificados y reprocesamiento en lote. |
| 🔐 **Autenticación & 2FA** | [modules/autenticacion.md](modules/autenticacion.md) | Supabase Auth, middleware de sesión, doble factor TOTP, códigos de backup y dispositivos confiables. |
| 🛡️ **Permisos y Roles** | [modules/permisos.md](modules/permisos.md) | Validación con `requirePermiso()`, matriz de permisos por funcionalidad y roles predefinidos (SuperAdmin, Admin, Empleado). |
| 👔 **Empleados & Auditoría** | [modules/empleados-roles.md](modules/empleados-roles.md) | Empleados, vinculación con usuarios, control de accesos y bitácora de auditoría administrativa. |
| ⚙️ **Configuración** | [modules/configuracion.md](modules/configuracion.md) | Perfil del comercio, datos fiscales, preferencias de venta (stock negativo, venta sin caja), branding y seguridad. |
| 📊 **Analíticas y KPIs** | [modules/analiticas.md](modules/analiticas.md) | Dashboard ejecutivo, métricas de facturación diaria/mensual, alertas financieras y gráficos interactivos. |

---

### 2. 🏷️ Catálogo y Stock ([Ver Índice](productos/README.md))

| Documento | Descripción |
|---|---|
| [productos/stock-por-sucursal.md](productos/stock-por-sucursal.md) | Control de stock independiente por local físico (`ArticuloStock`), alertas de stock mínimo y reposición. |
| [productos/cache-imagenes-plan.md](productos/cache-imagenes-plan.md) | Catálogo global compartido de fotos por código de barras (EAN) para agilizar el alta de productos. |
| [productos/optimizacion-imagenes.md](productos/optimizacion-imagenes.md) | Redimensionamiento y conversión a WebP en el navegador previo a la subida a Supabase Storage. |

---

### 3. 🏢 Arquitectura Multi-Sucursal ([Ver Índice](multi-sucursal/README.md))

| Documento | Descripción |
|---|---|
| [multi-sucursal/README.md](multi-sucursal/README.md) | Visión global del aislamiento de sucursales, numeración de comprobantes y stock por local. |
| [multi-sucursal/FLUJO-SELECCION-SUCURSAL.md](multi-sucursal/FLUJO-SELECCION-SUCURSAL.md) | Selector de sucursal activa en topbar, cookies seguras y sincronización de contexto. |
| [multi-sucursal/IMPLEMENTACION-COMPLETADA.md](multi-sucursal/IMPLEMENTACION-COMPLETADA.md) | Registro histórico y checklist técnico de la implementación multi-sucursal completada. |

---

### 4. 🎨 UI, UX y Componentes ([Ver Índice](ui/README.md))

| Documento | Descripción |
|---|---|
| [ui/crud-tablas-genericas.md](ui/crud-tablas-genericas.md) | **Patrón CRUD Maestro**: Componentes `GenericCrud` y `GenericTable`, exportación CSV/XLS y acciones masivas. |
| [ui/formato-crud.md](ui/formato-crud.md) | Estándar visual de modales (`placement="center"`), inputs, botones y esquema de colores. |
| [ui/consistencia-formato-paginas.md](ui/consistencia-formato-paginas.md) | Envoltura estándar de páginas del dashboard, tarjetas, pestañas y layouts responsivos. |
| [ui/heroui-table-overrides.md](ui/heroui-table-overrides.md) | Overrides de clases y slots para tablas HeroUI (checkboxes, bordes, estados hover). |
| [ui/configuracion-colores-hero-ui.md](ui/configuracion-colores-hero-ui.md) | Tokens de temas claro/oscuro y variables CSS globales. |
| [ui/seleccion-masiva-cross-page.md](ui/seleccion-masiva-cross-page.md) | Nota técnica sobre selección masiva de filas y deselección automática al aplicar filtros o paginar. |
| [ui/ux-improvements.md](ui/ux-improvements.md) | Registro de mejoras de experiencia, micro-animaciones Framer Motion y optimizaciones de densidad. |

---

### 5. 💎 Planes SaaS y Feature Gating ([Ver Índice](saas/README.md))

| Documento | Descripción |
|---|---|
| [saas/planes-saas.md](saas/planes-saas.md) | Definición formal de tiers (Plan Básico, Plan Premium, Plan Ilimitado), límites de sucursales, usuarios, artículos y AFIP. |
| [saas/planes-saas-implementacion.md](saas/planes-saas-implementacion.md) | Plan técnico de implementación del enforcement en backend (`PlanFeatures`) y bloqueos visuales en UI. |

---

### 6. 🚀 Especificaciones y Features ([Ver Índice](features/README.md))

| Documento | Descripción |
|---|---|
| [features/notificaciones.md](features/notificaciones.md) | Alertas internas en tiempo real para stock crítico, límites de crédito superados y auto-resolución. |
| [features/nota-credito-afip.md](features/nota-credito-afip.md) | Especificación de Notas de Crédito electrónicas ARCA con comprobantes asociados (`CbtesAsoc`). |
| [features/ventas-busqueda-tabs.md](features/ventas-busqueda-tabs.md) | Plan de unificación en pestañas alternables ("Carrito" / "Buscar productos") para la pantalla de ventas. |
| [features/portal-proveedores-marketplace.md](features/portal-proveedores-marketplace.md) | **Spec SDD**: Portal B2B para proveedores, catálogos públicos/privados, seguidores y pedidos a compras. |

---

### 7. ⚡ Rendimiento y Optimizaciones ([Ver Índice](optimizaciones/README.md))

| Documento | Descripción |
|---|---|
| [optimizaciones/peticiones-http.md](optimizaciones/peticiones-http.md) | Configuración de React Query (`staleTime: 60s`), debounce de 400ms y `keepPreviousData`. |
| [optimizaciones/auth-optimizacion.md](optimizaciones/auth-optimizacion.md) | Optimización del middleware de autenticación y reducción de latencia en tokens Supabase. |
| [optimizaciones/auth-resumen.md](optimizaciones/auth-resumen.md) | Métricas comparativas de rendimiento en tiempos de respuesta de autenticación. |
| [optimizaciones/permisos-rendimiento.md](optimizaciones/permisos-rendimiento.md) | Cacheo en memoria de permisos de usuario para verificación instantánea sin sobrecargar la base de datos. |
| [optimizaciones/optimizaciones-generales.md](optimizaciones/optimizaciones-generales.md) | Code splitting, lazy loading de modales y optimización del bundle size. |

---

### 8. 🧪 Testing y Calidad ([Ver Índice](TESTING.md))

| Documento | Descripción |
|---|---|
| [../testing/README.md](../testing/README.md) | Índice central de pruebas unitarias y de integración con Vitest. |
| [../testing/GUIA.md](../testing/GUIA.md) | Guía de comandos, cobertura por módulo y configuración de infraestructura de tests. |
| [../testing/PLAN-TESTING.md](../testing/PLAN-TESTING.md) | Plan maestro y principios de pruebas para backend, componentes y validaciones. |
| [../testing/INFORME-VALIDACIONES.md](../testing/INFORME-VALIDACIONES.md) | Casos de prueba de frontera y validaciones de schemas Zod. |
| [../e2e/journey/README.md](../e2e/journey/README.md) | **Matriz de 14 Fases E2E (Playwright)** con ~172 tests del flujo integral de usuario. |

---

### 9. 🌐 SEO y Metadatos

| Documento | Descripción |
|---|---|
| [SEO-GUIA.md](SEO-GUIA.md) | Guía de SEO, OpenGraph, Twitter Cards, robots.txt y sitemap dinámico para la plataforma. |

---

## 🛠️ Guía Rápida para Desarrolladores y Agentes IA

1. **Visión General**: Comenzar leyendo [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md) y [ARCHITECTURE.md](ARCHITECTURE.md).
2. **Patrones de Código**: Consultar [AGENTS.md](../AGENTS.md) y [ui/crud-tablas-genericas.md](ui/crud-tablas-genericas.md) antes de crear o editar componentes.
3. **Módulos de Dominio**: Revisar el documento correspondiente en [modules/](modules/README.md) para conocer las tablas Prisma, schemas Zod y endpoints.
4. **Sistema Visual**: Seguir la guía de tokens y estilos en [DESIGN.md](../DESIGN.md).
5. **Testing**: Comprobar validaciones y ejecutar la suite con `pnpm test` y `pnpm test:e2e`.
