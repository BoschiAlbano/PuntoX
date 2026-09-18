export function isLowStock(
  stock: number | string | bigint | null | undefined,
  minStock: number | string | bigint | null | undefined,
): boolean {
  const stockNumber = Number(stock ?? 0);
  const minStockNumber = Number(minStock ?? 0);

  if (!Number.isFinite(stockNumber) || !Number.isFinite(minStockNumber)) {
    return false;
  }

  if (minStockNumber <= 0) {
    return false;
  }

  return stockNumber <= minStockNumber;
}
