# CRUD Genérico y Tablas - Guía Completa

**Fecha:** Febrero 2025

## Resumen

Documentación del sistema de tablas y CRUD genérico: `GenericCrud` + `GenericTable`, incluyendo acciones masivas, filtros, paginación y optimizaciones React Query.

---

## Arquitectura

| Componente | Ubicación | Responsabilidad |
|------------|-----------|-----------------|
| `GenericCrud` | `src/components/shared/GenericCrud.tsx` | Orquesta API, formulario, modales, estado de selección |
| `GenericTable` | `src/components/shared/GenericTable.tsx` | Renderiza tabla, búsqueda, paginación, barra de acciones |
| `useGenericApi` | `src/hooks/useGenericApi.ts` | Fetch paginado, mutations, parámetros extra |
| `queryDefaults` | `src/lib/react-query/queryDefaults.ts` | staleTime, keepPreviousData, refetch options |

---

## Acciones Masivas

### Cuándo aparece

La barra de selección **solo se muestra cuando hay 2+ filas seleccionadas** (evita ruido con 1 sola).

### Estructura de la barra

```
[ X elementos seleccionados ]  [ Deseleccionar ]  [ Más acciones ▼ ]  [ Eliminar seleccionados ]
```

- **Mobile:** La barra pasa a 2 filas (contador arriba, botones abajo) para que no se corte.
- **Eliminar seleccionados:** Siempre visible cuando hay selección.

### Dropdown "Más acciones"

Cada CRUD define sus opciones. Orden recomendado por frecuencia:

1. Cambiar estado
2. Actualizar precios (solo Productos)
3. Editar campos comunes
4. Exportar seleccionados

```tsx
bulkActionsDropdown={[
  { key: "cambiar-estado", label: "Cambiar estado", onAction: (items) => { /* ... */ } },
  { key: "editar-campos", label: "Editar campos comunes", onAction: (items) => { /* ... */ } },
  { key: "exportar", label: "Exportar seleccionados", onAction: (items) => { /* ... */ } },
]}
```

### Props en GenericCrud

| Prop | Tipo | Descripción |
|------|------|-------------|
| `enableBulkActions` | `boolean` | Activa checkboxes y barra de selección |
| `bulkActionsDropdown` | `Array<{ key, label, onAction }>` | Opciones del dropdown; `onAction(items)` recibe los seleccionados |

---

## Filtro Bajo Stock (Productos)

### Comportamiento

- **Botón** junto a la barra de búsqueda; toggle para activar/desactivar.
- **Server-side:** Cuando `lowStockApiParam` está activo, se envía `?bajoStock=true` al API.
- **API:** Filtra productos donde `Stock <= StockMinimo` y `StockMinimo > 0`.
- **Stock por sucursal:** Si hay `sucursalId`, usa `ArticuloStock`; si no, usa `Articulo.Stock` global.

### Props en ProductoCRUD

```tsx
lowStockFilterFn={(item) => {
  const min = item.StockMinimo ?? 0;
  const stock = item.Stock ?? 0;
  return min > 0 && stock <= min;
}}
lowStockApiParam  // Envía bajoStock al API cuando el filtro está activo
```

---

## Selector de Filas y Paginación

### Ubicación

A la izquierda del paginador: **Filas: 10 ▼** con opciones 10, 30, 50, 100, Todas.

### Layout del pie

```
Izquierda: "4 de 4 registros"
Derecha:   "Filas: 10 ▼"  ‹ 1 ›
```

### Comportamiento

- Al cambiar el límite, la página se resetea a 1.
- **Todas** usa `limit=9999` (configurable con `showAllOption={false}` para ocultar).
- `limitOptions` permite personalizar (por defecto `[10, 30, 50, 100]`).

---

## React Query

### queryKey completa

```ts
queryKey: [queryKey, { search, page, limit, extraParams }]
```

Cada combinación de búsqueda, página, límite y filtros genera una query distinta y se cachea por separado.

### Configuración (dynamicDataQueryOptions)

| Opción | Valor | Motivo |
|--------|-------|--------|
| `staleTime` | 60 s | Menos refetches al cambiar de página |
| `placeholderData` | `keepPreviousData` | Mantiene datos anteriores al cambiar página/filtros (evita parpadeo) |
| `refetchOnMount` | `false` | No refetch si hay datos frescos |
| `refetchOnWindowFocus` | `false` | No refetch al volver a la pestaña |

### Búsqueda

- **Debounce:** 400 ms en `GenericCrud` y `GenericTable`.
- Reduce peticiones mientras el usuario escribe.

### Parámetros extra (extraParams)

Para filtros que se envían al backend:

```ts
useGenericApi({
  endpoint,
  queryKey,
  search,
  page,
  limit,
  extraParams: { bajoStock: true },  // Se añade a la URL
  transformer,
});
```

---

## CRUDs que usan el sistema

| CRUD | enableBulkActions | bulkActionsDropdown | lowStockFilterFn | lowStockApiParam |
|------|-------------------|---------------------|------------------|------------------|
| ProductoCRUD | ✓ | 4 opciones | ✓ | ✓ |
| ClienteCRUD | ✓ | 3 opciones | — | — |
| MarcaCRUD | ✓ | 3 opciones | — | — |
| RubroCRUD | ✓ | 3 opciones | — | — |
| UnidadMedidaCRUD | ✓ | 3 opciones | — | — |
| UsuariosCRUD | ✓ | 3 opciones | — | — |
| AuditoriasCRUD | ✓ | Exportar solo | — | — |

---

## Archivos clave

- `src/components/shared/GenericCrud.tsx`
- `src/components/shared/GenericTable.tsx`
- `src/hooks/useGenericApi.ts`
- `src/lib/react-query/queryDefaults.ts`
- `src/app/api/productos/route.ts` (parámetro `bajoStock`)

---

## Referencias

- [Formato CRUD (formularios)](./formato-crud.md)
- [Optimizaciones de peticiones](../OPTIMIZACIONES_PETICIONES.md)
- [Consistencia de formato páginas](./consistencia-formato-paginas.md)
