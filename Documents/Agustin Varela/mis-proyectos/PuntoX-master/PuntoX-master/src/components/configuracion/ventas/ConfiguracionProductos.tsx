"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Switch, Button } from "@heroui/react";
import { useConfiguracion, Configuracion } from "@/hooks/useConfiguracion";

export function ConfiguracionProductos() {
  const {
    configuracion: configuracionData,
    saveConfiguracion,
    isSavingConfiguracion,
  } = useConfiguracion({
    enableConfiguracion: true,
  });

  const [configProductos, setConfigProductos] = useState({
    unificarRenglonesIngresarMismoProducto: true,
  });

  useEffect(() => {
    if (configuracionData) {
      setConfigProductos({
        unificarRenglonesIngresarMismoProducto:
          configuracionData.unificarRenglonesIngresarMismoProducto ?? true,
      });
    }
  }, [configuracionData]);

  const handleSave = async () => {
    if (!configuracionData) return;
    await saveConfiguracion({
      ...configuracionData,
      ...configProductos,
    });
  };

  const hasChanges = configuracionData
    ? configProductos.unificarRenglonesIngresarMismoProducto !==
      (configuracionData.unificarRenglonesIngresarMismoProducto ?? true)
    : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-purple-100 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4 text-purple-600"
          >
            <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Productos</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Configuración de comportamiento de productos
      </p>

      {/* Unificar Renglones */}
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
                  <path
                    fillRule="evenodd"
                    d="M2.5 4A1.5 1.5 0 0 1 4 2.5h12A1.5 1.5 0 0 1 17.5 4v12a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 2.5 16V4Zm1.5 0v12h12V4h-12Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Unificar renglones al ingresar mismo producto
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Si se ingresa el mismo producto, sumar cantidad en vez de
                  crear otro renglón
                </p>
              </div>
            </div>
            <Switch
              isSelected={
                configProductos.unificarRenglonesIngresarMismoProducto
              }
              onValueChange={(value) =>
                setConfigProductos({
                  unificarRenglonesIngresarMismoProducto: value,
                })
              }
              isDisabled={isSavingConfiguracion || !configuracionData}
              aria-label="Unificar renglones al ingresar mismo producto"
            />
          </div>
        </CardBody>
      </Card>

      {hasChanges && (
        <div className="flex justify-end mt-4">
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={isSavingConfiguracion}
          >
            Guardar Productos
          </Button>
        </div>
      )}
    </div>
  );
}
