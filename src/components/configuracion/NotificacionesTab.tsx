"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Switch, Button } from "@heroui/react";
import { useConfiguracion, Notificaciones } from "@/hooks/useConfiguracion";
import { SectionPanel } from "./SectionPanel";

export function NotificacionesTab() {
  const {
    notificaciones: notificacionesData,
    saveNotificaciones,
    isSavingNotificaciones,
  } = useConfiguracion();

  const [notificaciones, setNotificaciones] = useState<Notificaciones>({
    push: true,
    resumenDiario: false,
    stockBajo: true,
  });

  useEffect(() => {
    if (notificacionesData) {
      setNotificaciones(notificacionesData);
    }
  }, [notificacionesData]);

  const handleSave = async () => {
    await saveNotificaciones(notificaciones);
  };

  const hasChanges = notificacionesData
    ? notificaciones.push !== notificacionesData.push ||
      notificaciones.resumenDiario !== notificacionesData.resumenDiario ||
      notificaciones.stockBajo !== notificacionesData.stockBajo
    : false;

  return (
    <SectionPanel
      id="notificaciones"
      title="Notificaciones"
      description="Gestione cómo y cuándo recibe alertas del sistema"
      summary="Configure alertas de stock, resumenes diarios y notificaciones push"
    >
      <div className="space-y-4">
        <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-blue-600"
                  >
                    <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Notificaciones Push
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Recibir notificaciones en el navegador
                  </p>
                </div>
              </div>
              <Switch
                isSelected={notificaciones.push}
                onValueChange={(value) =>
                  setNotificaciones((prev) => ({ ...prev, push: value }))
                }
                isDisabled={isSavingNotificaciones}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-purple-600"
                  >
                    <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Resumen Diario
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Recibir un resumen diario de actividad por correo
                  </p>
                </div>
              </div>
              <Switch
                isSelected={notificaciones.resumenDiario}
                onValueChange={(value) =>
                  setNotificaciones((prev) => ({
                    ...prev,
                    resumenDiario: value,
                  }))
                }
                isDisabled={isSavingNotificaciones}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-red-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Alerta de Stock Bajo
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Notificar cuando el stock de un producto sea bajo
                  </p>
                </div>
              </div>
              <Switch
                isSelected={notificaciones.stockBajo}
                onValueChange={(value) =>
                  setNotificaciones((prev) => ({ ...prev, stockBajo: value }))
                }
                isDisabled={isSavingNotificaciones}
              />
            </div>
          </CardBody>
        </Card>

        {hasChanges && (
          <div className="flex justify-end mt-4">
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isSavingNotificaciones}
            >
              Guardar Notificaciones
            </Button>
          </div>
        )}
      </div>
    </SectionPanel>
  );
}
