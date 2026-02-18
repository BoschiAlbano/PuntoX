/**
 * Exporta un array de objetos a CSV y descarga el archivo.
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
