import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";

export interface ProveedorCtaCte {
  Id: number;
  RazonSocial: string;
  CUIT?: string;
  Mail?: string;
  saldo?: number;
}

export interface MovimientoCtaCteProveedor {
  id: number;
  fecha: string;
  tipo: string;
  detalles: string;
  debe: number;
  haber: number;
  saldo: number;
}

export interface PagoCtaCteProveedorInput {
  proveedorId: number;
  monto: number;
  formasPago: {
    tipoPago: number;
    monto: number;
  }[];
}

export function useCtaCteProveedor() {
  const queryClient = useQueryClient();

  // Search Proveedores
  const useBuscarProveedores = (query: string) => {
    return useQuery({
      queryKey: ["proveedores-ctacte-search", query],
      queryFn: async () => {
        if (!query) return [];
        const res = await fetch(`/api/proveedores?q=${query}`);
        const data = await res.json();
        return (data.data as ProveedorCtaCte[]) || [];
      },
      enabled: false, // Manual trigger via refetch
    });
  };

  // Get Movements
  const useMovimientosProveedor = (proveedorId: number | undefined) => {
    return useQuery({
      queryKey: ["ctacte-movimientos-proveedor", proveedorId],
      queryFn: async () => {
        if (!proveedorId) return [];
        const res = await fetch(`/api/proveedores/cta-cte?proveedorId=${proveedorId}`);
        const data = await res.json();
        return (data.items as MovimientoCtaCteProveedor[]) || [];
      },
      enabled: !!proveedorId,
    });
  };

  // Register Payment
  const registrarPagoMutation = useMutation({
    mutationFn: async (input: PagoCtaCteProveedorInput) => {
      const response = await fetch("/api/proveedores/cta-cte", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar el pago al proveedor");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate movements for the specific proveedor
      queryClient.invalidateQueries({
        queryKey: ["ctacte-movimientos-proveedor", variables.proveedorId],
      });
      // Also potentially invalidate search if it shows balances
      queryClient.invalidateQueries({
        queryKey: ["proveedores-ctacte-search"],
      });
    },
  });

  return {
    useBuscarProveedores,
    useMovimientosProveedor,
    registrarPago: registrarPagoMutation.mutateAsync,
    isRegistrandoPago: registrarPagoMutation.isPending,
  };
}
