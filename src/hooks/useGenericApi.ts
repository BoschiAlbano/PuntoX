/**
 * Hook genérico para APIs CRUD paginadas.
 * Soporta búsqueda, paginación, extraParams (ej: bajoStock) y transformer.
 * Usado por GenericCrud.
 * @see docs/ui/crud-tablas-genericas.md
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { PaginationMeta } from "./useProductos";
import { dynamicDataQueryOptions } from "@/lib/react-query/queryDefaults";

// Interfaces Genéricas
export interface ApiResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface GenericApiOptions<T> {
  endpoint: string;
  queryKey: string;
  search?: string;
  page?: number;
  limit?: number;
  /** Parámetros extra para la query (ej: bajoStock para /api/productos) */
  extraParams?: Record<string, string | number | boolean>;
  transformer?: (data: unknown) => T[]; // Para transformar datos si la API devuelve estructura plana
  additionalInvalidateQueryKeys?: any[];
}

async function fetchWithParams<T>(opts: {
  endpoint: string;
  search: string;
  page: number;
  limit: number;
  extraParams?: Record<string, string | number | boolean>;
  transformer?: (data: unknown) => T[];
  signal?: AbortSignal;
}) {
  const { endpoint, search, page, limit, extraParams, transformer, signal } =
    opts;
  const params = new URLSearchParams();
  if (search) params.append("q", search);
  params.append("page", String(page));
  params.append("limit", String(limit));
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "")
        params.append(k, String(v));
    });
  }
  const cleanEndpoint = endpoint.endsWith("/")
    ? endpoint.slice(0, -1)
    : endpoint;
  const url = `${cleanEndpoint}?${params.toString()}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Error al cargar datos");
  const json = await response.json();
  const data: T[] = transformer
    ? transformer(json.data || [])
    : ((json.data || []) as T[]);
  const meta = json.meta ||
    json.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };
  return { data, meta };
}

export function useGenericApi<T extends { Id: number | string }>({
  endpoint,
  queryKey,
  search = "",
  page = 1,
  limit = 10,
  extraParams,
  transformer,
  additionalInvalidateQueryKeys = [],
}: GenericApiOptions<T>) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [queryKey, { search, page, limit, extraParams }],
    queryFn: ({ signal }) =>
      fetchWithParams<T>({
        endpoint,
        search,
        page,
        limit,
        extraParams,
        transformer,
        signal,
      }),
    ...dynamicDataQueryOptions,
  });

  /** Prefetch con params alternativos (ej. bajoStock=true) para que el clic sea instantáneo */
  const prefetchWithParams = useCallback(
    (overrides: {
      search?: string;
      page?: number;
      extraParams?: Record<string, string | number | boolean>;
    }) => {
      const k = [
        queryKey,
        {
          search: overrides.search ?? search,
          page: overrides.page ?? page,
          limit,
          extraParams: overrides.extraParams ?? extraParams,
        },
      ];
      return queryClient.prefetchQuery({
        queryKey: k,
        queryFn: ({ signal }) =>
          fetchWithParams<T>({
            endpoint,
            search: overrides.search ?? search,
            page: overrides.page ?? page,
            limit,
            extraParams: overrides.extraParams ?? extraParams,
            transformer,
            signal,
          }),
      });
    },
    [
      queryKey,
      queryClient,
      search,
      page,
      limit,
      extraParams,
      transformer,
      endpoint,
    ],
  );

  // --- Mutations ---

  // SAVE (Create / Update)
  const saveMutation = useMutation({
    mutationFn: async ({
      data,
      isEdit,
    }: {
      data: Partial<T>;
      isEdit: boolean;
    }) => {
      const cleanEndpoint = endpoint.endsWith("/")
        ? endpoint.slice(0, -1)
        : endpoint;
      const url = cleanEndpoint;
      // Empleados usa PUT para edición, otros endpoints usan PATCH
      const method = isEdit
        ? endpoint.includes("/empleados")
          ? "PUT"
          : "PATCH"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      additionalInvalidateQueryKeys.forEach((key) => {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(key) ? key : [key],
        });
      });
    },
  });

  // DELETE
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const cleanEndpoint = endpoint.endsWith("/")
        ? endpoint.slice(0, -1)
        : endpoint;

      // Empleados usa body con personaId, otros endpoints usan query param con Id
      const isEmpleados = endpoint.includes("/empleados");

      let response: Response;
      if (isEmpleados) {
        // Para empleados, necesitamos obtener el personaId del item completo
        // Pero como solo recibimos el id, asumimos que el id es el personaId
        // O mejor, necesitamos recibir el item completo
        // Por ahora, asumimos que el id pasado es el personaId
        response = await fetch(cleanEndpoint, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId: id }),
        });
      } else {
        // Otros endpoints usan query param
        const url = `${cleanEndpoint}/?Id=${id}`;
        response = await fetch(url, { method: "DELETE" });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      additionalInvalidateQueryKeys.forEach((key) => {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(key) ? key : [key],
        });
      });
    },
  });

  return {
    data: query.data?.data || [],
    prefetchWithParams,
    paginationMeta: query.data?.meta || {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    fetchStatus: query.fetchStatus,
    isPlaceholderData: query.isPlaceholderData,
    isError: query.isError,
    error: query.error,
    saveMutation,
    deleteMutation,
    refetch: query.refetch,
  };
}
