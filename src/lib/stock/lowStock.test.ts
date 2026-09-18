import { describe, expect, it } from "vitest";
import { isLowStock } from "./lowStock";

describe("isLowStock", () => {
  it("marca como bajo stock cuando el stock es menor o igual al mínimo y el mínimo es positivo", () => {
    expect(isLowStock(5, 10)).toBe(true);
    expect(isLowStock(10, 10)).toBe(true);
  });

  it("no marca como bajo stock cuando el mínimo es cero o negativo", () => {
    expect(isLowStock(0, 0)).toBe(false);
    expect(isLowStock(5, 0)).toBe(false);
    expect(isLowStock(5, -1)).toBe(false);
  });

  it("no marca como bajo stock cuando hay stock por encima del mínimo", () => {
    expect(isLowStock(11, 10)).toBe(false);
  });
});
