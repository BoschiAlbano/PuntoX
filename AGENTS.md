# Guía para Agentes y Desarrolladores — PuntoX

Este documento resume convenciones, arquitectura de componentes, hooks, base de datos y patrones del proyecto para mantener consistencia estricta al modificar o añadir código.

---

## 🧭 Mapa de Documentación Rápida

- **[docs/README.md](docs/README.md)** — Índice Maestro con búsqueda por categoría.
- **[docs/ESTADO_ACTUAL.md](docs/ESTADO_ACTUAL.md)** — Estado real y matriz de completitud del sistema.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Análisis de arquitectura técnica y dependencias.
- **[DESIGN.md](DESIGN.md)** — Sistema de diseño visual Kinetic Retail Ops (tokens, colores, tipografía).
- **[docs/modules/README.md](docs/modules/README.md)** — Documentación de todos los módulos de negocio.
- **[docs/TESTING.md](docs/TESTING.md)** — Guía unificada de testing (Vitest + Playwright).

---

## 📋 Estructura de Componentes CRUD

Los CRUDs de administración utilizan la dupla **GenericCrud** + **GenericTable**:

```
GenericCrud (orquesta estado, API, modales, toasts)
  └── GenericTable (tabla, búsqueda debounced, paginación, bulk selection, "Más opciones")
```

### Props clave de GenericCrud

| Prop | Tipo | Uso |
|---|---|---|
| `apiPath` | `string` | Endpoint base (GET paginado con `?q=`, POST, PATCH, DELETE con `?Id=`) |
| `queryKey` | `string` | Clave única de TanStack React Query |
| `columns` | `Column[]` | Columnas de la tabla (`key`, `label`, `sortable`) |
| `renderCell` | `(item, columnKey) => ReactNode` | Renderizado personalizado por celda (`default` debe retornar `null`) |
| `FormComponent` | `Component` | Modal de creación y edición |
| `exportConfig` | `{ filename, columns, mapItem }` | Exportación CSV/XLS desde "Más opciones" |
| `bulkActionsDropdown` | `Array` | Opciones de acción masiva al seleccionar filas |
| `enableBulkActions` | `boolean` | Habilita checkboxes y barra flotante de selección |

### Exportación de Datos

- **Menú "Más opciones":** Exporta los datos **visibles** filtrados y ordenados.
- **Acciones masivas:** "Exportar como CSV" y "Exportar como XLS" exportan exclusivamente los elementos **seleccionados**.
- **Utilidades:** Usar `exportToCsv()` y `exportToXls()` de `src/lib/utils/exportCsv.ts`.

### Selección Masiva

`onAction` recibe un objeto `BulkSelectionContext<T>` con `{ ids, items, totalCount, mode, clearSelection }`.  
Al cambiar búsqueda, filtros o página, la selección se reinicia automáticamente.

---

## ⚡ API y Hooks

- **Hook Principal:** `useGenericApi` (`src/hooks/useGenericApi.ts`) para consultas paginadas, mutaciones optimistas y `extraParams`.
- **Endpoints Estándar:**
  - `GET`: Parámetros `?q=`, `page=1`, `limit=10`, `sortBy=`, `sortOrder=`.
  - `POST` / `PATCH`: Body en JSON validado con Zod.
  - `DELETE`: `?Id={id}` ejecutando baja lógica (`EstaEliminado: true`).
- **Formato de Respuesta Paginada:**
  ```json
  {
    "data": [ ... ],
    "pagination": {
      "total": 120,
      "page": 1,
      "limit": 10,
      "totalPages": 12
    }
  }
  ```

---

## 🛡️ Validación, Seguridad y Errores

- **Zod Schemas:** Definidos en `src/lib/validations/*.schema.ts`.
- **Manejo de Errores:** Usar siempre `handleError(error)` de `@/lib/errors/handler`.
- **Multi-Tenancy:** **NUNCA usar fallbacks** como `tenantId || 1`. Validar la sesión con `getAuthContext({ req, permission })`.
- **Permisos:** Proteger endpoints de backend con constantes de `src/lib/constants/comprobantes.ts` (`GET_PERMISSIONS`, `SET_PERMISSIONS`).

---

## 🗄️ Base de Datos (Prisma)

- **Modelos:** Identificadores primarios como `BigInt` (`Id`), campo `TenantId` obligatorio, y borrado lógico con `EstaEliminado: Boolean`.
- **Multi-Sucursal:**
  - `Articulo` es global por tenant; las existencias físicas se guardan en `ArticuloStock` (`ArticuloId`, `SucursalId`, `CantidadStock`).
  - Las `Caja` y `Comprobante` siempre referencian a una `SucursalId`.

---

## 🎨 Estilo y UI

- **Tokens y Colores:** Acento primario `#0066FF` / `#67afc3`, acento secundario de acción `#FF6100` (ver [DESIGN.md](DESIGN.md)).
- **Modales:** Siempre configurar `placement="center"`, `backdrop="opaque"` y `motionProps` estandarizados.
- **HeroUI Table:** Ver [docs/ui/heroui-table-overrides.md](docs/ui/heroui-table-overrides.md) para las clases de slots y estilos.
