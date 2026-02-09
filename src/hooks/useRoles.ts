import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";
import { dynamicDataQueryOptions } from "@/lib/react-query/queryDefaults";
import { handleError } from "@/lib/auth/errorHandler";
import { type TipoPerfil } from "@/lib/constants/comprobantes";

export type Rol = {
  id: number;
  nombre: string;
  usuarios: number;
  tipo: TipoPerfil;
  descripcion?: string | null;
  permisos?: string[];
};

export type CreateRolData = {
  nombre: string;
  descripcion: string;
  permisos: string[];
  tipo: TipoPerfil;
};

export type UpdateRolData = {
  id: number;
  data: Partial<CreateRolData>;
};

// Fetchers
const fetchRoles = async () => {
  const response = await fetch("/api/roles");
  if (!response.ok) throw new Error("Error al cargar roles");
  return await response.json();
};

const createRol = async (data: CreateRolData) => {
  const response = await fetch("/api/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al crear rol");
  }
  return await response.json();
};

const updateRol = async ({ id, data }: UpdateRolData) => {
  const response = await fetch(`/api/roles?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al actualizar rol");
  }
  return await response.json();
};

const deleteRol = async (id: number) => {
  const response = await fetch(`/api/roles?id=${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al eliminar rol");
  }
  return await response.json();
};

export function useRoles() {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ["roles-crud"],
    queryFn: fetchRoles,
    ...dynamicDataQueryOptions,
  });

  const createMutation = useMutation({
    mutationFn: createRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-crud"] });
      queryClient.invalidateQueries({ queryKey: ["roles-select"] });
      addToast({
        title: "Rol creado",
        description: "El rol se creó exitosamente",
        color: "success",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al crear rol");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-crud"] });
      queryClient.invalidateQueries({ queryKey: ["roles-select"] });
      addToast({
        title: "Rol actualizado",
        description: "Los cambios se guardaron exitosamente",
        color: "success",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al actualizar rol");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-crud"] });
      queryClient.invalidateQueries({ queryKey: ["roles-select"] });
      addToast({
        title: "Rol eliminado",
        description: "El rol se eliminó exitosamente",
        color: "success",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al eliminar rol");
    },
  });

  return {
    // Data
    rolesData: rolesQuery.data, // Contains { roles: [...] }
    isLoading: rolesQuery.isLoading,
    isError: rolesQuery.isError,

    // Actions
    refetch: rolesQuery.refetch,
    createRol: createMutation,
    updateRol: updateMutation,
    deleteRol: deleteMutation,
  };
}
