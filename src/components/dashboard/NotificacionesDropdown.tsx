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
import { statusColors, type StatusType } from "@/lib/ui/colors";

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

  // Filtrar: no mostrar más de 7 días de antigüedad
  // Mostrar todas las no leídas (hasta 7 días), pero máximo 5 leídas recientes
  let readCount = 0;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const displayNotifications = notifications.filter((notif) => {
    const notifDate = new Date(notif.Fecha);
    // Ignorar si tiene más de 7 días
    if (notifDate < sevenDaysAgo) return false;

    if (!notif.Leida) return true;
    if (readCount < 5) {
      readCount++;
      return true;
    }
    return false;
  });

  const getIcon = (tipo: string) => {
    const c = statusColors[tipo as StatusType] ?? statusColors.INFO;
    const iconClass = `${c.iconText} shrink-0`;
    const iconNode = (() => {
      switch (tipo) {
        case "SUCCESS":
          return <CheckCircle2 className={iconClass} size={18} />;
        case "WARNING":
          return <AlertTriangle className={iconClass} size={18} />;
        case "ERROR":
          return <XCircle className={iconClass} size={18} />;
        case "INFO":
        default:
          return <Info className={iconClass} size={18} />;
      }
    })();
    return (
      <div className={`p-2 rounded-full ${c.iconBg} shrink-0`}>{iconNode}</div>
    );
  };

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
            ) : displayNotifications.length === 0 ? (
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
                {displayNotifications.map((notif) => {
                  const c =
                    statusColors[notif.Tipo as StatusType] ?? statusColors.INFO;
                  return (
                    <div
                      key={notif.Id}
                      className={`flex items-start gap-3 p-4 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50 ${
                        notif.Leida ? "opacity-60" : c.rowBg
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {getIcon(notif.Tipo)}
                      </div>
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
                        <div
                          className={`w-2 h-2 rounded-full ${c.dot} shrink-0 mt-2`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollShadow>
        </div>
      </PopoverContent>
    </Popover>
  );
}
