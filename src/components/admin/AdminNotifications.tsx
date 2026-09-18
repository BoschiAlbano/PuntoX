"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Badge,
  Spinner,
  ScrollShadow,
} from "@heroui/react";
import {
  Bell,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuery<{
    data: Notificacion[];
    unreadCount: number;
  }>({
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
    fetch("/api/admin/check-subscriptions")
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["admin-notificaciones"] });
      })
      .catch(console.error);
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
      case "ERROR":
        return <XCircle className="w-5 h-5 text-danger" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <Popover
      placement="bottom-end"
      offset={18}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      classNames={{
        base: "before:bg-white",
        content:
          "p-0 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl",
      }}
    >
      <PopoverTrigger>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-(--nav-btn-text) transition-colors hover:bg-(--nav-btn-hover-bg) hover:text-(--nav-btn-hover-text)"
          aria-label="Ver notificaciones"
        >
          {unreadCount > 0 ? (
            <Badge
              content={unreadCount > 99 ? "99+" : unreadCount}
              placement="top-right"
              size="sm"
            >
              <Bell strokeWidth={2} />
            </Badge>
          ) : (
            <Bell strokeWidth={2} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col w-full max-h-[500px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Notificaciones</h3>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="light"
                color="primary"
                className="text-xs font-medium"
                onPress={() => markAsReadMutation.mutate(undefined)}
                isLoading={markAsReadMutation.isPending}
                startContent={
                  !markAsReadMutation.isPending && <Check size={14} />
                }
              >
                Marcar leídas
              </Button>
            )}
          </div>
          <ScrollShadow className="flex flex-col w-full overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Spinner size="sm" color="primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8 flex flex-col items-center gap-2">
                <div className="p-3 bg-slate-50 rounded-full">
                  <Bell className="text-slate-300" size={24} />
                </div>
                <p className="text-sm font-medium text-slate-600 mt-2">
                  Todo al día
                </p>
                <p className="text-xs text-slate-400">
                  No hay notificaciones nuevas
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 p-4 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50"
                  >
                    <div className="shrink-0 mt-0.5">{getIcon(notif.tipo)}</div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {notif.titulo}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap pt-1">
                          {formatDistanceToNow(new Date(notif.fecha), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {notif.mensaje}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {notif.accionUrl && (
                          <Link
                            href={notif.accionUrl}
                            className="text-xs font-semibold text-[#67afc3] hover:underline"
                            onClick={() => setIsOpen(false)}
                          >
                            Ver detalle
                          </Link>
                        )}
                        <button
                          onClick={() => markAsReadMutation.mutate(notif.id)}
                          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          Marcar leída
                        </button>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-2" />
                  </div>
                ))}
              </div>
            )}
          </ScrollShadow>
        </div>
      </PopoverContent>
    </Popover>
  );
}
