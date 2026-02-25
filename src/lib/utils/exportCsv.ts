/**
 * Utilidades de exportación a CSV y Excel (.xlsx).
 * Usadas por GenericCrud (menú "Más opciones") y acciones masivas de los CRUDs.
 * @module lib/utils/exportCsv
 */

import * as XLSX from "xlsx";

/**
 * Exporta un array de objetos a CSV y descarga el archivo.
 * Nombre del archivo: `{filename}_YYYY-MM-DD.csv`
 * @param data - Array de objetos a exportar
 * @param columns - Definición de columnas (key: clave del objeto, header: encabezado)
 * @param filename - Nombre base del archivo
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
) {
  if (data.length === 0) {
    return;
  }
  const headers = columns.map((c) => c.header).join(",");
  const escape = (v: unknown): string => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const rows = data.map((row) =>
    columns.map((c) => escape(row[c.key])).join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta un array de objetos a XLSX (Excel) y descarga el archivo.
 * Usa la librería xlsx (SheetJS).
 * Nombre del archivo: `{filename}_YYYY-MM-DD.xlsx`
 * @param data - Array de objetos a exportar
 * @param columns - Definición de columnas (key: clave del objeto, header: encabezado)
 * @param filename - Nombre base del archivo
 */
export function exportToXls<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
) {
  if (data.length === 0) return;

  const rows = data.map((row) =>
    columns.reduce(
      (acc, c) => {
        acc[c.header] = row[c.key] ?? "";
        return acc;
      },
      {} as Record<string, unknown>
    )
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(
    workbook,
    `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}
