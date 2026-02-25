/**
 * Utilidades para selección masiva cross-page.
 * Firma de query para invalidar selección cuando cambian filtros.
 */
export function buildSelectionQuerySignature(params: {
  search: string;
  lowStockOnly: boolean;
  sortColumn: string;
  sortDirection: string;
  limit: number;
}): string {
  return [
    params.search,
    String(params.lowStockOnly),
    params.sortColumn,
    params.sortDirection,
    String(params.limit),
  ].join("|");
}
