"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Switch,
  Select,
  SelectItem,
  Button,
} from "@heroui/react";
import { useConfiguracion, Configuracion } from "@/hooks/useConfiguracion";

export function ConfiguracionCaja() {
  const {
    configuracion: configuracionData,
    saveConfiguracion,
    isSavingConfiguracion,
  } = useConfiguracion();

  const [configCaja, setConfigCaja] = useState({
    tipoFormaPagoPorDefectoVenta: 0,
    tipoFormaPagoPorDefectoCompra: 0,
    ingresoManualCajaInicial: false,
    puestoCajaSeparado: false,
    activarRetiroDeCaja: false,
    montoMaximoRetiroCaja: 0,
  });

  useEffect(() => {
    if (configuracionData) {
      setConfigCaja({
        tipoFormaPagoPorDefectoVenta:
          configuracionData.tipoFormaPagoPorDefectoVenta ?? 0,
        tipoFormaPagoPorDefectoCompra:
          configuracionData.tipoFormaPagoPorDefectoCompra ?? 0,
        ingresoManualCajaInicial:
          configuracionData.ingresoManualCajaInicial ?? false,
        puestoCajaSeparado: configuracionData.puestoCajaSeparado ?? false,
        activarRetiroDeCaja: configuracionData.activarRetiroDeCaja ?? false,
        montoMaximoRetiroCaja: configuracionData.montoMaximoRetiroCaja ?? 0,
      });
    }
  }, [configuracionData]);

  const handleSave = async () => {
    if (!configuracionData) return;
    await saveConfiguracion({
      ...configuracionData,
      ...configCaja,
    });
  };

  const hasChanges = configuracionData
    ? configCaja.tipoFormaPagoPorDefectoVenta !==
        (configuracionData.tipoFormaPagoPorDefectoVenta ?? 0) ||
      configCaja.tipoFormaPagoPorDefectoCompra !==
        (configuracionData.tipoFormaPagoPorDefectoCompra ?? 0) ||
      configCaja.ingresoManualCajaInicial !==
        (configuracionData.ingresoManualCajaInicial ?? false) ||
      configCaja.puestoCajaSeparado !==
        (configuracionData.puestoCajaSeparado ?? false) ||
      configCaja.activarRetiroDeCaja !==
        (configuracionData.activarRetiroDeCaja ?? false) ||
      configCaja.montoMaximoRetiroCaja !==
        (configuracionData.montoMaximoRetiroCaja ?? 0)
    : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-yellow-100 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4 text-yellow-600"
          >
            <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
            <path
              fillRule="evenodd"
              d="M2 7.5h16l-.811 7.71A2 2 0 0 1 15.189 17H4.811A2 2 0 0 1 2.81 15.21L2 7.5Zm8.67 1.85a.75.75 0 1 0-1.34-.7l-2 3.75a.75.75 0 1 0 1.34.7l2-3.75Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Caja y pagos</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Configuración de métodos de pago, gestión de caja y retiros
      </p>

      {/* Forma de pago Venta */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-green-600"
                >
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.755-.514 1.352 0 .18.053.395.115.58.032.092.07.183.105.273Z" />
                  <path
                    fillRule="evenodd"
                    d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 15.5 2h-11ZM10 8a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H11a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Forma de pago por defecto (Ventas)
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Selecciona el método de pago predeterminado para las ventas
                </p>
              </div>
            </div>
            <Select
              selectedKeys={[
                configCaja.tipoFormaPagoPorDefectoVenta.toString(),
              ]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setConfigCaja((prev) => ({
                  ...prev,
                  tipoFormaPagoPorDefectoVenta: selected ? Number(selected) : 0,
                }));
              }}
              classNames={{ trigger: "bg-white border-slate-200" }}
              isDisabled={isSavingConfiguracion || !configuracionData}
            >
              <SelectItem key="0">Efectivo</SelectItem>
              <SelectItem key="1">Débito</SelectItem>
              <SelectItem key="2">Crédito</SelectItem>
              <SelectItem key="3">QR</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Forma de pago Compra */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-blue-600"
                >
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.755-.514 1.352 0 .18.053.395.115.58.032.092.07.183.105.273Z" />
                  <path
                    fillRule="evenodd"
                    d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 15.5 2h-11ZM10 8a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H11a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Forma de pago por defecto (Compras)
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Selecciona el método de pago predeterminado para las compras
                </p>
              </div>
            </div>
            <Select
              selectedKeys={[
                configCaja.tipoFormaPagoPorDefectoCompra.toString(),
              ]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setConfigCaja((prev) => ({
                  ...prev,
                  tipoFormaPagoPorDefectoCompra: selected
                    ? Number(selected)
                    : 0,
                }));
              }}
              classNames={{ trigger: "bg-white border-slate-200" }}
              isDisabled={isSavingConfiguracion || !configuracionData}
            >
              <SelectItem key="0">Efectivo</SelectItem>
              <SelectItem key="1">Débito</SelectItem>
              <SelectItem key="2">Crédito</SelectItem>
              <SelectItem key="3">QR</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Ingreso manual caja inicial */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-yellow-600"
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
                  Ingreso manual de caja inicial
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permite ingresar manualmente el monto inicial de la caja al
                  abrir
                </p>
              </div>
            </div>
            <Switch
              isSelected={configCaja.ingresoManualCajaInicial}
              onValueChange={(value) =>
                setConfigCaja((prev) => ({
                  ...prev,
                  ingresoManualCajaInicial: value,
                }))
              }
              isDisabled={isSavingConfiguracion || !configuracionData}
              aria-label="Ingreso manual de caja inicial"
            />
          </div>
        </CardBody>
      </Card>

      {/* Puesto de caja separado */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-pink-100 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5 text-pink-600"
                >
                  <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm2.615 8.428a1.224 1.224 0 0 0 .569-1.175 6.002 6.002 0 0 0-11.908 0c-.058.467.172.92.57 1.174A9.953 9.953 0 0 0 13 18a9.953 9.953 0 0 0 5.385-1.572Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Puesto de caja separado
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Habilita la gestión de múltiples puestos de caja
                  independientes
                </p>
              </div>
            </div>
            <Switch
              isSelected={configCaja.puestoCajaSeparado}
              onValueChange={(value) =>
                setConfigCaja((prev) => ({
                  ...prev,
                  puestoCajaSeparado: value,
                }))
              }
              isDisabled={isSavingConfiguracion || !configuracionData}
              aria-label="Puesto de caja separado"
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
            Guardar Caja
          </Button>
        </div>
      )}
    </div>
  );
}
