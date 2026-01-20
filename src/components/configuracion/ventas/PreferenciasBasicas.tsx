"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Switch, Button } from "@heroui/react";
import { useConfiguracion, PreferenciasVenta } from "@/hooks/useConfiguracion";

export function PreferenciasBasicas() {
  const {
    preferenciasVenta,
    savePreferenciasVenta,
    isSavingPreferenciasVenta,
    isLoadingPreferenciasVenta,
  } = useConfiguracion();

  const [preferencias, setPreferencias] = useState<PreferenciasVenta>({
    ticketDigitalPorCorreo: true,
    mostrarPreciosConIva: true,
    abrirCajonEfectivo: true,
    numerarPedidosPantalla: true,
  });

  useEffect(() => {
    if (preferenciasVenta) {
      setPreferencias(preferenciasVenta);
    }
  }, [preferenciasVenta]);

  const handleSave = async () => {
    await savePreferenciasVenta(preferencias);
  };

  const hasChanges =
    JSON.stringify(preferencias) !== JSON.stringify(preferenciasVenta);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4 text-blue-600"
          >
            <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Preferencias básicas
        </h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Configuración general del punto de venta y comportamiento de la
        aplicación
      </p>

      {/* Ticket Digital */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-green-600"
                >
                  <path d="M3 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm2 6h10v8H5v-8Zm10-2V4H5v4h10Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Enviar ticket digital por correo
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Envía automáticamente el comprobante por email al cliente
                </p>
              </div>
            </div>
            <Switch
              isSelected={preferencias.ticketDigitalPorCorreo}
              onValueChange={(value) =>
                setPreferencias({
                  ...preferencias,
                  ticketDigitalPorCorreo: value,
                })
              }
              isDisabled={isLoadingPreferenciasVenta}
            />
          </div>
        </CardBody>
      </Card>

      {/* Mostrar Precios con IVA */}
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
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.755-.514 1.352 0 .18.053.395.115.58.032.092.07.183.105.273ZM5.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM3.5 13a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM5.5 17a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM9 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM14.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM17 11.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM16 16.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM12.955 3.41a.5.5 0 0 1 .09.59l-1.5 4a.5.5 0 0 1-.944 0l-1.5-4a.5.5 0 1 1 .895-.448L10 6.62l1.06-2.66a.5.5 0 0 1 .895.45ZM5.35 8.5a.5.5 0 0 0-.844.518l1 1.5a.5.5 0 0 0 .844-.518l-1-1.5ZM6 12.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5ZM8.5 5.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0v-3Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Mostrar precios con impuestos incluidos
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Los precios se mostrarán con IVA incluido en todas las
                  pantallas
                </p>
              </div>
            </div>
            <Switch
              isSelected={preferencias.mostrarPreciosConIva}
              onValueChange={(value) =>
                setPreferencias({
                  ...preferencias,
                  mostrarPreciosConIva: value,
                })
              }
              isDisabled={isLoadingPreferenciasVenta}
            />
          </div>
        </CardBody>
      </Card>

      {/* Abrir Cajón */}
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
                  <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                  <path
                    fillRule="evenodd"
                    d="M2 7.5h16l-.811 7.71A2 2 0 0 1 15.189 17H4.811A2 2 0 0 1 2.81 15.21L2 7.5Zm5.22 1.97a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Zm6.28 0a.75.75 0 0 0-1.06 0l-2.25 2.25a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 1 0 1.06-1.06l-1.72-1.72 1.72-1.72a.75.75 0 0 0 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Abrir cajón al cobrar en efectivo
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  El cajón se abrirá automáticamente al registrar un pago en
                  efectivo
                </p>
              </div>
            </div>
            <Switch
              isSelected={preferencias.abrirCajonEfectivo}
              onValueChange={(value) =>
                setPreferencias({ ...preferencias, abrirCajonEfectivo: value })
              }
              isDisabled={isLoadingPreferenciasVenta}
            />
          </div>
        </CardBody>
      </Card>

      {/* Numerar Pedidos */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-indigo-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Numerar pedidos y mostrar en pantalla
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Asigna números secuenciales a los pedidos y muéstralos en
                  pantalla
                </p>
              </div>
            </div>
            <Switch
              isSelected={preferencias.numerarPedidosPantalla}
              onValueChange={(value) =>
                setPreferencias({
                  ...preferencias,
                  numerarPedidosPantalla: value,
                })
              }
              isDisabled={isLoadingPreferenciasVenta}
            />
          </div>
        </CardBody>
      </Card>

      {hasChanges && (
        <div className="flex justify-end mt-4">
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={isSavingPreferenciasVenta}
          >
            Guardar Preferencias
          </Button>
        </div>
      )}
    </div>
  );
}
