import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Notificacion {
  Id: string;
  TenantId: string;
  UsuarioId: string | null;
  Tipo: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  Titulo: string;
  Mensaje: string;
  Leida: boolean;
  AccionUrl: string | null;
  Fecha: string;
  EntidadTipo: string | null;
  EntidadId: string | null;
}

export function useNotificaciones() {
  const queryClient = useQueryClient();

  // Polling cada 2 minutos = 120000ms
  const query = useQuery({
    queryKey: ["notificaciones"],
    queryFn: async () => {
      const res = await fetch("/api/notificaciones?limit=20");
      if (!res.ok) throw new Error("Error fetching notificaciones");
      return res.json() as Promise<{
        data: Notificacion[];
        pagination: { unreadCount: number; total: number };
      }>;
    },
    refetchInterval: 120000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });

  return {
    ...query,
    markAsRead: markAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
}
