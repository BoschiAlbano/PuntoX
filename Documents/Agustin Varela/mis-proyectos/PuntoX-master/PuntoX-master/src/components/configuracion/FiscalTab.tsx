"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Select,
  SelectItem,
  Input,
  Button,
} from "@heroui/react";
import { useConfiguracion, Fiscal } from "@/hooks/useConfiguracion";
import { SectionPanel } from "./SectionPanel";
import { useQuery } from "@tanstack/react-query";

const monedas = [
  { value: "ARS", label: "Peso Argentino (ARS)" },
  { value: "USD", label: "Dólar Estadounidense (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
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

export function FiscalTab() {
  const {
    fiscal: fiscalData,
    saveFiscal,
    isSavingFiscal,
  } = useConfiguracion({
    enableFiscal: true,
  });

  const [regional, setRegional] = useState<Fiscal>({
    moneda: "ARS",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    idioma: "es-AR",
    condicionIvaId: null,
    tipoIva: "",
    puntoVenta: "",
    inicioActividades: "",
    ingresosBrutos: "",
  });

  const {
    data: condicionesIva = [],
    isLoading: isLoadingCondiciones,
    error: errorCondiciones,
  } = useQuery({
    queryKey: ["condiciones-iva"],
    queryFn: async () => {
      const res = await fetch("/api/afip/condicion-iva");
      if (!res.ok) throw new Error("Error al cargar condiciones de IVA");
      const data = await res.json();
      return data;
    },
  });

  useEffect(() => {
    if (fiscalData) {
      setRegional((data) => ({
        ...data,
        ...fiscalData,
      }));
    }
  }, [fiscalData]);

  const handleSave = async () => {
    await saveFiscal(regional);
  };

  const hasChanges = fiscalData
    ? JSON.stringify(regional) !== JSON.stringify(fiscalData)
    : false;

  return (
    <SectionPanel
      id="fiscal"
      title="Facturacion y region"
      description="Configure los datos fiscales y regionales de su negocio"
      summary="Moneda, zona horaria, condición fiscal y puntos de venta"
    >
      <div className="space-y-4">
        {/* Moneda */}
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
                    Moneda
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Selecciona la moneda principal para tus transacciones
                  </p>
                </div>
              </div>
              <Select
                selectedKeys={[regional.moneda]}
                onSelectionChange={(keys) =>
                  setRegional({
                    ...regional,
                    moneda: (Array.from(keys)[0] as string) || "ARS",
                  })
                }
                classNames={{ trigger: "bg-white border-slate-200" }}
              >
                {monedas.map((m) => (
                  <SelectItem key={m.value}>{m.label}</SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Zona Horaria */}
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
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Zona horaria
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configura la zona horaria para fechas y reportes
                  </p>
                </div>
              </div>
              <Select
                selectedKeys={[regional.zonaHoraria]}
                onSelectionChange={(keys) =>
                  setRegional({
                    ...regional,
                    zonaHoraria:
                      (Array.from(keys)[0] as string) ||
                      "America/Argentina/Buenos_Aires",
                  })
                }
                classNames={{ trigger: "bg-white border-slate-200" }}
              >
                {zonasHorarias.map((z) => (
                  <SelectItem key={z}>{z}</SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Idioma */}
        <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardBody className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-purple-600"
                  >
                    <path d="M7.752 11.689a3.44 3.44 0 0 0 4.496 0l1.88-1.88c-1.133-1.133-2.64-1.88-4.496-1.88s-3.363.747-4.496 1.88l1.88 1.88Z" />
                    <path d="m2.33 9.663 1.88 1.88a3.44 3.44 0 0 0 4.496 0l1.881-1.88c.51.51 1.12.888 1.81 1.103v2.635a3.44 3.44 0 0 1-1.81 1.102l-1.88-1.88a3.44 3.44 0 0 0-4.496 0l-1.88 1.88A3.44 3.44 0 0 1 2.33 13.398V11.11c.69-.215 1.3-.593 1.81-1.103l-1.88-1.88a3.44 3.44 0 0 1 1.07-2.567ZM15.75 8.25a3.44 3.44 0 0 1 1.07 2.567l-1.88 1.88a3.44 3.44 0 0 0-4.496 0l-1.881 1.88a3.44 3.44 0 0 1-1.81-1.102v-2.635c.69.215 1.3.593 1.81 1.103l1.88-1.88a3.44 3.44 0 0 0 4.496 0l1.88-1.88a3.44 3.44 0 0 1 1.07 2.567Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Idioma
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Selecciona el idioma de la interfaz
                  </p>
                </div>
              </div>
              <Select
                selectedKeys={[regional.idioma]}
                onSelectionChange={(keys) =>
                  setRegional({
                    ...regional,
                    idioma: (Array.from(keys)[0] as string) || "es-AR",
                  })
                }
                classNames={{ trigger: "bg-white border-slate-200" }}
              >
                {idiomas.map((i) => (
                  <SelectItem key={i.value}>{i.label}</SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Condicion IVA */}
        <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardBody className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-amber-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Condición IVA
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Selecciona tu condición fiscal ante AFIP
                  </p>
                </div>
              </div>
              <Select
                selectedKeys={
                  regional.condicionIvaId
                    ? [regional.condicionIvaId.toString()]
                    : []
                }
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  const condicion = condicionesIva.find(
                    (c: any) => c.id.toString() === selected,
                  );
                  setRegional((prev) => ({
                    ...prev,
                    condicionIvaId: selected ? Number(selected) : null,
                    tipoIva: condicion?.descripcion || "",
                  }));
                }}
                classNames={{ trigger: "bg-white border-slate-200" }}
                isDisabled={isLoadingCondiciones}
                isLoading={isLoadingCondiciones}
                placeholder={
                  isLoadingCondiciones
                    ? "Cargando..."
                    : "Selecciona una condición"
                }
              >
                {condicionesIva.map((c: any) => (
                  <SelectItem key={c.id.toString()}>{c.descripcion}</SelectItem>
                ))}
              </Select>
              {errorCondiciones && (
                <p className="text-xs text-red-600">
                  Error cargando condiciones
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Punto de Venta */}
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
                    <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Punto de venta
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Número de punto de venta asignado por AFIP
                  </p>
                </div>
              </div>
              <Input
                value={regional.puntoVenta || ""}
                onChange={(e) =>
                  setRegional({ ...regional, puntoVenta: e.target.value })
                }
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                placeholder="Ej: 0001"
              />
            </div>
          </CardBody>
        </Card>

        {/* Inicio Actividades */}
        <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardBody className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-pink-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Inicio de actividades
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Fecha de inicio de actividades registrada
                  </p>
                </div>
              </div>
              <Input
                type="date"
                value={regional.inicioActividades || ""}
                onChange={(e) =>
                  setRegional({
                    ...regional,
                    inicioActividades: e.target.value,
                  })
                }
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Ingresos Brutos */}
        <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardBody className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 text-gray-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9.5 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM4 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Ingresos Brutos
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Número de inscripción de Ingresos Brutos
                  </p>
                </div>
              </div>
              <Input
                value={regional.ingresosBrutos || ""}
                onChange={(e) =>
                  setRegional({ ...regional, ingresosBrutos: e.target.value })
                }
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                placeholder="Ej: 12-34567890-1"
              />
            </div>
          </CardBody>
        </Card>

        {hasChanges && (
          <div className="flex justify-end mt-4">
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isSavingFiscal}
            >
              Guardar Datos Fiscales
            </Button>
          </div>
        )}
      </div>
    </SectionPanel>
  );
}
