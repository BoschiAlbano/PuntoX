# CRUD Genérico y Tablas - Guía Completa

**Fecha:** Febrero 2025

## Resumen

Documentación del sistema de tablas y CRUD genérico: `GenericCrud` + `GenericTable`, incluyendo acciones masivas, exportación CSV/XLS, filtros, paginación y optimizaciones React Query.

---

## Arquitectura

| Componente | Ubicación | Responsabilidad |
|------------|-----------|-----------------|
| `GenericCrud` | `src/components/shared/GenericCrud.tsx` | Orquesta API, formulario, modales, estado de selección, exportConfig |
| `GenericTable` | `src/components/shared/GenericTable.tsx` | Renderiza tabla, búsqueda, paginación, menú "Más opciones" (Export, Imprimir) |
| `useGenericApi` | `src/hooks/useGenericApi.ts` | Fetch paginado, mutations, parámetros extra |
| `queryDefaults` | `src/lib/react-query/queryDefaults.ts` | staleTime, keepPreviousData, refetch options |
| `exportCsv` | `src/lib/utils/exportCsv.ts` | `exportToCsv()` y `exportToXls()` para descarga de archivos |

---

## Exportación

### Menú "Más opciones"

El botón "Más opciones" (junto a Nuevo) ofrece:

- **Exportar como CSV** — Exporta los datos visibles (filtros y orden aplicados)
- **Exportar como XLS** — Idem, formato Excel (.xlsx)
- **Imprimir** — Imprime la tabla actual

No existe opción de importación (eliminada).

### Configuración (exportConfig)

Para que aparezcan las opciones CSV/XLS, el CRUD debe pasar `exportConfig`:

```tsx
exportConfig={{
  filename: "marcas",
  columns: [
    { key: "Id", header: "ID" },
    { key: "Descripcion", header: "Descripción" },
    { key: "Productos", header: "Productos" },
    { key: "Estado", header: "Estado" },
  ],
  mapItem: (m) => ({
    Id: m.Id,
    Descripcion: m.Descripcion ?? "",
    Productos: m.CantidadProductos ?? 0,
    Estado: m.EstaEliminado ? "Inactivo" : "Activo",
  }),
}}
```

- **filename:** Nombre base del archivo (se añade `_YYYY-MM-DD`)
- **columns:** Definición de columnas exportadas
- **mapItem:** Transforma cada item a objeto plano

### Acciones masivas: Exportar seleccionados

En `bulkActionsDropdown` cada CRUD define "Exportar como CSV" y "Exportar como XLS" que exportan **solo los elementos seleccionados**:

```tsx
{ key: "exportar-csv", label: "Exportar como CSV", onAction: (ctx) => { ... } },
{ key: "exportar-xls", label: "Exportar como XLS", onAction: (ctx) => { ... } },
```

Usan las mismas utilidades: `exportToCsv()` y `exportToXls()` de `@/lib/utils/exportCsv`.

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
4. Exportar como CSV / Exportar como XLS

```tsx
bulkActionsDropdown={[
  { key: "cambiar-estado", label: "Cambiar estado", onAction: (ctx) => { /* ... */ } },
  { key: "editar-campos", label: "Editar campos comunes", onAction: (ctx) => { /* ... */ } },
  { key: "exportar-csv", label: "Exportar como CSV", onAction: (ctx) => { /* ... */ } },
  { key: "exportar-xls", label: "Exportar como XLS", onAction: (ctx) => { /* ... */ } },
]}
```

### Props en GenericCrud

| Prop | Tipo | Descripción |
|------|------|-------------|
| `enableBulkActions` | `boolean` | Activa checkboxes y barra de selección |
| `bulkActionsDropdown` | `Array<{ key, label, onAction }>` | Opciones del dropdown; `onAction(ctx)` recibe `BulkSelectionContext<T>` |
| `exportConfig` | `{ filename, columns, mapItem }` | Habilita "Exportar como CSV/XLS" en menú "Más opciones" |

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

| CRUD | enableBulkActions | exportConfig | bulkActionsDropdown | lowStockFilterFn | lowStockApiParam |
|------|-------------------|--------------|---------------------|------------------|------------------|
| ProductoCRUD | ✓ | ✓ | CSV, XLS, Cambiar estado, Editar, Actualizar precios | ✓ | ✓ |
| ClienteCRUD | ✓ | ✓ | CSV, XLS, Editar | — | — |
| MarcaCRUD | ✓ | ✓ | CSV, XLS, Cambiar estado, Editar | — | — |
| RubroCRUD | ✓ | ✓ | CSV, XLS, Cambiar estado, Editar | — | — |
| UnidadMedidaCRUD | ✓ | ✓ | CSV, XLS, Cambiar estado, Editar | — | — |
| UsuariosCRUD | ✓ | ✓ | CSV, XLS, Cambiar estado, Editar | — | — |
| AuditoriasCRUD | ✓ | ✓ | CSV, XLS | — | — |

---

## Impresión (Vista Print-Friendly)

### Configuración (printConfig)

Los CRUDs pueden pasar `printConfig` para personalizar la vista de impresión:

```tsx
printConfig={{
  title: "Listado de Productos",
  orientation: "landscape",  // "portrait" | "landscape" según columnas
}}
```

### Comportamiento

- **Tabla dedicada:** Se usa una tabla HTML separada (no la de pantalla), oculta con `position: fixed; left: -9999px` y visible solo al imprimir.
- **Encabezado:** Título + fecha/hora de impresión (actualizada al pulsar Imprimir) + filtros activos (ej. "Solo bajo stock").
- **Estilos print-friendly:** Cabecera gris claro (#e2e8f0), texto oscuro, bordes finos, tipografía 10px, zebra suave, alineación numérica a la derecha.
- **Oculto en impresión:** Columna Acciones, paginación, buscador, botones. Solo se imprimen las columnas visibles.
- **Repetición de thead:** `display: table-header-group` para que el encabezado se repita en cada página.
- **Evitar corte de filas:** `break-inside: avoid` en filas.
- **Pie:** "Página X de Y • Total: N registros". Página número en margin box si el navegador lo soporta.

### Columnas numéricas

Por defecto, Stock, StockMinimo, Costo, Minorista y Mayorista se alinean a la derecha. Otras columnas admiten `printAlign?: "left" | "right"` en la definición.

### Checklist de validación (Chrome + PDF)

- [ ] Título correcto en encabezado
- [ ] Fecha/hora actualizada al imprimir
- [ ] Filtros mostrados cuando aplican (ej. Bajo stock)
- [ ] Sin columna Acciones
- [ ] Cabecera gris claro, alto contraste
- [ ] Números alineados a la derecha
- [ ] Moneda en formato $ 1.234,56
- [ ] Estado en escala de grises
- [ ] Zebra suave en filas
- [ ] Pie con total de registros
- [ ] Landscape/portrait según columnas

---

## Archivos clave

- `src/components/shared/GenericCrud.tsx` — Orquestación, exportConfig, bulkActions
- `src/components/shared/GenericTable.tsx` — Tabla, "Más opciones" (Export CSV/XLS, Imprimir)
- `src/hooks/useGenericApi.ts` — API paginada
- `src/lib/react-query/queryDefaults.ts` — Config React Query
- `src/lib/utils/exportCsv.ts` — exportToCsv(), exportToXls()
- `src/app/api/productos/route.ts` — Parámetro `bajoStock`

---

## Referencias

- [Formato CRUD (formularios)](./formato-crud.md)
- [Optimizaciones de peticiones](../OPTIMIZACIONES_PETICIONES.md)
- [Consistencia de formato páginas](./consistencia-formato-paginas.md)
