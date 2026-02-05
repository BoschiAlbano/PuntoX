/**
 * Tests para funciones de paginación
 */

import { describe, it, expect } from "vitest";
import {
  parsePaginationParams,
  createPaginationResponse,
  type PaginationParams,
} from "@/lib/pagination";
import { createMockRequest } from "../utils/mocks";

describe("parsePaginationParams", () => {
  it("debe usar valores por defecto cuando no hay parámetros", () => {
    const req = createMockRequest("http://localhost:3000/api/test");
    const result = parsePaginationParams(req);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  it("debe parsear parámetros de página y límite correctamente", () => {
    const req = createMockRequest(
      "http://localhost:3000/api/test?page=2&limit=10"
    );
    const result = parsePaginationParams(req);

    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(10); // (2-1) * 10
  });

  it("debe calcular skip correctamente", () => {
    const req = createMockRequest(
      "http://localhost:3000/api/test?page=3&limit=15"
    );
    const result = parsePaginationParams(req);

    expect(result.skip).toBe(30); // (3-1) * 15
  });

  it("debe validar que page sea mínimo 1", () => {
    const req = createMockRequest(
      "http://localhost:3000/api/test?page=0&limit=10"
    );
    const result = parsePaginationParams(req);

    expect(result.page).toBe(1);
  });

  it("debe validar que page sea mínimo 1 para valores negativos", () => {
    const req = createMockRequest(
      "http://localhost:3000/api/test?page=-5&limit=10"
    );
    const result = parsePaginationParams(req);

    expect(result.page).toBe(1);
  });

  it("debe validar que limit sea mínimo 1", () => {
    const req = createMockRequest(
      "http://localhost:3000/api/test?page=1&limit=0"
    );
    const result = parsePaginationParams(req);

    expect(result.limit).toBe(1);
  });

  it("debe limitar el máximo de items por página a 100", () => {
    const req = createMockRequest(
      "http://localhost:3000/api/test?page=1&limit=200"
    );
    const result = parsePaginationParams(req);

    expect(result.limit).toBe(100);
  });

  it("debe manejar valores no numéricos usando valores por defecto", () => {
    const req = createMockRequest(
      "http://localhost:3000/api/test?page=abc&limit=xyz"
    );
    const result = parsePaginationParams(req);

    // Debe usar valores por defecto cuando no puede parsear
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe("createPaginationResponse", () => {
  const mockData = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
    { id: 3, name: "Item 3" },
  ];

  it("debe crear respuesta paginada correctamente", () => {
    const params: PaginationParams = { page: 1, limit: 10 };
    const result = createPaginationResponse(mockData, 25, params);

    expect(result.data).toEqual(mockData);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.totalPages).toBe(3); // Math.ceil(25/10)
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPreviousPage).toBe(false);
  });

  it("debe calcular totalPages correctamente", () => {
    const params: PaginationParams = { page: 1, limit: 5 };
    const result = createPaginationResponse(mockData, 23, params);

    expect(result.pagination.totalPages).toBe(5); // Math.ceil(23/5)
  });

  it("debe indicar hasNextPage correctamente", () => {
    const params1: PaginationParams = { page: 1, limit: 10 };
    const result1 = createPaginationResponse(mockData, 25, params1);
    expect(result1.pagination.hasNextPage).toBe(true);

    const params2: PaginationParams = { page: 3, limit: 10 };
    const result2 = createPaginationResponse(mockData, 25, params2);
    expect(result2.pagination.hasNextPage).toBe(false); // Última página
  });

  it("debe indicar hasPreviousPage correctamente", () => {
    const params1: PaginationParams = { page: 1, limit: 10 };
    const result1 = createPaginationResponse(mockData, 25, params1);
    expect(result1.pagination.hasPreviousPage).toBe(false);

    const params2: PaginationParams = { page: 2, limit: 10 };
    const result2 = createPaginationResponse(mockData, 25, params2);
    expect(result2.pagination.hasPreviousPage).toBe(true);
  });

  it("debe manejar cuando no hay datos", () => {
    const params: PaginationParams = { page: 1, limit: 10 };
    const result = createPaginationResponse([], 0, params);

    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.hasPreviousPage).toBe(false);
  });

  it("debe usar valores por defecto cuando no se proporcionan", () => {
    const result = createPaginationResponse(mockData, 3, {});

    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
  });

  it("debe manejar última página con datos exactos", () => {
    const params: PaginationParams = { page: 2, limit: 10 };
    const result = createPaginationResponse(mockData, 20, params);

    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.hasPreviousPage).toBe(true);
  });
});
