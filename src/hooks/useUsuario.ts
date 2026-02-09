import { useQuery } from "@tanstack/react-query";
import { useRoles } from "./useRoles";
import { useSucursales } from "./useSucursales";

// Interfaces
export interface Provincia {
  id: number | string;
  Descripcion: string;
}

export interface Departamento {
  id: number | string;
  Descripcion: string;
  ProvinciaId: number;
}

export interface Localidad {
  id: number | string;
  Descripcion: string;
  DepartamentoId: number;
}

// Fetchers
const fetchProvincias = async (): Promise<Provincia[]> => {
  const res = await fetch("/api/provincias");
  if (!res.ok) throw new Error("Error fetching provincias");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const fetchDepartamentos = async (
  provinciaId: number | string,
): Promise<Departamento[]> => {
  if (!provinciaId) return [];
  const res = await fetch(`/api/departamentos?provinciaId=${provinciaId}`);
  if (!res.ok) throw new Error("Error fetching departamentos");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const fetchLocalidades = async (
  departamentoId: number | string,
): Promise<Localidad[]> => {
  if (!departamentoId) return [];
  const res = await fetch(`/api/localidades?departamentoId=${departamentoId}`);
  if (!res.ok) throw new Error("Error fetching localidades");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export function useUsuario() {
  const { rolesData, isLoading: isLoadingRoles } = useRoles();
  // Safe access to the roles array
  const roles = rolesData?.roles || [];

  const { data: sucursales = [], isLoading: isLoadingSucursales } =
    useSucursales();

  const provinciasQuery = useQuery({
    queryKey: ["provincias"],
    queryFn: fetchProvincias,
    staleTime: Infinity, // Provincias rarely change
  });

  const useDepartamentos = (provinciaId: number | string | null | undefined) =>
    useQuery({
      queryKey: ["departamentos", provinciaId],
      queryFn: () => fetchDepartamentos(provinciaId!),
      enabled: !!provinciaId,
      staleTime: Infinity,
    });

  const useLocalidades = (departamentoId: number | string | null | undefined) =>
    useQuery({
      queryKey: ["localidades", departamentoId],
      queryFn: () => fetchLocalidades(departamentoId!),
      enabled: !!departamentoId,
      staleTime: Infinity,
    });

  return {
    // Data
    roles,
    sucursales,
    provincias: provinciasQuery.data || [],

    // Loading states
    isLoadingRoles,
    isLoadingSucursales,
    isLoadingProvincias: provinciasQuery.isLoading,

    // Sub-hooks for dependent data
    useDepartamentos,
    useLocalidades,
  };
}
