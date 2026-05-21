"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Select,
  SelectItem,
  Input,
} from "@heroui/react";
import {
  BadgeDollarSign,
  Clock,
  Globe,
  FileText,
  Hash,
  CalendarDays,
  Landmark,
  Save,
} from "lucide-react";
import { useConfiguracion, Fiscal } from "@/hooks/useConfiguracion";
import { useQuery } from "@tanstack/react-query";
import { VentasSection } from "./ventas/VentasPrimitives";
import { ArcaSettings } from "./ArcaSettings";
import { PuntosVentaSettings } from "./PuntosVentaSettings";

const monedas = [
  { value: "ARS", label: "🇦🇷  Peso Argentino (ARS)" },
  { value: "USD", label: "🇺🇸  Dólar Estadounidense (USD)" },
  { value: "EUR", label: "🇪🇺  Euro (EUR)" },
];

const zonasHorarias = [
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Cordoba",
  "America/Argentina/Mendoza",
  "America/Montevideo",
  "America/Santiago",
];

const idiomas = [
  { value: "es-AR", label: "Español (Argentina)" },
  { value: "en-US", label: "Inglés (Estados Unidos)" },
  { value: "pt-BR", label: "Portugués (Brasil)" },
];

const selectCls = {
  label: "text-slate-500 font-bold uppercase text-[10px] tracking-widest",
  trigger:
    "h-11 border-slate-200 bg-slate-50/50 hover:border-[#67afc3]/60 data-[focus=true]:border-[#67afc3] rounded-xl",
};

const inputCls = {
  label: "text-slate-500 font-bold uppercase text-[10px] tracking-widest",
  inputWrapper:
    "h-11 border-slate-200 bg-slate-50/50 hover:border-[#67afc3]/60 focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20 transition-all rounded-xl",
  input: "text-sm text-slate-700 font-medium",
};

