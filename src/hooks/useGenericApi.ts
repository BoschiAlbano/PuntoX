import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PaginationMeta } from "./useProductos";
import { dynamicDataQueryOptions } from "@/lib/react-query/queryDefaults";
import { useUserStore } from "@/store/useUserStore";

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
  transformer?: (data: unknown) => T[]; // Para transformar datos si la API devuelve estructura plana
  additionalInvalidateQueryKeys?: any[];
}

export function useGenericApi<T extends { Id: number | string }>({
  endpoint,
  queryKey,
  search = "",
  page = 1,
  limit = 10,
  transformer,
  additionalInvalidateQueryKeys = [],
}: GenericApiOptions<T>) {
  const queryClient = useQueryClient();

  //sucursalId
  // const { currentBranch } = useUserStore();

  // --- Fetch Query ---
  const fetchData = async ({ signal }: { signal: AbortSignal }) => {
    const params = new URLSearchParams();
    // Usa "q" para búsqueda en todos los endpoints
    const searchParam = "q";
    if (search) params.append(searchParam, search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    // params.append("sucursalId", currentBranch?.Id?.toString());
    // Asegurar que el endpoint no termine en /
    const cleanEndpoint = endpoint.endsWith("/")
      ? endpoint.slice(0, -1)
      : endpoint;
    const url = `${cleanEndpoint}?${params.toString()}`;

    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error("Error al cargar datos");
    const json = await response.json();

    // Adaptar respuesta: empleados devuelve { empleados: [...], pagination: {...} }
    // otros endpoints devuelven { data: [...], meta: {...} }
    // Adaptar respuesta: empleados devuelve { empleados: [...], pagination: {...} }
    // otros endpoints devuelven { data: [...], meta: {...} }

    const data: T[] = transformer
      ? transformer(json.data || [])
      : ((json.data || []) as T[]);

    const meta = json.meta ||
      json.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
    // if (endpoint.includes("/empleados")) {
    //   // Formato de empleados: { empleados: [...], pagination: {...} }
    //   data = transformer
    //     ? transformer(json.empleados || json.data || [])
    //     : ((json.empleados || json.data || []) as T[]);
    //   // Asegurar que meta tenga la estructura correcta
    //   const pagination = json.pagination || {};
    //   meta = {
    //     total: pagination.total || 0,
    //     page: pagination.page || 1,
    //     limit: pagination.limit || limit,
    //     totalPages:
    //       pagination.totalPages ||
    //       Math.ceil((pagination.total || 0) / (pagination.limit || limit)) ||
    //       1,
    //   };
    // } else {
    //   // Formato estándar
    //   data = transformer
    //     ? transformer(json.data || [])
    //     : ((json.data || []) as T[]);
    //   meta = json.meta ||
    //     json.pagination || {
    //       total: 0,
    //       page: 1,
    //       limit: 10,
    //       totalPages: 0,
    //     };
    // }

    return { data, meta };
  };

  const query = useQuery({
    queryKey: [queryKey, { search, page, limit }],
    queryFn: ({ signal }) => fetchData({ signal }),
    ...dynamicDataQueryOptions, // Aplicar optimizaciones por defecto
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
