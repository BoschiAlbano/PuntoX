import { useQuery } from "@tanstack/react-query";

export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  esPrincipal: boolean;
  estaActiva: boolean;
  fechaCreacion: string;
  cantidadUsuarios: number;
}

export const fetchSucursales = async (): Promise<Sucursal[]> => {
  const res = await fetch("/api/sucursales");
  if (!res.ok) throw new Error("Error fetching sucursales");
  const data = await res.json();
  return Array.isArray(data?.sucursales) ? data.sucursales : [];
};

export function useSucursales() {
  return useQuery({
    queryKey: ["sucursales"],
    queryFn: fetchSucursales,
  });
}
