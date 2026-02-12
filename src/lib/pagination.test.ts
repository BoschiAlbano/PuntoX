/**
 * Tests para helpers de paginación
 */
import { describe, it, expect } from "vitest";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "./pagination";

describe("parsePaginationParams", () => {
  it("usa page 1 y limit 20 por defecto", () => {
    const req = { nextUrl: { searchParams: new URLSearchParams() } };
    const r = parsePaginationParams(req);
    expect(r.page).toBe(1);
    expect(r.limit).toBe(20);
    expect(r.skip).toBe(0);
  });

  it("respeta page y limit de query", () => {
    const req = {
      nextUrl: { searchParams: new URLSearchParams({ page: "2", limit: "10" }) },
    };
    const r = parsePaginationParams(req);
    expect(r.page).toBe(2);
    expect(r.limit).toBe(10);
    expect(r.skip).toBe(10);
  });

  it("acota limit a máximo 100", () => {
    const req = {
      nextUrl: { searchParams: new URLSearchParams({ limit: "500" }) },
    };
    const r = parsePaginationParams(req);
    expect(r.limit).toBe(100);
  });

  it("acota page a mínimo 1", () => {
    const req = {
      nextUrl: { searchParams: new URLSearchParams({ page: "0" }) },
    };
    const r = parsePaginationParams(req);
    expect(r.page).toBe(1);
  });
});

describe("createPaginationResponse", () => {
  it("calcula totalPages y hasNextPage correctamente", () => {
    const data = [1, 2, 3];
    const total = 25;
    const params = { page: 1, limit: 10, skip: 0 };
    const r = createPaginationResponse(data, total, params);
    expect(r.data).toEqual([1, 2, 3]);
    expect(r.pagination.total).toBe(25);
    expect(r.pagination.totalPages).toBe(3);
    expect(r.pagination.hasNextPage).toBe(true);
    expect(r.pagination.hasPreviousPage).toBe(false);
  });
});
