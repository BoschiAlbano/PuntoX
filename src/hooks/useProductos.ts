import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productoListAdapter } from "@/lib/adapters/producto.adapter";
import { Producto } from "@/lib/validations/producto.schema";
import { Marca } from "@/lib/validations/marca.schema";
import { Rubro } from "@/lib/validations/rubro.schema";
import { UnidadMedida } from "@/lib/validations/unidad-medida.schema";
import { Iva } from "@/lib/validations/iva.schema";

export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductosResponse {
  data: Producto[];
  meta: PaginationMeta;
}

const fetchProductos = async ({
  signal,
  search = "",
  page = 1,
  limit = 10,
}: {
  signal: AbortSignal;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProductosResponse> => {
  const params = new URLSearchParams();
  if (search) params.append("q", search);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const response = await fetch(`/api/productos?${params.toString()}`, {
    signal,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `Error al cargar productos (${response.status})`;
    console.error("[useProductos] Error en fetch:", errorMessage, errorData);
    throw new Error(errorMessage);
  }
  const data = await response.json();

  return {
    data: productoListAdapter(data?.data || []),
    meta: data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 },
  };
};

const fetchMarcas = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Marca[]> => {
  const response = await fetch("/api/marcas", { signal });
  if (!response.ok) throw new Error("Error");
  const data = await response.json();
  return Array.isArray(data?.marcas) ? data.marcas : [];
};

const fetchRubros = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Rubro[]> => {
  const response = await fetch("/api/rubros", { signal });
  if (!response.ok) throw new Error("Error");
  const data = await response.json();
  return Array.isArray(data?.rubros) ? data.rubros : [];
};

const fetchUnidades = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<UnidadMedida[]> => {
  const response = await fetch("/api/unidades-medida", { signal });
  if (!response.ok) throw new Error("Error");
  const data = await response.json();
  return Array.isArray(data?.unidades) ? data.unidades : [];
};

const fetchIvas = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Iva[]> => {
  const response = await fetch("/api/ivas", { signal });
  if (!response.ok) throw new Error("Error");
  const data = await response.json();
  return Array.isArray(data?.ivas) ? data.ivas : [];
};

export function useProductos({
  fetchAuxiliary = false,
  search = "",
  page = 1,
  limit = 10,
} = {}) {
  const queryClient = useQueryClient();

  // Queries
  const productosQuery = useQuery({
    queryKey: ["productos", { search, page, limit }],
    queryFn: ({ signal }) => fetchProductos({ signal, search, page, limit }),
  });

  const marcasQuery = useQuery({
    queryKey: ["marcas"],
    queryFn: fetchMarcas,
    enabled: fetchAuxiliary,
  });

  const rubrosQuery = useQuery({
    queryKey: ["rubros"],
    queryFn: fetchRubros,
    enabled: fetchAuxiliary,
  });

  const unidadesQuery = useQuery({
    queryKey: ["unidades-medida"],
    queryFn: fetchUnidades,
    enabled: fetchAuxiliary,
  });

  const ivasQuery = useQuery({
    queryKey: ["ivas"],
    queryFn: fetchIvas,
    enabled: fetchAuxiliary,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async ({
      data,
      isEdit,
    }: {
      data: Partial<Producto>;
      isEdit: boolean;
    }) => {
      // Validaciones básicas antes de enviar
      if (!data.Descripcion || data.Descripcion.trim() === "") {
        throw {
          error: "Error de validación",
          details: [
            { field: "Descripcion", message: "La descripción es obligatoria" },
          ],
        } as ApiError;
      }

      if (!data.CodigoBarra || data.CodigoBarra.trim() === "") {
        throw {
          error: "Error de validación",
          details: [
            {
              field: "CodigoBarra",
              message: "El código de barras es obligatorio",
            },
          ],
        } as ApiError;
      }

      const url = "/api/productos";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/productos/?Id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });

  return {
    productos: productosQuery.data?.data || [],
    paginationMeta: productosQuery.data?.meta || {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
    isLoadingProductos: productosQuery.isLoading,
    isErrorProductos: productosQuery.isError,
    marcas: marcasQuery.data || [],
    rubros: rubrosQuery.data || [],
    unidades: unidadesQuery.data || [],
    ivas: ivasQuery.data || [],
    saveMutation,
    deleteMutation,
  };
}
