import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PaginationMeta } from "./useProductos";

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
  transformer?: (data: any) => T[]; // Para transformar datos si la API devuelve estructura plana
}

export function useGenericApi<T extends { Id: number | string }>({
  endpoint,
  queryKey,
  search = "",
  page = 1,
  limit = 10,
  transformer,
}: GenericApiOptions<T>) {
  const queryClient = useQueryClient();

  // --- Fetch Query ---
  const fetchData = async ({ signal }: { signal: AbortSignal }) => {
    const params = new URLSearchParams();
    if (search) params.append("q", search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    // Asegurar que el endpoint no termine en /
    const cleanEndpoint = endpoint.endsWith("/")
      ? endpoint.slice(0, -1)
      : endpoint;
    const url = `${cleanEndpoint}?${params.toString()}`;

    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error("Error al cargar datos");
    const json = await response.json();

    // Si hay transformer, usarlo. Si no, asumir que json.data es el array
    const data = transformer ? transformer(json.data) : (json.data as T[]);
    const meta = json.meta ||
      json.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };

    return { data, meta };
  };

  const query = useQuery({
    queryKey: [queryKey, { search, page, limit }],
    queryFn: ({ signal }) => fetchData({ signal }),
  });

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
      const method = isEdit ? "PATCH" : "POST";

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
    },
  });

  // DELETE
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const cleanEndpoint = endpoint.endsWith("/")
        ? endpoint.slice(0, -1)
        : endpoint;
      const url = `${cleanEndpoint}/?Id=${id}`; // Asume que la API borra por query param Id

      const response = await fetch(url, { method: "DELETE" });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  return {
    data: query.data?.data || [],
    paginationMeta: query.data?.meta || {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    saveMutation,
    deleteMutation,
    refetch: query.refetch,
  };
}
