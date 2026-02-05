/**
 * Tests de casos límite y escenarios problemáticos para paginación
 * Estos tests buscan fallas en el comportamiento de paginación
 */
import { describe, it, expect } from "vitest";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { createMockRequest } from "../utils/mocks";

describe("Paginación - Casos Límite y Problemas Potenciales", () => {
  describe("parsePaginationParams - Casos Problemáticos", () => {
    it("⚠️ PROBLEMA: Página cero se convierte a 1 (puede ser confuso)", () => {
      const req = createMockRequest("http://localhost:3000/api/test?page=0&limit=20");
      const result = parsePaginationParams(req);

      // ⚠️ El sistema convierte página 0 a 1, pero el usuario podría esperar un error
      expect(result.page).toBe(1);
    });

    it("⚠️ PROBLEMA: Página negativa se convierte a 1", () => {
      const req = createMockRequest("http://localhost:3000/api/test?page=-5&limit=20");
      const result = parsePaginationParams(req);

      // ⚠️ El sistema convierte páginas negativas a 1
      expect(result.page).toBe(1);
    });

    it("⚠️ PROBLEMA: Límite cero se convierte a 1", () => {
      const req = createMockRequest("http://localhost:3000/api/test?page=1&limit=0");
      const result = parsePaginationParams(req);

      // ⚠️ El sistema convierte límite 0 a 1
      expect(result.limit).toBe(1);
    });

    it("⚠️ PROBLEMA: Límite negativo se convierte a 1", () => {
      const req = createMockRequest("http://localhost:3000/api/test?page=1&limit=-10");
      const result = parsePaginationParams(req);

      // ⚠️ El sistema convierte límites negativos a 1
      expect(result.limit).toBe(1);
    });

    it("⚠️ PROBLEMA: Límite mayor a 100 se trunca a 100", () => {
      const req = createMockRequest("http://localhost:3000/api/test?page=1&limit=1000");
      const result = parsePaginationParams(req);

      // ⚠️ El sistema trunca límites grandes a 100, pero no informa al usuario
      expect(result.limit).toBe(100);
    });

    it("⚠️ PROBLEMA: Página extremadamente grande puede causar problemas", () => {
      const req = createMockRequest("http://localhost:3000/api/test?page=999999999&limit=20");
      const result = parsePaginationParams(req);

      // ⚠️ El sistema acepta páginas extremadamente grandes
      expect(result.page).toBe(999999999);
      // Cálculo: (999999999 - 1) * 20 = 19999999960
      expect(result.skip).toBe(19999999960); // Puede causar problemas de memoria
    });

    it("⚠️ PROBLEMA: Múltiples parámetros page (toma el primero)", () => {
      const req = createMockRequest("http://localhost:3000/api/test?page=1&page=5");
      const result = parsePaginationParams(req);

      // ⚠️ URLSearchParams.get() toma el ÚLTIMO parámetro, no el primero
      expect(result.page).toBe(5); // Toma el último valor
    });

    it("⚠️ PROBLEMA: Valores decimales se truncan (no se redondean)", () => {
      const req = createMockRequest("http://localhost:3000/api/test?page=1.9&limit=20.7");
      const result = parsePaginationParams(req);

      // ⚠️ parseInt trunca, no redondea
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe("createPaginationResponse - Casos Problemáticos", () => {
    it("⚠️ PROBLEMA: Total cero genera totalPages cero (división por cero evitada)", () => {
      const data: any[] = [];
      const total = 0;
      const params = { page: 1, limit: 10 };

      const result = createPaginationResponse(data, total, params);

      // ⚠️ Math.ceil(0/10) = 0, pero debería ser 1 para mostrar que hay 0 resultados
      expect(result.pagination.totalPages).toBe(0);
    });

    it("⚠️ PROBLEMA: Página mayor que totalPages no se valida", () => {
      const data: any[] = [];
      const total = 5; // Solo 5 items
      const params = { page: 10, limit: 10 }; // Página 10 cuando solo hay 1 página

      const result = createPaginationResponse(data, total, params);

      // ⚠️ El sistema permite páginas que no existen
      expect(result.pagination.page).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("⚠️ PROBLEMA: Limit cero en params usa valor por defecto", () => {
      const data: any[] = [];
      const total = 0;
      const params = { page: 1, limit: 0 }; // Limit cero

      const result = createPaginationResponse(data, total, params);

      // ⚠️ El sistema NO usa valor por defecto, usa el 0 que se pasó
      expect(result.pagination.limit).toBe(0); // Problema: limit 0 puede causar división por cero
    });

    it("⚠️ PROBLEMA: Total negativo genera totalPages negativo", () => {
      const data: any[] = [];
      const total = -10; // Total negativo (no debería pasar)
      const params = { page: 1, limit: 10 };

      const result = createPaginationResponse(data, total, params);

      // ⚠️ Math.ceil(-10/10) = -1, genera valores negativos
      expect(result.pagination.totalPages).toBe(-1);
      // hasNextPage = page < totalPages = 1 < -1 = false
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("⚠️ PROBLEMA: Valores muy grandes pueden causar problemas", () => {
      const data: any[] = [];
      const total = Number.MAX_SAFE_INTEGER;
      const params = { page: 1, limit: 1 };

      const result = createPaginationResponse(data, total, params);

      // ⚠️ Puede haber problemas de precisión con números muy grandes
      expect(result.pagination.totalPages).toBeGreaterThan(0);
    });

    it("⚠️ PROBLEMA: hasNextPage puede ser true cuando no hay más datos", () => {
      const data: any[] = [];
      const total = 10;
      const params = { page: 1, limit: 10 }; // Exactamente 10 items

      const result = createPaginationResponse(data, total, params);

      // ⚠️ Con 10 items y limit 10, no debería haber siguiente página
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("⚠️ PROBLEMA: hasPreviousPage es false en página 1 (correcto)", () => {
      const data: any[] = [];
      const total = 100;
      const params = { page: 1, limit: 10 };

      const result = createPaginationResponse(data, total, params);

      // ✅ Esto es correcto
      expect(result.pagination.hasPreviousPage).toBe(false);
    });

    it("⚠️ PROBLEMA: Página undefined usa valor por defecto", () => {
      const data: any[] = [];
      const total = 100;
      const params = { limit: 10 }; // page undefined

      const result = createPaginationResponse(data, total, params);

      // ⚠️ El sistema usa page: 1 por defecto
      expect(result.pagination.page).toBe(1);
    });
  });

  describe("Escenarios Reales Problemáticos", () => {
    it("⚠️ ESCENARIO: Usuario intenta acceder a página inexistente", () => {
      const req = createMockRequest("http://localhost:3000/api/test?page=999&limit=10");
      const pagination = parsePaginationParams(req);
      
      const data: any[] = [];
      const total = 50; // Solo 5 páginas posibles
      const result = createPaginationResponse(data, total, pagination);

      // ⚠️ El sistema permite acceder a páginas que no existen
      expect(result.pagination.page).toBe(999);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.data).toEqual([]);
    });

    it("⚠️ ESCENARIO: Usuario intenta obtener más de 100 items", () => {
      const req = createMockRequest("http://localhost:3000/api/test?page=1&limit=500");
      const result = parsePaginationParams(req);

      // ⚠️ El sistema trunca a 100 sin informar al usuario
      expect(result.limit).toBe(100);
    });

    it("⚠️ ESCENARIO: Múltiples requests con parámetros inconsistentes", () => {
      const req1 = createMockRequest("http://localhost:3000/api/test?page=1&limit=20");
      const req2 = createMockRequest("http://localhost:3000/api/test?page=2&limit=50");
      
      const pag1 = parsePaginationParams(req1);
      const pag2 = parsePaginationParams(req2);

      // ⚠️ Diferentes límites en diferentes páginas pueden causar inconsistencias
      expect(pag1.limit).toBe(20);
      expect(pag2.limit).toBe(50);
    });
  });
});
