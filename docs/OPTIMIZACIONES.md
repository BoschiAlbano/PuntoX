# Optimizaciones - Índice

Documentación consolidada de optimizaciones en PuntoX. Cada sección enlaza al documento detallado.

---

## Documentos por tema

| Tema | Documento | Descripción |
|------|-----------|-------------|
| **Peticiones HTTP y React Query** | [OPTIMIZACIONES_PETICIONES.md](./OPTIMIZACIONES_PETICIONES.md) | staleTime, refetch, cache, debounce, queryKey completa, keepPreviousData |
| **Permisos y rendimiento** | [OPTIMIZACIONES_PERMISOS_Y_RENDIMIENTO.md](./OPTIMIZACIONES_PERMISOS_Y_RENDIMIENTO.md) | Protección de rutas, verificación de permisos, fixes de hooks |
| **Optimizaciones aplicadas** | [OPTIMIZACIONES_IMPLEMENTADAS.md](./OPTIMIZACIONES_IMPLEMENTADAS.md) | Lazy loading, code splitting, memoización, prefetching, imágenes |
| **CRUD y tablas** | [ui/crud-tablas-genericas.md](./ui/crud-tablas-genericas.md) | Acciones masivas, filtros, paginación, React Query en listados |

---

## Configuración actual (resumen)

### React Query (listados CRUD)

- **queryKey completa:** `[queryKey, { search, page, limit, extraParams }]`
- **staleTime:** 60 s (dynamicDataQueryOptions)
- **placeholderData:** `keepPreviousData` (evita parpadeo al cambiar página)
- **Debounce búsqueda:** 400 ms
- **Origen:** `src/lib/react-query/queryDefaults.ts`, `src/hooks/useGenericApi.ts`

### Server-side por defecto

- Paginación, filtros (búsqueda, bajo stock) en el backend
- Solo usar "traer todo y filtrar en cliente" si el dataset es pequeño y estable

---

**Última actualización:** Febrero 2025
