/**
 * Tests para el hook useSucursales
 * - Verifica el fetcher y manejo de errores
 * - Documenta el comportamiento esperado
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const originalFetch = global.fetch;

describe("useSucursales - Fetcher y Manejo de Errores", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("fetchSucursales", () => {
    it("debe retornar array de sucursales cuando la respuesta es exitosa", async () => {
      const mockSucursales = [
        {
          id: 1,
          nombre: "Sucursal Centro",
          direccion: "Calle 1",
          telefono: "1234567890",
          esPrincipal: true,
          estaActiva: true,
          fechaCreacion: "2026-01-01T00:00:00Z",
          cantidadUsuarios: 5,
        },
        {
          id: 2,
          nombre: "Sucursal Norte",
          direccion: "Calle 2",
          telefono: null,
          esPrincipal: false,
          estaActiva: true,
          fechaCreacion: "2026-01-02T00:00:00Z",
          cantidadUsuarios: 3,
        },
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ sucursales: mockSucursales }),
      } as Response);

      const { fetchSucursales } = await import("@/hooks/useSucursales");
      const result = await fetchSucursales();

      expect(result).toEqual(mockSucursales);
      expect(global.fetch).toHaveBeenCalledWith("/api/sucursales");
    });

    it("debe retornar array vacío cuando la respuesta no tiene sucursales", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ sucursales: [] }),
      } as Response);

      const { fetchSucursales } = await import("@/hooks/useSucursales");
      const result = await fetchSucursales();

      expect(result).toEqual([]);
    });

    it("debe retornar array vacío cuando la respuesta no tiene formato esperado", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const { fetchSucursales } = await import("@/hooks/useSucursales");
      const result = await fetchSucursales();

      expect(result).toEqual([]);
    });

    it("debe lanzar error cuando la respuesta no es exitosa", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      const { fetchSucursales } = await import("@/hooks/useSucursales");

      await expect(fetchSucursales()).rejects.toThrow("Error fetching sucursales");
    });
  });
});
