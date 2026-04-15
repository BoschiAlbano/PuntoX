import { useGenericApi } from "./useGenericApi";
import { Proveedor } from "@/lib/validations/proveedor.schema";

export function useProveedores(options?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useGenericApi<Proveedor>({
    endpoint: "/api/proveedores",
    queryKey: "proveedores",
    search: options?.search,
    page: options?.page,
    limit: options?.limit,
  });
}
