"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import {
  Package,
  FileText,
  BookOpen,
  Truck,
  TrendingUp,
  DollarSign,
  Save,
} from "lucide-react";
import { useConfiguracion, Configuracion } from "@/hooks/useConfiguracion";
import { VentasSection, ToggleRow } from "./VentasPrimitives";
import { useReportDirty } from "../OnboardingDirtyContext";

export function ConfiguracionStock() {
  const {
    configuracion: configuracionData,
    saveConfiguracion,
    isSavingConfiguracion,
  } = useConfiguracion({ enableConfiguracion: true });

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
        presupuestoDescuentaStock: configuracionData.presupuestoDescuentaStock ?? false,
        remitoDescuentaStock: configuracionData.remitoDescuentaStock ?? false,
        actualizaCostoDesdeCompra: configuracionData.actualizaCostoDesdeCompra ?? false,
        modificaPrecioVentaDesdeCompra: configuracionData.modificaPrecioVentaDesdeCompra ?? false,
      });
    }
  }, [configuracionData]);

  const handleSave = async () => {
    if (!configuracionData) return;
    await saveConfiguracion({ ...configuracionData, ...configStock } as Partial<Configuracion>);
  };

  const hasChanges = configuracionData
    ? configStock.facturaDescuentaStock !== (configuracionData.facturaDescuentaStock ?? false) ||
      configStock.presupuestoDescuentaStock !== (configuracionData.presupuestoDescuentaStock ?? false) ||
      configStock.remitoDescuentaStock !== (configuracionData.remitoDescuentaStock ?? false) ||
      configStock.actualizaCostoDesdeCompra !== (configuracionData.actualizaCostoDesdeCompra ?? false) ||
      configStock.modificaPrecioVentaDesdeCompra !== (configuracionData.modificaPrecioVentaDesdeCompra ?? false)
    : false;

  useReportDirty("ventas-stock", hasChanges);

  const disabled = isSavingConfiguracion || !configuracionData;

  return (
    <VentasSection title="Stock y compras" icon={Package}>
      <ToggleRow
        icon={FileText}
        title="Factura descuenta stock"
        description="El inventario se reduce automáticamente al emitir una factura"
        isSelected={configStock.facturaDescuentaStock}
        onValueChange={(v) => setConfigStock({ ...configStock, facturaDescuentaStock: v })}
        isDisabled={disabled}
      />
      <ToggleRow
        icon={BookOpen}
        title="Presupuesto descuenta stock"
        description="El inventario se reserva al generar un presupuesto"
        isSelected={configStock.presupuestoDescuentaStock}
        onValueChange={(v) => setConfigStock({ ...configStock, presupuestoDescuentaStock: v })}
        isDisabled={disabled}
      />
      <ToggleRow
        icon={Truck}
        title="Remito descuenta stock"
        description="El inventario se reduce al emitir un remito de entrega"
        isSelected={configStock.remitoDescuentaStock}
        onValueChange={(v) => setConfigStock({ ...configStock, remitoDescuentaStock: v })}
        isDisabled={disabled}
      />
      <ToggleRow
        icon={TrendingUp}
        title="Actualizar costo desde compra"
        description="El costo unitario del producto se actualiza al registrar una compra"
        isSelected={configStock.actualizaCostoDesdeCompra}
        onValueChange={(v) => setConfigStock({ ...configStock, actualizaCostoDesdeCompra: v })}
        isDisabled={disabled}
      />
      <ToggleRow
        icon={DollarSign}
        title="Modificar precio de venta desde compra"
        description="El precio de venta se recalcula automáticamente en base al nuevo costo de compra"
        isSelected={configStock.modificaPrecioVentaDesdeCompra}
        onValueChange={(v) => setConfigStock({ ...configStock, modificaPrecioVentaDesdeCompra: v })}
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
            Guardar stock
          </Button>
        </div>
      )}
    </VentasSection>
  );
}
