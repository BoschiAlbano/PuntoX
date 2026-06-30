"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Bell, Mail, AlertTriangle, Save } from "lucide-react";
import { useConfiguracion, Notificaciones } from "@/hooks/useConfiguracion";
import { VentasSection, ToggleRow } from "./ventas/VentasPrimitives";
import { NotificacionesTabSkeleton } from "./ConfiguracionSkeleton";

export function NotificacionesTab() {
  const {
    notificaciones: notificacionesData,
    saveNotificaciones,
    isSavingNotificaciones,
    isLoadingNotificaciones,
  } = useConfiguracion({ enableNotificaciones: true });

  const [notificaciones, setNotificaciones] = useState<Notificaciones>({
    resumenDiario: false,
    stockBajo: true,
  });

  useEffect(() => {
    if (notificacionesData) setNotificaciones(notificacionesData);
  }, [notificacionesData]);

  const hasChanges = notificacionesData
    ? notificaciones.resumenDiario !== notificacionesData.resumenDiario ||
      notificaciones.stockBajo !== notificacionesData.stockBajo
    : false;

  if (isLoadingNotificaciones) {
    return <NotificacionesTabSkeleton />;
  }

  return (
    <div className="pt-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="space-y-5 pb-6">
          <VentasSection title="Canales de notificación" icon={Bell}>
            <ToggleRow
              icon={Mail}
              title="Resumen diario"
              description="Recibí un informe consolidado de la actividad del día: ventas, movimientos de caja y novedades"
              isSelected={notificaciones.resumenDiario}
              onValueChange={(v) =>
                setNotificaciones((p) => ({ ...p, resumenDiario: v }))
              }
              isDisabled={isSavingNotificaciones}
            />
            <ToggleRow
              icon={AlertTriangle}
              title="Alerta de stock bajo"
              description="Recibí una notificación cuando el inventario de un producto caiga por debajo del mínimo configurado"
              isSelected={notificaciones.stockBajo}
              onValueChange={(v) =>
                setNotificaciones((p) => ({ ...p, stockBajo: v }))
              }
              isDisabled={isSavingNotificaciones}
            />

            {hasChanges && (
              <div className="flex justify-end pt-2">
                <Button
                  onPress={() => saveNotificaciones(notificaciones)}
                  isLoading={isSavingNotificaciones}
                  className="bg-linear-to-r from-[#67afc3] to-[#2dd4bf] text-white font-bold px-6 h-10 shadow-md shadow-[#67afc3]/20 rounded-xl gap-2"
                  startContent={!isSavingNotificaciones && <Save size={15} />}
                >
                  Guardar notificaciones
                </Button>
              </div>
            )}
          </VentasSection>
        </div>
      </div>
    </div>
  );
}
