import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";

export interface ClienteCtaCte {
  Id: number;
  Nombre: string;
  Apellido: string;
  Dni: string;
  Mail: string;
  saldo?: number;
}

export interface MovimientoCtaCte {
  id: number;
  fecha: string;
  tipo: string;
  detalles: string;
  debe: number;
  haber: number;
  saldo: number;
}

export interface PagoCtaCteInput {
  clienteId: number;
  monto: number;
  formasPago: {
    tipoPago: number;
    monto: number;
  }[];
}

export function useCtaCte() {
  const queryClient = useQueryClient();

  // Search Clients
  const useBuscarClientes = (query: string) => {
    return useQuery({
      queryKey: ["clientes-ctacte-search", query],
      queryFn: async () => {
        if (!query) return [];
        const res = await fetch(`/api/clientes?q=${query}`);
        const data = await res.json();
        return (data.data as ClienteCtaCte[]) || [];
      },
      enabled: false, // Manual trigger via refetch
    });
  };

  // Get Movements
  const useMovimientosCliente = (clienteId: number | undefined) => {
    return useQuery({
      queryKey: ["ctacte-movimientos", clienteId],
      queryFn: async () => {
        if (!clienteId) return [];
        const res = await fetch(`/api/CtaCteCliente?clienteId=${clienteId}`);
        const data = await res.json();
        return (data.items as MovimientoCtaCte[]) || [];
      },
      enabled: !!clienteId,
    });
  };

  // Register Payment
  const registrarPagoMutation = useMutation({
    mutationFn: async (input: PagoCtaCteInput) => {
      const response = await fetch("/api/CtaCteCliente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar el pago");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate movements for the specific client
      queryClient.invalidateQueries({
        queryKey: ["ctacte-movimientos", variables.clienteId],
      });
      // Also potentially invalidate client search if it shows balances
      queryClient.invalidateQueries({
        queryKey: ["clientes-ctacte-search"],
      });
    },
  });

  return {
    useBuscarClientes,
    useMovimientosCliente,
    registrarPago: registrarPagoMutation.mutateAsync,
    isRegistrandoPago: registrarPagoMutation.isPending,
  };
}
