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

const fetchProductos = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Producto[]> => {
  const response = await fetch("/api/productos", { signal });
  if (!response.ok) throw new Error("Error al cargar productos");
  const data = await response.json();
  return productoListAdapter(data?.productos);
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

export function useProductos({ fetchAuxiliary = false } = {}) {
  const queryClient = useQueryClient();

  // Queries
  const productosQuery = useQuery({
    queryKey: ["productos"],
    queryFn: fetchProductos,
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
    productos: productosQuery.data || [],
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
