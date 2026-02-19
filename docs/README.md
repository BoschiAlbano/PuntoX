# Documentación PuntoX

Índice unificado de la documentación del proyecto.

## Acceso rápido

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](ARCHITECTURE.md) | Stack, modelo de datos, análisis y prioridades |
| [Estado actual](ESTADO_ACTUAL.md) | Funcionalidades implementadas y pendientes |
| [Roadmap](ROADMAP.md) | Prioridades y plan de mejora |
| [CRUD y tablas genéricas](ui/crud-tablas-genericas.md) | GenericCrud, GenericTable, export CSV/XLS, acciones masivas |
| [Formato CRUD](ui/formato-crud.md) | Modales, estilos y paleta unificada |

---

## Por categoría

### Módulos de negocio

| Módulo | Documento | Contenido |
|--------|-----------|-----------|
| Ventas | [modules/ventas.md](modules/ventas.md) | Carrito, comprobantes, formas de pago |
| Clientes | [modules/clientes.md](modules/clientes.md) | CRUD, cuenta corriente, validaciones |
| Empleados y roles | [modules/empleados-roles.md](modules/empleados-roles.md) | Usuarios, permisos, auditoría |
| Configuración | [modules/configuracion.md](modules/configuracion.md) | Perfil, preferencias, branding, seguridad |
| Autenticación | [modules/autenticacion.md](modules/autenticacion.md) | Supabase Auth, flujo de sesión |
| Permisos | [modules/permisos.md](modules/permisos.md) | requirePermiso, roles |
| Analíticas | [ANALITICAS.md](ANALITICAS.md) | KPIs, gráficas, alertas |

### UI y UX

| Documento | Descripción |
|-----------|-------------|
| [ui/crud-tablas-genericas.md](ui/crud-tablas-genericas.md) | Tablas genéricas, export CSV/XLS, selección masiva |
| [ui/formato-crud.md](ui/formato-crud.md) | Estilo de modales y formularios |
| [ui/consistencia-formato-paginas.md](ui/consistencia-formato-paginas.md) | Contenedores, tabs, cards |
| [UX_IMPROVEMENTS.md](UX_IMPROVEMENTS.md) | Mejoras visuales y de experiencia |

### Técnico

| Documento | Descripción |
|-----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Análisis completo del proyecto |
| [SECURITY.md](SECURITY.md) | Seguridad, validaciones, buenas prácticas |
| [TESTING.md](TESTING.md) | Tests, cobertura, convenciones |
| [OPTIMIZACIONES.md](OPTIMIZACIONES.md) | Índice de optimizaciones |
| [OPTIMIZACIONES_PETICIONES.md](OPTIMIZACIONES_PETICIONES.md) | React Query, debounce, cache |
| [CSRF_IMPLEMENTATION.md](CSRF_IMPLEMENTATION.md) | Tokens CSRF |

### Funcionalidades específicas

| Documento | Descripción |
|-----------|-------------|
| [NOTA-TECNICA-SELECCION-MASIVA-CROSS-PAGE.md](NOTA-TECNICA-SELECCION-MASIVA-CROSS-PAGE.md) | Selección masiva entre páginas |
| [productos/stock-por-sucursal.md](productos/stock-por-sucursal.md) | Stock por sucursal |
| [multi-sucursal/README.md](multi-sucursal/README.md) | Multi-sucursal |
| [auth/logout-handling.md](auth/logout-handling.md) | Manejo de cierre de sesión |

---

## Estructura del proyecto

```
PuntoX/
├── docs/                    # Esta documentación
├── src/
│   ├── app/
│   │   ├── (auth)/          # Rutas de autenticación
│   │   ├── (dashboard)/     # Rutas del dashboard
│   │   ├── api/             # API Routes
│   │   └── actions/        # Server Actions
│   ├── components/          # Componentes React
│   │   ├── shared/          # GenericCrud, GenericTable
│   │   └── [modulos]/       # Por dominio
│   ├── hooks/               # useGenericApi, useProductos, etc.
│   └── lib/                 # Auth, validaciones, utilidades
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── testing/                 # Guías de testing
```

---

## Guía rápida para nuevos desarrolladores

1. Leer [ARCHITECTURE.md](ARCHITECTURE.md) para el panorama general.
2. Revisar [ui/crud-tablas-genericas.md](ui/crud-tablas-genericas.md) para entender el patrón CRUD.
3. Consultar el módulo correspondiente en [modules/](modules/).
4. Para agentes IA: ver [AGENTS.md](../AGENTS.md) en la raíz del proyecto.

---

Última actualización: Febrero 2025
