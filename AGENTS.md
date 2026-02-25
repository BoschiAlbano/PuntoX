# Guía para Agentes y Desarrolladores — PuntoX

Este documento resume convenciones, estructura y patrones del proyecto para mantener consistencia al modificar código.

## Estructura de componentes CRUD

Los CRUDs usan **GenericCrud** + **GenericTable**:

```
GenericCrud (orquesta estado, API, modales)
  └── GenericTable (tabla, búsqueda, paginación, "Más opciones")
```

### Props clave de GenericCrud

| Prop | Tipo | Uso |
|------|------|-----|
| `apiPath` | string | Endpoint base (GET paginado, POST, PATCH, DELETE con ?Id=) |
| `queryKey` | string | Clave React Query |
| `columns` | Column[] | Columnas de la tabla |
| `renderCell` | fn | Renderiza cada celda; `default` debe retornar `null` |
| `FormComponent` | Component | Modal de crear/editar |
| `exportConfig` | { filename, columns, mapItem } | Export CSV/XLS desde "Más opciones" |
| `bulkActionsDropdown` | Array | Opciones al seleccionar filas |
| `enableBulkActions` | boolean | Activa checkboxes y barra de selección |

### Exportación

- **Más opciones:** Export CSV y XLS exportan los datos **visibles** (filtro/orden aplicados).
- **Acciones masivas:** "Exportar como CSV" y "Exportar como XLS" exportan solo los elementos **seleccionados**.
- No existe importación; el menú "Importar" fue eliminado.

### Acciones masivas

`onAction` recibe `BulkSelectionContext<T>` con `ids`, `items`, `totalCount`, `mode`, `clearSelection`.

Al cambiar búsqueda, filtro o orden, la selección se invalida automáticamente.

## API y hooks

- **useGenericApi:** Fetch paginado, mutations, `extraParams` para filtros.
- **Endpoints CRUD estándar:** GET con `?q=`, `page`, `limit`; POST/PATCH body JSON; DELETE con `?Id=`.
- **Respuesta paginada:** `{ data: T[], pagination: { total, page, limit, totalPages } }`.

## Validación y errores

- Schemas Zod en `src/lib/validations/*.schema.ts`.
- Manejo de errores: `handleError()` de `@/lib/errors/handler`.
- Nunca usar `tenantId || 1`; validar `tenantId` antes.

## Base de datos

- **Prisma:** Modelos con `TenantId`, `EstaEliminado`, IDs como `BigInt`.
- **Productos:** `Articulo` + `Precio`; stock por sucursal en `ArticuloStock`.
- **Marcas:** Incluyen `CantidadProductos` calculado con `_count` de Prisma.

## Utilidades de export

- `src/lib/utils/exportCsv.ts`: `exportToCsv()` y `exportToXls()`.
- Misma firma: `(data, columns, filename)`.
- Columnas: `{ key: keyof T, header: string }[]`.

## Estilo y UI

- Color acento: `#67afc3`.
- Formularios: modales con `placement="center"`, `backdrop="opaque"`.
- Ver `docs/ui/formato-crud.md` para classNames y paleta.

## Documentación

- **docs/README.md** — Índice general.
- **docs/ui/crud-tablas-genericas.md** — CRUD genérico, export, acciones masivas.
- **docs/ARCHITECTURE.md** — Análisis completo del proyecto.
- **docs/modules/** — Documentación por módulo.
