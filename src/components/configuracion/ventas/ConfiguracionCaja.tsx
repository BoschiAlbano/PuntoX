"use client";

import { useEffect, useState } from "react";
import { Button, Select, SelectItem } from "@heroui/react";
import {
  Landmark,
  ShoppingCart,
  ShoppingBag,
  KeyRound,
  Users,
  Save,
} from "lucide-react";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";
import { VentasSection, ToggleRow } from "./VentasPrimitives";
import { useReportDirty } from "../OnboardingDirtyContext";

const selectCls = {
  trigger:
    "h-9 border-slate-200 bg-white hover:border-[#67afc3]/60 data-[focus=true]:border-[#67afc3] rounded-xl text-sm",
};

const paymentOptions = [
  { key: TIPO_PAGO.EFECTIVO, label: "Efectivo" },
  { key: TIPO_PAGO.TARJETA, label: "Tarjeta" },
  { key: TIPO_PAGO.TRANSFERENCIA, label: "Transferencia" },
  { key: TIPO_PAGO.CHEQUE, label: "Cheque" },
  { key: TIPO_PAGO.CUENTA_CORRIENTE, label: "Cta. Corriente" },
];

export function ConfiguracionCaja() {
  const {
    configuracion: configuracionData,
    saveConfiguracion,
    isSavingConfiguracion,
  } = useConfiguracion({ enableConfiguracion: true });

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
        tipoFormaPagoPorDefectoVenta: configuracionData.tipoFormaPagoPorDefectoVenta ?? 1,
        tipoFormaPagoPorDefectoCompra: configuracionData.tipoFormaPagoPorDefectoCompra ?? 1,
        ingresoManualCajaInicial: configuracionData.ingresoManualCajaInicial ?? false,
        puestoCajaSeparado: configuracionData.puestoCajaSeparado ?? false,
        activarRetiroDeCaja: configuracionData.activarRetiroDeCaja ?? false,
        montoMaximoRetiroCaja: configuracionData.montoMaximoRetiroCaja ?? 0,
      });
    }
  }, [configuracionData]);

  const handleSave = async () => {
    if (!configuracionData) return;
    await saveConfiguracion({ ...configuracionData, ...configCaja });
  };

  const hasChanges = configuracionData
    ? configCaja.tipoFormaPagoPorDefectoVenta !== (configuracionData.tipoFormaPagoPorDefectoVenta ?? 1) ||
      configCaja.tipoFormaPagoPorDefectoCompra !== (configuracionData.tipoFormaPagoPorDefectoCompra ?? 1) ||
      configCaja.ingresoManualCajaInicial !== (configuracionData.ingresoManualCajaInicial ?? false) ||
      configCaja.puestoCajaSeparado !== (configuracionData.puestoCajaSeparado ?? false) ||
      configCaja.activarRetiroDeCaja !== (configuracionData.activarRetiroDeCaja ?? false) ||
      configCaja.montoMaximoRetiroCaja !== (configuracionData.montoMaximoRetiroCaja ?? 0)
    : false;

  useReportDirty("ventas-caja", hasChanges);

  const disabled = isSavingConfiguracion || !configuracionData;

  return (
    <VentasSection title="Caja y pagos" icon={Landmark}>
      <ToggleRow
        icon={ShoppingCart}
        title="Forma de pago por defecto — Ventas"
        description="Método preseleccionado al iniciar una nueva venta"
      >
        <Select
          size="sm"
          variant="bordered"
          classNames={selectCls}
          selectedKeys={[configCaja.tipoFormaPagoPorDefectoVenta.toString()]}
          onChange={(e) => {
            if (!e.target.value) return;
            setConfigCaja((p) => ({ ...p, tipoFormaPagoPorDefectoVenta: Number(e.target.value) }));
          }}
          isDisabled={disabled}
          disallowEmptySelection
          className="max-w-[220px]"
        >
          {paymentOptions.map((o) => (
            <SelectItem key={o.key} textValue={o.label}>{o.label}</SelectItem>
          ))}
        </Select>
      </ToggleRow>

      <ToggleRow
        icon={ShoppingBag}
        title="Forma de pago por defecto — Compras"
        description="Método preseleccionado al registrar una nueva compra"
      >
        <Select
          size="sm"
          variant="bordered"
          classNames={selectCls}
          selectedKeys={[configCaja.tipoFormaPagoPorDefectoCompra.toString()]}
          onChange={(e) => {
            if (!e.target.value) return;
            setConfigCaja((p) => ({ ...p, tipoFormaPagoPorDefectoCompra: Number(e.target.value) }));
          }}
          isDisabled={disabled}
          disallowEmptySelection
          className="max-w-[220px]"
        >
          {paymentOptions.map((o) => (
            <SelectItem key={o.key} textValue={o.label}>{o.label}</SelectItem>
          ))}
        </Select>
      </ToggleRow>

      <ToggleRow
        icon={KeyRound}
        title="Ingreso manual de caja inicial"
        description="Permite ingresar manualmente el monto al abrir la caja cada jornada"
        isSelected={configCaja.ingresoManualCajaInicial}
        onValueChange={(v) => setConfigCaja((p) => ({ ...p, ingresoManualCajaInicial: v }))}
        isDisabled={disabled}
      />

      <ToggleRow
        icon={Users}
        title="Puesto de caja separado"
        description="Habilita la gestión de múltiples puestos de caja independientes por sucursal"
        isSelected={configCaja.puestoCajaSeparado}
        onValueChange={(v) => setConfigCaja((p) => ({ ...p, puestoCajaSeparado: v }))}
        isDisabled={disabled}
      />

      {hasChanges && (
        <div className="flex justify-end pt-2">
          <Button
            onPress={handleSave}
            isLoading={isSavingConfiguracion}
            className="bg-linear-to-r from-[#67afc3] to-[#2dd4bf] text-white font-bold px-6 h-10 shadow-md shadow-[#67afc3]/20 rounded-xl gap-2"
            startContent={!isSavingConfiguracion && <Save size={15} />}
          >
            Guardar caja
          </Button>
        </div>
      )}
    </VentasSection>
  );
}
