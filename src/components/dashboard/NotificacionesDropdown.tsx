"use client";

import { useNotificaciones } from "@/hooks/useNotificaciones";
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
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useState } from "react";

export function NotificacionesDropdown() {
  const {
    data,
    isLoading,
    isError,
    markAsRead,
    markAllAsRead,
    isMarkingAllRead,
  } = useNotificaciones();
  const [isOpen, setIsOpen] = useState(false);

  const notifications = data?.data || [];
  const unreadCount = data?.pagination?.unreadCount || 0;

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "SUCCESS":
        return <CheckCircle2 className="text-green-500" size={20} />;
      case "WARNING":
        return <AlertTriangle className="text-amber-500" size={20} />;
      case "ERROR":
        return <XCircle className="text-red-500" size={20} />;
      case "INFO":
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  return (
    <Popover
      placement="bottom-end"
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
          className="relative text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-100"
          aria-label="Ver notificaciones"
        >
          {unreadCount > 0 ? (
            <Badge
              content={unreadCount > 99 ? "99+" : unreadCount}
              color="danger"
              shape="circle"
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
        <div className="flex flex-col w-full h-full max-h-[500px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Notificaciones</h3>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="light"
                color="primary"
                className="text-xs font-medium"
                onPress={() => markAllAsRead()}
                isLoading={isMarkingAllRead}
                startContent={!isMarkingAllRead && <Check size={14} />}
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
            ) : isError ? (
              <div className="text-center p-6 text-sm text-slate-500">
                No se pudieron cargar las notificaciones.
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
                    key={notif.Id}
                    className={`flex items-start gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${notif.Leida ? "opacity-60" : "bg-[#67afc3]/5"}`}
                  >
                    <div className="shrink-0 mt-1">{getIcon(notif.Tipo)}</div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex justify-between items-start gap-2">
                        <p
                          className={`text-sm ${notif.Leida ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}
                        >
                          {notif.Titulo}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap pt-1">
                          {formatDistanceToNow(new Date(notif.Fecha), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {notif.Mensaje}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        {notif.AccionUrl && (
                          <Link
                            href={notif.AccionUrl}
                            className="text-xs font-semibold text-[#67afc3] hover:underline"
                            onClick={() => setIsOpen(false)}
                          >
                            Ver detalle
                          </Link>
                        )}
                        {!notif.Leida && (
                          <button
                            onClick={() => markAsRead(notif.Id)}
                            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            Marcar leída
                          </button>
                        )}
                      </div>
                    </div>
                    {!notif.Leida && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                    )}
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
