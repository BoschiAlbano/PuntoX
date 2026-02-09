import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/store/useUserStore";
import { staticDataQueryOptions } from "@/lib/react-query/queryDefaults";

export type ConceptoGasto = {
  Id: number;
  Descripcion: string;
};

export type GastoPayment = {
  tipoPago: number;
  monto: number;
};

export type CreateGastoInput = {
  conceptoId: number;
  descripcion: string;
  pagos: GastoPayment[];
};

export type UpdateGastoInput = CreateGastoInput & {
  id: number;
};

const fetchConceptosGastos = async (
  sucursalId: number | undefined,
): Promise<ConceptoGasto[]> => {
  if (!sucursalId) return [];
  const response = await fetch(
    `/api/conceptos-gastos?sucursalId=${sucursalId}`,
  );
  if (!response.ok) throw new Error("Error al obtener conceptos de gastos");
  const data = await response.json();
  return data.conceptosGasto || [];
};

export function useGastos(options?: { enableConceptos?: boolean }) {
  const { enableConceptos = false } = options || {};
  const { currentBranch } = useUserStore();
  const queryClient = useQueryClient();
  const sucursalId = currentBranch?.Id ? Number(currentBranch.Id) : undefined;

  // Query Conceptos de Gasto
  const conceptosQuery = useQuery({
    queryKey: ["conceptos-gastos", sucursalId],
    queryFn: () => fetchConceptosGastos(sucursalId),
    enabled: !!sucursalId && enableConceptos,
    ...staticDataQueryOptions,
  });

  const agregarGastoMutation = useMutation({
    mutationFn: async ({
      conceptoId,
      descripcion,
      pagos,
    }: CreateGastoInput) => {
      if (!sucursalId) throw new Error("No hay sucursal seleccionada");
      const response = await fetch(`/api/gastos?sucursalId=${sucursalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptoGastoId: conceptoId,
          descripcion,
          pagos,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar el gasto");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caja"] });
    },
  });

  const editarGastoMutation = useMutation({
    mutationFn: async ({
      id,
      conceptoId,
      descripcion,
      pagos,
    }: UpdateGastoInput) => {
      if (!sucursalId) throw new Error("No hay sucursal seleccionada");
      const response = await fetch(
        `/api/gastos?id=${id}&sucursalId=${sucursalId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conceptoGastoId: conceptoId,
            descripcion,
            pagos,
          }),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar el gasto");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caja"] });
    },
  });

  const eliminarGastoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/gastos?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar el gasto");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caja"] });
    },
  });

  const agregarConceptoGastoMutation = useMutation({
    mutationFn: async (descripcion: string) => {
      const response = await fetch("/api/conceptos-gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Descripcion: descripcion }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear concepto");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conceptos-gastos"] });
    },
  });

  return {
    conceptosGasto: conceptosQuery.data || [],
    isLoadingConceptos: conceptosQuery.isLoading,

    agregarGasto: agregarGastoMutation.mutateAsync,
    editarGasto: editarGastoMutation.mutateAsync,
    eliminarGasto: eliminarGastoMutation.mutateAsync,
    agregarConceptoGasto: agregarConceptoGastoMutation.mutateAsync,

    isAddingGasto: agregarGastoMutation.isPending,
    isEditingGasto: editarGastoMutation.isPending,
    isDeletingGasto: eliminarGastoMutation.isPending,
    isAddingConcepto: agregarConceptoGastoMutation.isPending,
  };
}
