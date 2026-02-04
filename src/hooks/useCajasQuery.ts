import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/store/useUserStore";
import { Caja } from "./useCaja";
import { dynamicDataQueryOptions } from "@/lib/react-query/queryDefaults";

export interface CajasFilters {
  q?: string;
  estado?: "todas" | "abierta" | "cerrada";
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface CajasResponse {
  data: Caja[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const fetchCajas = async (
  filters: CajasFilters,
  sucursalId: string | number,
): Promise<CajasResponse> => {
  const params = new URLSearchParams();
  params.set("sucursalId", String(sucursalId));

  if (filters.q) params.set("q", filters.q);
  if (filters.estado && filters.estado !== "todas")
    params.set("estado", filters.estado);
  if (filters.fechaDesde) params.set("fechaDesde", filters.fechaDesde);
  if (filters.fechaHasta) params.set("fechaHasta", filters.fechaHasta);
  params.set("page", String(filters.page || 1));
  params.set("limit", String(filters.limit || 10));

  const response = await fetch(`/api/cajas?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error al obtener las cajas");
  }

  return response.json();
};

export function useCajasQuery(filters: CajasFilters) {
  const { currentBranch } = useUserStore();
  const sucursalId = currentBranch?.Id;

  return useQuery({
    queryKey: ["cajas", sucursalId, filters],
    queryFn: () => fetchCajas(filters, sucursalId!),
    enabled: !!sucursalId,
    ...dynamicDataQueryOptions,
  });
}