export function FiscalTab() {
  const {
    fiscal: fiscalData,
    saveFiscal,
    isSavingFiscal,
  } = useConfiguracion({ enableFiscal: true });

  const [regional, setRegional] = useState<Fiscal>({
    moneda: "ARS",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    idioma: "es-AR",
    condicionIvaId: null,
    tipoIva: "",
    puntoVenta: "",
    inicioActividades: "",
    ingresosBrutos: "",
    afipHabilitado: false,
    afipEntornoProduccion: false,
    afipCertificadoCargado: false,
    afipCertificadoVence: null,
    cuit: "",
  });

  const { data: condicionesIva = [], isLoading: isLoadingCondiciones, error: errorCondiciones } =
    useQuery({
      queryKey: ["condiciones-iva"],
      queryFn: async () => {
        const res = await fetch("/api/condiciones-iva");
        if (!res.ok) throw new Error("Error al cargar condiciones de IVA");
        return res.json();
      },
    });

  useEffect(() => {
    if (fiscalData) setRegional((d) => ({ ...d, ...fiscalData }));
  }, [fiscalData]);

  const hasChanges = fiscalData
    ? JSON.stringify(regional) !== JSON.stringify(fiscalData)
    : false;

  return (
    <div className="space-y-5 pt-4 pb-6">
      {/* Regional */}
      <VentasSection title="Configuración regional" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-1">
          <Select
            label="Moneda principal"
            labelPlacement="outside"
            placeholder="Seleccioná moneda"
            variant="bordered"
            classNames={selectCls}
            selectedKeys={[regional.moneda]}
            onSelectionChange={(keys) =>
              setRegional({ ...regional, moneda: (Array.from(keys)[0] as string) || "ARS" })
            }
          >
            {monedas.map((m) => (
              <SelectItem key={m.value}>{m.label}</SelectItem>
            ))}
          </Select>

          <Select
            label="Zona horaria"
            labelPlacement="outside"
            placeholder="Seleccioná zona"
            variant="bordered"
            classNames={selectCls}
            selectedKeys={[regional.zonaHoraria]}
            onSelectionChange={(keys) =>
              setRegional({
                ...regional,
                zonaHoraria: (Array.from(keys)[0] as string) || "America/Argentina/Buenos_Aires",
              })
            }
          >
            {zonasHorarias.map((z) => (
              <SelectItem key={z}>{z.replace("America/Argentina/", "").replace("America/", "")}</SelectItem>
            ))}
          </Select>

          <Select
            label="Idioma de la interfaz"
            labelPlacement="outside"
            placeholder="Seleccioná idioma"
            variant="bordered"
            classNames={selectCls}
            selectedKeys={[regional.idioma]}
            onSelectionChange={(keys) =>
              setRegional({ ...regional, idioma: (Array.from(keys)[0] as string) || "es-AR" })
            }
          >
            {idiomas.map((i) => (
              <SelectItem key={i.value}>{i.label}</SelectItem>
            ))}
          </Select>
        </div>
      </VentasSection>

      {/* Datos fiscales AFIP */}
      <VentasSection title="Situación fiscal (AFIP)" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-1">
          <Select
            label="Condición ante el IVA"
            labelPlacement="outside"
            placeholder={isLoadingCondiciones ? "Cargando..." : "Seleccioná condición"}
            variant="bordered"
            classNames={selectCls}
            selectedKeys={regional.condicionIvaId ? [regional.condicionIvaId.toString()] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              const condicion = condicionesIva.find((c: any) => c.id?.toString() === selected);
              setRegional((p) => ({
                ...p,
                condicionIvaId: selected ? Number(selected) : null,
                tipoIva: condicion?.descripcion || "",
              }));
            }}
            isDisabled={isLoadingCondiciones}
            isLoading={isLoadingCondiciones}
          >
            {condicionesIva.map((c: any) => (
              <SelectItem key={c.id?.toString()}>{c.descripcion}</SelectItem>
            ))}
          </Select>
          {errorCondiciones && (
            <p className="text-xs text-rose-500 font-medium col-span-2">
              Error al cargar condiciones de IVA. Intentá recargar la página.
            </p>
          )}

          <Input
            label="Número de punto de venta"
            labelPlacement="outside"
            placeholder="Ej: 0001"
            variant="bordered"
            classNames={inputCls}
            value={regional.puntoVenta || ""}
            onChange={(e) => setRegional({ ...regional, puntoVenta: e.target.value })}
            startContent={<Hash size={14} className="text-slate-400 shrink-0" />}
          />

          <Input
            label="CUIT del negocio"
            labelPlacement="outside"
            placeholder="Ej: 20-12345678-0"
            variant="bordered"
            classNames={inputCls}
            isRequired
            value={regional.cuit}
            onChange={(e) => setRegional({ ...regional, cuit: e.target.value })}
            startContent={
              <Hash size={15} className="text-slate-400 mr-1 shrink-0" />
            }
          />

          <Input
            label="Número de ingresos brutos"
            labelPlacement="outside"
            placeholder="Ej: 12-34567890-1"
            variant="bordered"
            classNames={inputCls}
            value={regional.ingresosBrutos || ""}
            onChange={(e) => setRegional({ ...regional, ingresosBrutos: e.target.value })}
            startContent={<Landmark size={14} className="text-slate-400 shrink-0" />}
          />

          <Input
            label="Fecha de inicio de actividades"
            labelPlacement="outside"
            type="date"
            variant="bordered"
            classNames={inputCls}
            value={regional.inicioActividades || ""}
            onChange={(e) => setRegional({ ...regional, inicioActividades: e.target.value })}
            startContent={<CalendarDays size={14} className="text-slate-400 shrink-0" />}
          />
        </div>
      </VentasSection>

      {/* Save bar */}
      <div className="flex justify-end pt-1 pb-2">
        <Button
          onPress={() => saveFiscal(regional)}
          isLoading={isSavingFiscal}
          isDisabled={!hasChanges}
          className={`font-bold px-8 h-11 rounded-xl gap-2 transition-all ${
            hasChanges
              ? "bg-linear-to-r from-[#67afc3] to-[#2dd4bf] text-white shadow-lg shadow-[#67afc3]/30 hover:shadow-xl"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
          startContent={!isSavingFiscal && <Save size={16} />}
        >
          {hasChanges ? "Guardar datos fiscales" : "Sin cambios pendientes"}
        </Button>
      </div>

      {/* Facturación Electrónica ARCA */}
      <ArcaSettings />

      {/* Puntos de Venta por Sucursal */}
      <PuntosVentaSettings />
    </div>
  );
}
