"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import { Scale, Tag, Hash, Save, Info } from "lucide-react";
import { useConfiguracion, Configuracion } from "@/hooks/useConfiguracion";
import { VentasSection, ToggleRow } from "./VentasPrimitives";

const inputCls = {
  label: "text-slate-500 font-bold uppercase text-[10px] tracking-widest",
  inputWrapper:
    "h-10 border-slate-200 bg-white hover:border-[#67afc3]/60 focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20 transition-all rounded-xl",
  input: "text-sm text-slate-700 font-medium",
};

export function ConfiguracionBascula() {
  const {
    configuracion: configuracionData,
    saveConfiguracion,
    isSavingConfiguracion,
  } = useConfiguracion({ enableConfiguracion: true });

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
    } as Partial<Configuracion>);
  };

  const hasChanges = configuracionData
    ? configBascula.activarBascula !== (configuracionData.activarBascula ?? false) ||
      configBascula.etiquetaPorPeso !== (configuracionData.etiquetaPorPeso ?? false) ||
      configBascula.codigoBascula !== (configuracionData.codigoBascula ?? "")
    : false;

  const disabled = isSavingConfiguracion || !configuracionData;

  return (
    <VentasSection title="Báscula / Balanza" icon={Scale}>
      <ToggleRow
        icon={Scale}
        title="Activar báscula"
        description="Habilita la lectura de códigos de barras generados por balanzas electrónicas"
        isSelected={configBascula.activarBascula}
        onValueChange={(v) => setConfigBascula((p) => ({ ...p, activarBascula: v }))}
        isDisabled={disabled}
      />

      <ToggleRow
        icon={Tag}
        title="Etiqueta por peso"
        description="El código de barras codifica el peso del producto (en lugar del precio)"
        isSelected={configBascula.etiquetaPorPeso}
        onValueChange={(v) => setConfigBascula((p) => ({ ...p, etiquetaPorPeso: v }))}
        isDisabled={!configBascula.activarBascula || disabled}
      >
        <div className="text-[10px] text-slate-400 space-y-0.5 leading-relaxed">
          <p>• Peso: se usarán 3 dígitos decimales (0,001g – 99,999g)</p>
          <p>• Precio: sin decimales ($1 – $99.999)</p>
        </div>
      </ToggleRow>

      {configBascula.activarBascula && (
        <div className="px-5 py-4 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 shrink-0 mt-0.5">
              <Hash size={15} strokeWidth={2.5} className="text-[#67afc3]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Prefijo de código de báscula</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Identifica qué códigos de barras provienen de la balanza (Ej: <span className="font-mono font-bold">20</span>)
              </p>
            </div>
          </div>
          <Input
            label="Prefijo (2 dígitos)"
            labelPlacement="outside"
            placeholder="20"
            variant="bordered"
            classNames={inputCls}
            maxLength={2}
            value={configBascula.codigoBascula}
            onChange={(e) => setConfigBascula((p) => ({ ...p, codigoBascula: e.target.value }))}
            isDisabled={!configBascula.activarBascula || disabled}
            className="max-w-[160px]"
            startContent={<Hash size={14} className="text-slate-400 shrink-0" />}
          />
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#67afc3]/5 border border-[#67afc3]/15">
            <Info size={13} className="text-[#67afc3] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#67afc3] font-medium leading-relaxed">
              Ejemplo: <span className="font-mono font-bold">2000002005001</span>
              <br />
              <span className="font-mono">PP·IIIII·VVVVV·C</span> — PP: prefijo · IIIII: código · VVVVV: peso/precio · C: verificador
            </p>
          </div>
        </div>
      )}

      {hasChanges && (
        <div className="flex justify-end pt-2">
          <Button
            onPress={handleSave}
            isLoading={isSavingConfiguracion}
            className="bg-linear-to-r from-[#67afc3] to-[#2dd4bf] text-white font-bold px-6 h-10 shadow-md shadow-[#67afc3]/20 rounded-xl gap-2"
            startContent={!isSavingConfiguracion && <Save size={15} />}
          >
            Guardar báscula
          </Button>
        </div>
      )}
    </VentasSection>
  );
}
