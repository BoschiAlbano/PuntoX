"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Layers, Save } from "lucide-react";
import { useConfiguracion, Configuracion } from "@/hooks/useConfiguracion";
import { VentasSection, ToggleRow } from "./VentasPrimitives";
import { useReportDirty } from "../OnboardingDirtyContext";

export function ConfiguracionProductos() {
  const {
    configuracion: configuracionData,
    saveConfiguracion,
    isSavingConfiguracion,
  } = useConfiguracion({ enableConfiguracion: true });

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
    } as Partial<Configuracion>);
  };

  const hasChanges = configuracionData
    ? configProductos.unificarRenglonesIngresarMismoProducto !==
      (configuracionData.unificarRenglonesIngresarMismoProducto ?? true)
    : false;

  useReportDirty("ventas-productos", hasChanges);

  return (
    <VentasSection title="Comportamiento de productos" icon={Layers}>
      <ToggleRow
        icon={Layers}
        title="Unificar renglones al ingresar el mismo producto"
        description="Si el producto ya existe en el comprobante, se suma la cantidad en lugar de crear una nueva línea"
        isSelected={configProductos.unificarRenglonesIngresarMismoProducto}
        onValueChange={(v) =>
          setConfigProductos({ unificarRenglonesIngresarMismoProducto: v })
        }
        isDisabled={isSavingConfiguracion || !configuracionData}
      />

      {hasChanges && (
        <div className="flex justify-end pt-2">
          <Button
            onPress={handleSave}
            isLoading={isSavingConfiguracion}
            className="bg-linear-to-r from-[#67afc3] to-[#2dd4bf] text-white font-bold px-6 h-10 shadow-md shadow-[#67afc3]/20 rounded-xl gap-2"
            startContent={!isSavingConfiguracion && <Save size={15} />}
          >
            Guardar productos
          </Button>
        </div>
      )}
    </VentasSection>
  );
}
