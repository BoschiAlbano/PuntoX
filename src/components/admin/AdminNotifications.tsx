"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Badge,
  Spinner,
} from "@heroui/react";
import { Bell, CheckCircle2, AlertTriangle, Info, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type Notificacion = {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  accionUrl: string | null;
};

export function AdminNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: Notificacion[]; unreadCount: number }>({
    queryKey: ["admin-notificaciones"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notificaciones");
      if (!res.ok) throw new Error("Error fetching notifications");
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Call the check API once to generate any pending notifications
  useEffect(() => {
    fetch("/api/admin/check-subscriptions").then(() => {
      queryClient.invalidateQueries({ queryKey: ["admin-notificaciones"] });
    }).catch(console.error);
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id?: number) => {
      const res = await fetch("/api/admin/notificaciones/marcar-leidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Error marking as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notificaciones"] });
    },
  });

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "WARNING":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "ERROR":
        return <AlertTriangle className="w-5 h-5 text-danger" />;
      case "SUCCESS":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <div className="relative cursor-pointer">
          <Badge
            color="danger"
            content={unreadCount}
            isInvisible={unreadCount === 0}
            shape="circle"
          >
            <Button
              isIconOnly
              variant="light"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
            </Button>
          </Badge>
        </div>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Notificaciones"
        className="w-80"
        itemClasses={{
          base: "gap-4",
        }}
        emptyContent={
          isLoading ? (
            <div className="flex justify-center p-4">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center text-slate-500">
              <Bell className="w-8 h-8 text-slate-300 mb-2" />
              <p>No tienes notificaciones nuevas</p>
            </div>
          )
        }
      >
        {([
          ...notifications.map((notif) => (
            <DropdownItem
              key={notif.id}
              description={
                <div className="flex flex-col gap-1">
                  <span className="text-xs line-clamp-2">{notif.mensaje}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.fecha).toLocaleString("es-AR")}
                  </span>
                </div>
              }
              startContent={getIcon(notif.tipo)}
              onPress={() => {
                markAsReadMutation.mutate(notif.id);
              }}
              href={notif.accionUrl || "#"}
              as={notif.accionUrl ? Link : undefined}
            >
              <span className="font-semibold text-sm">{notif.titulo}</span>
            </DropdownItem>
          )),
          notifications.length > 0 ? (
            <DropdownItem
              key="mark-all-read"
              className="text-center text-primary font-medium"
              onPress={() => markAsReadMutation.mutate(undefined)}
            >
              Marcar todas como leídas
            </DropdownItem>
          ) : (
            <DropdownItem className="hidden" key="empty" />
          )
        ] as any)}
      </DropdownMenu>
    </Dropdown>
  );
}
