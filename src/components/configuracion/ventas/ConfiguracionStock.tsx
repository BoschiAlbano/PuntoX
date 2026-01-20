"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Switch, Button } from "@heroui/react";
import { useConfiguracion, Configuracion } from "@/hooks/useConfiguracion";

export function ConfiguracionStock() {
  const {
    configuracion: configuracionData,
    saveConfiguracion,
    isSavingConfiguracion,
  } = useConfiguracion();

  // Local state for optimistic updates and tracking changes
  const [configStock, setConfigStock] = useState({
    facturaDescuentaStock: false,
    presupuestoDescuentaStock: false,
    remitoDescuentaStock: false,
    actualizaCostoDesdeCompra: false,
    modificaPrecioVentaDesdeCompra: false,
  });

  useEffect(() => {
    if (configuracionData) {
      setConfigStock({
        facturaDescuentaStock: configuracionData.facturaDescuentaStock ?? false,
        presupuestoDescuentaStock:
          configuracionData.presupuestoDescuentaStock ?? false,
        remitoDescuentaStock: configuracionData.remitoDescuentaStock ?? false,
        actualizaCostoDesdeCompra:
          configuracionData.actualizaCostoDesdeCompra ?? false,
        modificaPrecioVentaDesdeCompra:
          configuracionData.modificaPrecioVentaDesdeCompra ?? false,
      });
    }
  }, [configuracionData]);

  const handleSave = async () => {
    if (!configuracionData) return;

    // Merge current config with stock changes
    // We must send required fields (razonSocial, cuit, etc) which are in configuracionData
    const payload: Partial<Configuracion> = {
      ...configuracionData,
      ...configStock,
    };

    await saveConfiguracion(payload);
  };

  // Check for changes
  const hasChanges = configuracionData
    ? configStock.facturaDescuentaStock !==
        (configuracionData.facturaDescuentaStock ?? false) ||
      configStock.presupuestoDescuentaStock !==
        (configuracionData.presupuestoDescuentaStock ?? false) ||
      configStock.remitoDescuentaStock !==
        (configuracionData.remitoDescuentaStock ?? false) ||
      configStock.actualizaCostoDesdeCompra !==
        (configuracionData.actualizaCostoDesdeCompra ?? false) ||
      configStock.modificaPrecioVentaDesdeCompra !==
        (configuracionData.modificaPrecioVentaDesdeCompra ?? false)
    : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-emerald-100 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4 text-emerald-600"
          >
            <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
            <path
              fillRule="evenodd"
              d="M2 7.5h16l-.811 7.71A2 2 0 0 1 15.189 17H4.811A2 2 0 0 1 2.81 15.21L2 7.5Zm8.67 1.85a.75.75 0 1 0-1.34-.7l-2 3.75a.75.75 0 1 0 1.34.7l2-3.75Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Stock y compras
        </h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Control de inventario y actualización automática de precios y costos
      </p>

      {/* Factura descuenta stock */}
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
                    d="M4 2a1 1 0 0 0-1 1v2.101a7.002 7.002 0 0 1 11.601 5.566a1 1 0 1 1-1.885.666A5.002 5.002 0 0 0 5.999 7H9a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm.008 9.057a1 1 0 0 1 1.276.61A5.002 5.002 0 0 0 14.001 13H11a1 1 0 1 1 0-2h5a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-2.101a7.002 7.002 0 0 1-11.601-5.566 1 1 0 0 1 .61-1.276Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Factura descuenta stock
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  El stock se reduce automáticamente al emitir una factura
                </p>
              </div>
            </div>
            <Switch
              isSelected={configStock.facturaDescuentaStock}
              onValueChange={(value) =>
                setConfigStock({ ...configStock, facturaDescuentaStock: value })
              }
              isDisabled={isSavingConfiguracion || !configuracionData}
            />
          </div>
        </CardBody>
      </Card>

      {/* Presupuesto descuenta stock */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-text-orange-100 bg-orange-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-orange-600"
                >
                  <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06v-11a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.339A.75.75 0 0 0 2 4.06v11a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Presupuesto descuenta stock
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  El stock se reduce al crear un presupuesto
                </p>
              </div>
            </div>
            <Switch
              isSelected={configStock.presupuestoDescuentaStock}
              onValueChange={(value) =>
                setConfigStock({
                  ...configStock,
                  presupuestoDescuentaStock: value,
                })
              }
              isDisabled={isSavingConfiguracion || !configuracionData}
            />
          </div>
        </CardBody>
      </Card>

      {/* Remito descuenta stock */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-teal-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-teal-600"
                >
                  <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                  <path
                    fillRule="evenodd"
                    d="M2 7.5h16l-.811 7.71A2 2 0 0 1 15.189 17H4.811A2 2 0 0 1 2.81 15.21L2 7.5Zm8.67 1.85a.75.75 0 1 0-1.34-.7l-2 3.75a.75.75 0 1 0 1.34.7l2-3.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Remito descuenta stock
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  El stock se reduce al emitir un remito
                </p>
              </div>
            </div>
            <Switch
              isSelected={configStock.remitoDescuentaStock}
              onValueChange={(value) =>
                setConfigStock({ ...configStock, remitoDescuentaStock: value })
              }
              isDisabled={isSavingConfiguracion || !configuracionData}
            />
          </div>
        </CardBody>
      </Card>

      {/* Actualiza costo desde compra */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-emerald-600"
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
                  Actualizar costo desde compra
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  El costo del producto se actualiza automáticamente al
                  registrar una compra
                </p>
              </div>
            </div>
            <Switch
              isSelected={configStock.actualizaCostoDesdeCompra}
              onValueChange={(value) =>
                setConfigStock({
                  ...configStock,
                  actualizaCostoDesdeCompra: value,
                })
              }
              isDisabled={isSavingConfiguracion || !configuracionData}
            />
          </div>
        </CardBody>
      </Card>

      {/* Modifica precio venta desde compra */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-cyan-600"
                >
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.755-.514 1.352 0 .18.053.395.115.58.032.092.07.183.105.273ZM5.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM3.5 13a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM5.5 17a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM9 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM14.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM17 11.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM16 16.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM12.955 3.41a.5.5 0 0 1 .09.59l-1.5 4a.5.5 0 0 1-.944 0l-1.5-4a.5.5 0 1 1 .895-.448L10 6.62l1.06-2.66a.5.5 0 0 1 .895.45ZM5.35 8.5a.5.5 0 0 0-.844.518l1 1.5a.5.5 0 0 0 .844-.518l-1-1.5ZM6 12.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5ZM8.5 5.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0v-3Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Modificar precio de venta desde compra
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  El precio de venta se ajusta automáticamente según el costo de
                  compra
                </p>
              </div>
            </div>
            <Switch
              isSelected={configStock.modificaPrecioVentaDesdeCompra}
              onValueChange={(value) =>
                setConfigStock({
                  ...configStock,
                  modificaPrecioVentaDesdeCompra: value,
                })
              }
              isDisabled={isSavingConfiguracion || !configuracionData}
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
            Guardar Stock
          </Button>
        </div>
      )}
    </div>
  );
}
