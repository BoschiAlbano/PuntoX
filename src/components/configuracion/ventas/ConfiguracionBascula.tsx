"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Switch, Button, Input } from "@heroui/react";
import { useConfiguracion, Configuracion } from "@/hooks/useConfiguracion";

export function ConfiguracionBascula() {
  const {
    configuracion: configuracionData,
    saveConfiguracion,
    isSavingConfiguracion,
  } = useConfiguracion();

  const [configBascula, setConfigBascula] = useState({
    activarBascula: false,
    etiquetaPorPeso: false,
    codigoBascula: "",
  });

  useEffect(() => {
    if (configuracionData) {
      setConfigBascula({
        activarBascula: configuracionData.activarBascula ?? false,
        etiquetaPorPeso: configuracionData.etiquetaPorPeso ?? false,
        codigoBascula: configuracionData.codigoBascula ?? "",
      });
    }
  }, [configuracionData]);

  const handleSave = async () => {
    if (!configuracionData) return;
    await saveConfiguracion({
      ...configuracionData,
      ...configBascula,
    });
  };

  const hasChanges = configuracionData
    ? configBascula.activarBascula !==
        (configuracionData.activarBascula ?? false) ||
      configBascula.etiquetaPorPeso !==
        (configuracionData.etiquetaPorPeso ?? false) ||
      configBascula.codigoBascula !== (configuracionData.codigoBascula ?? "")
    : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-indigo-100 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4 text-indigo-600"
          >
            <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
            <path
              fillRule="evenodd"
              d="M2 7.5h16l-.811 7.71A2 2 0 0 1 15.189 17H4.811A2 2 0 0 1 2.81 15.21L2 7.5Zm5.22 1.97a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Zm6.28 0a.75.75 0 0 0-1.06 0l-2.25 2.25a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 1 0 1.06-1.06l-1.72-1.72 1.72-1.72a.75.75 0 0 0 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Báscula</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Configuración para integración con balanzas y productos pesables
      </p>

      {/* Activar Bascula */}
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
                    d="M10 2a1 1 0 0 1 1 1v1.323l3.954 1.582 1.599-.8a1 1 0 0 1 .894 1.79l-1.233.616 1.738 5.42a1 1 0 0 1-.285 1.05A7 7 0 1 1 10 3v1a1 1 0 0 1-1-1V2ZM4.178 7.455l3.491-1.745.33.935-3.49 1.745-.33-.935Zm6.333 1.259 3.49 1.745-.331.935-3.49-1.745.33-.935Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Activar báscula
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Habilita la lectura de códigos de barra generados por balanzas
                </p>
              </div>
            </div>
            <Switch
              isSelected={configBascula.activarBascula}
              onValueChange={(value) =>
                setConfigBascula((prev) => ({ ...prev, activarBascula: value }))
              }
              isDisabled={isSavingConfiguracion || !configuracionData}
            />
          </div>
        </CardBody>
      </Card>

      {/* Etiqueta por peso */}
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
                    d="M5.5 3A2.5 2.5 0 0 0 3 5.5v2.879a2.5 2.5 0 0 0 .732 1.767l6.5 6.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-6.5-6.5A2.5 2.5 0 0 0 8.38 3H5.5ZM6 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Etiqueta por peso
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  El código de barras contiene el peso en lugar del precio
                </p>
              </div>
            </div>
            <Switch
              isSelected={configBascula.etiquetaPorPeso}
              onValueChange={(value) =>
                setConfigBascula((prev) => ({
                  ...prev,
                  etiquetaPorPeso: value,
                }))
              }
              isDisabled={
                !configBascula.activarBascula ||
                isSavingConfiguracion ||
                !configuracionData
              }
            />
          </div>
        </CardBody>
      </Card>

      {/* Codigo de Bascula */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-indigo-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Zm2 2V5h1v1H5ZM3 13a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3Zm2 2v-1h1v1H5ZM13 3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-3Zm1 2v1h1V5h-1Z"
                    clipRule="evenodd"
                  />
                  <path d="M11 4a1 1 0 1 0-2 0v1h2V4ZM10 7a1 1 0 0 1 1 1v2h2v-1a1 1 0 1 1 2 0v2h-1a1 1 0 1 1-2 0v-2h-2v1a1 1 0 1 1-2 0v-2h1a1 1 0 0 1 1-1ZM9 14a1 1 0 0 0-1 1v2h2v-2a1 1 0 0 0-1-1ZM13 13a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Código de inicio de báscula
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Prefijo utilizado por la balanza para identificar productos
                  pesables (Ej: 20)
                </p>
              </div>
            </div>
            <Input
              placeholder="Ej: 20"
              value={configBascula.codigoBascula}
              onChange={(e) =>
                setConfigBascula((prev) => ({
                  ...prev,
                  codigoBascula: e.target.value,
                }))
              }
              isDisabled={
                !configBascula.activarBascula ||
                isSavingConfiguracion ||
                !configuracionData
              }
              variant="bordered"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
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
            Guardar Báscula
          </Button>
        </div>
      )}
    </div>
  );
}
