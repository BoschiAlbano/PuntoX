# Nota técnica: Selección masiva cross-page

## Resumen

Se implementó selección masiva que persiste entre páginas y permite escalar a "todos los resultados" con exclusiones.

## Modelo de estado (frontend)

- **mode**: `"manual"` | `"all_matching"`
- **selectedIds**: `Set<string>` (solo en manual)
- **excludedIds**: `Set<string>` (solo en all_matching)
- **selectionQuerySignature**: firma de filtros para invalidar selección

## Reglas de selección

| Acción | manual | all_matching |
|--------|--------|--------------|
| Checkbox header "select all" | Añade pageIds a selectedIds | Quita pageIds de excludedIds |
| Checkbox fila | Add/remove en selectedIds | Add/remove en excludedIds |
| Contador | selectedIds.size | total - excludedIds.size |
| CTA "Seleccionar los N resultados" | Cambia a all_matching, limpia sets | N/A |

## Invalidación

Si cambian búsqueda, filtro bajo stock, orden o límite → se reinicia la selección y opcional toast.

## Contrato frontend para acciones masivas

Las acciones masivas reciben `BulkSelectionContext<T>`:

```ts
interface BulkSelectionContext<T> {
  ids: string[];
  items: T[];
  totalCount: number;
  mode: "manual" | "all_matching";
  clearSelection: () => void;
}
```

- **ids**: IDs efectivos a procesar
- **items**: ítems completos (se obtienen por fetch cuando hay cross-page)
- **totalCount**: cantidad seleccionada
- **mode**: modo actual
- **clearSelection**: limpia la selección tras éxito

## Contrato backend (futuro)

Si el backend quiere soportar payload directo:

```ts
// Modo manual (IDs explícitos)
{ scope: "ids", ids: string[] }

// Modo all_matching (filtros + exclusiones)
{
  scope: "all_matching",
  filters: { q: string, bajoStock: boolean, sort: string, limit: number },
  excludedIds: string[]
}
```

Hoy el frontend resuelve siempre a `ids` mediante fetch paginado antes de llamar a las APIs existentes.

## Archivos modificados

- `src/components/shared/GenericCrud.tsx` - Estado y lógica de selección
- `src/components/shared/GenericTable.tsx` - UI barra selección, CTA
- `src/components/productos/ProductoCRUD.tsx` - Nuevo contrato BulkSelectionContext
- `src/lib/utils/selectionUtils.ts` - Utilidad buildSelectionQuerySignature
