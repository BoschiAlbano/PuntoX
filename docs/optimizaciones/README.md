# ⚡ Rendimiento y Optimizaciones — PuntoX

Documentación consolidada de optimizaciones de rendimiento, caching, peticiones HTTP, autenticación y base de datos en **PuntoX**.

---

## Documentos de Optimización

| Tema | Documento | Descripción |
|---|---|---|
| 🌐 **Peticiones HTTP y React Query** | [peticiones-http.md](peticiones-http.md) | Configuración de `staleTime`, `refetchOnWindowFocus: false`, debounce de 400ms, `keepPreviousData` y query keys compuestas |
| 🔐 **Autenticación Supabase** | [auth-optimizacion.md](auth-optimizacion.md) | Reducción de latencia en validación de sesiones JWT y eliminación de roundtrips innecesarios |
| 📊 **Resumen de Auth** | [auth-resumen.md](auth-resumen.md) | Métricas comparativas de tiempo de respuesta antes y después de optimizar auth |
| 🛡️ **Permisos y Permisos en Memoria** | [permisos-rendimiento.md](permisos-rendimiento.md) | Cacheo de permisos por rol, hooks eficientes y validaciones backend instantáneas |
| 🚀 **Optimizaciones Generales** | [optimizaciones-generales.md](optimizaciones-generales.md) | Code splitting, lazy loading de modales pesados, memoización React y bundle size |
| 🖼️ **Imágenes y WebP** | [../productos/optimizacion-imagenes.md](../productos/optimizacion-imagenes.md) | Compresión y redimensionado de imágenes en cliente antes de subirlas a Supabase Storage |
| 📦 **Caché Compartido de Barcodes** | [../productos/cache-imagenes-plan.md](../productos/cache-imagenes-plan.md) | Catálogo cross-tenant para autocompletar imágenes de artículos por código EAN |
| 📋 **Listados y Tablas** | [../ui/crud-tablas-genericas.md](../ui/crud-tablas-genericas.md) | Paginación del lado del servidor, filtros eficientes y debounce en tablas |

---

## Buenas Prácticas Generales de Rendimiento

1. **Server-Side Filtering por Defecto**:
   - Toda tabla o listado debe paginar y filtrar en base de datos (`skip`, `take`, `where`), nunca trayendo todo el dataset al cliente a menos que sea un catálogo estático pequeño (< 100 items).
2. **React Query Caching**:
   - `staleTime: 60_000` (1 minuto) para datos dinámicos.
   - `staleTime: 5 * 60_000` (5 minutos) para datos maestros estáticos (marcas, rubros, unidades de medida, condiciones IVA).
3. **Optimización de Consultas Prisma**:
   - Siempre usar `select` específico en lugar de traer relaciones completas innecesarias.
   - Usar índices en campos de búsqueda frecuente (`TenantId`, `EstaEliminado`, `Codigo`, `CodigoBarra`, `Fecha`).
