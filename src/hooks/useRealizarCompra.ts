import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";

interface DetalleCompra {
  articuloId: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  preciosListaActualizados: { ListaPrecioId: number; PorcentajeGanancia: number; PrecioFinal: number }[];
}

interface PagoCompra {
  tipoPago: number;
  monto: number;
}

interface CompraPayload {
  proveedorId: number;
  detalles: DetalleCompra[];
  formasPago: PagoCompra[];
  fecha: string;
}

export function useRealizarCompra(onSuccess?: (data: any) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CompraPayload) => {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al registrar la compra");
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidar queries de stock, artículos y caja para refrescar datos
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      queryClient.removeQueries({ queryKey: ["productos-generic"] });
      queryClient.removeQueries({ queryKey: ["producto-detail"] });
      queryClient.invalidateQueries({ queryKey: ["caja"] });
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });

      addToast({
        title: "Compra registrada",
        description: `Comprobante #${data.comprobante.numero} registrado con éxito`,
        color: "success",
      });

      onSuccess?.(data);
    },
    onError: (err: Error) => {
      addToast({
        title: "Error al registrar compra",
        description: err.message,
        color: "danger",
      });
    },
  });
}
