"use client";

import { Select, SelectItem, Input } from "@heroui/react";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";

import { useQuery } from "@tanstack/react-query";

interface ComprobanteSelectorProps {
  tipoComprobante: number;
  setTipoComprobante: (tipoComprobante: number) => void;
  numeroComprobanteAsociado: number | null;
  setNumeroComprobanteAsociado: (
    numeroComprobanteAsociado: number | null,
  ) => void;
  clienteCondicionIvaId?: number | string | null;
  configuracionCondicionIvaId?: number | string | null;
}

export default function ComprobanteSelector({
  tipoComprobante,
  setTipoComprobante,
  numeroComprobanteAsociado,
  setNumeroComprobanteAsociado,
  clienteCondicionIvaId,
  configuracionCondicionIvaId,
}: ComprobanteSelectorProps) {
  const { data: condicionesIva = [] } = useQuery({
    queryKey: ["condiciones-iva"],
    queryFn: async () => {
      const res = await fetch("/api/condiciones-iva");
      if (!res.ok) throw new Error("Error al cargar condiciones de IVA");
      return res.json();
    },
  });

  // Determinar opciones válidas
  let allowedTipos = [
    TIPO_COMPROBANTE_VENTA.FACTURA_A,
    TIPO_COMPROBANTE_VENTA.FACTURA_B,
    TIPO_COMPROBANTE_VENTA.FACTURA_C,
    TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
    TIPO_COMPROBANTE_VENTA.REMITO,
    TIPO_COMPROBANTE_VENTA.NOTA_CREDITO,
  ];

  if (condicionesIva.length > 0 && configuracionCondicionIvaId) {
    const issuerCondicion = condicionesIva.find((c: any) => String(c.id) === String(configuracionCondicionIvaId));
    const clientCondicion = clienteCondicionIvaId 
      ? condicionesIva.find((c: any) => String(c.id) === String(clienteCondicionIvaId))
      : null;

    if (issuerCondicion) {
      const issuerStr = issuerCondicion.descripcion.toLowerCase();
      const clientStr = clientCondicion ? clientCondicion.descripcion.toLowerCase() : "consumidor final";
      
      const isIssuerRI = issuerStr.includes("responsable inscripto");
      const isClientRI = clientStr.includes("responsable inscripto");

      if (isIssuerRI) {
        allowedTipos = [
          isClientRI ? TIPO_COMPROBANTE_VENTA.FACTURA_A : TIPO_COMPROBANTE_VENTA.FACTURA_B,
          TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
          TIPO_COMPROBANTE_VENTA.REMITO,
          TIPO_COMPROBANTE_VENTA.NOTA_CREDITO,
        ];
      } else {
        allowedTipos = [
          TIPO_COMPROBANTE_VENTA.FACTURA_C,
          TIPO_COMPROBANTE_VENTA.PRESUPUESTO,
          TIPO_COMPROBANTE_VENTA.REMITO,
          TIPO_COMPROBANTE_VENTA.NOTA_CREDITO,
        ];
      }
    }
  }

  return (
    <div className="flex gap-2 w-full items-center">
      <Select
        aria-label="Comprobante"
        placeholder="Comprobante"
        size="sm"
        className="w-full"
        selectedKeys={[tipoComprobante.toString()]}
        value={tipoComprobante.toString()}
        onChange={(e) => setTipoComprobante(Number(e.target.value))}
        classNames={{
          trigger:
            "h-10 min-h-10 rounded-lg shadow-none bg-white border border-slate-300 hover:border-[#67afc3] hover:bg-slate-50 text-black transition-colors",
        }}
      >
        {allowedTipos.includes(TIPO_COMPROBANTE_VENTA.FACTURA_A) && (
          <SelectItem
            key={TIPO_COMPROBANTE_VENTA.FACTURA_A}
            textValue={"Factura A"}
          >
            Factura A
          </SelectItem>
        )}
        {allowedTipos.includes(TIPO_COMPROBANTE_VENTA.FACTURA_B) && (
          <SelectItem
            key={TIPO_COMPROBANTE_VENTA.FACTURA_B}
            textValue={"Factura B"}
          >
            Factura B
          </SelectItem>
        )}
        {allowedTipos.includes(TIPO_COMPROBANTE_VENTA.FACTURA_C) && (
          <SelectItem
            key={TIPO_COMPROBANTE_VENTA.FACTURA_C}
            textValue={"Factura C"}
          >
            Factura C
          </SelectItem>
        )}
        {allowedTipos.includes(TIPO_COMPROBANTE_VENTA.PRESUPUESTO) && (
          <SelectItem
            key={TIPO_COMPROBANTE_VENTA.PRESUPUESTO}
            textValue={"Presupuesto"}
          >
            Presupuesto
          </SelectItem>
        )}
        {allowedTipos.includes(TIPO_COMPROBANTE_VENTA.REMITO) && (
          <SelectItem key={TIPO_COMPROBANTE_VENTA.REMITO} textValue={"Remito"}>
            Remito
          </SelectItem>
        )}
        {allowedTipos.includes(TIPO_COMPROBANTE_VENTA.NOTA_CREDITO) && (
          <SelectItem
            key={TIPO_COMPROBANTE_VENTA.NOTA_CREDITO}
            textValue={"Nota de Credito"}
          >
            Nota de Credito
          </SelectItem>
        )}
      </Select>

      {tipoComprobante === TIPO_COMPROBANTE_VENTA.NOTA_CREDITO && (
        <Input
          placeholder="Nro. Factura"
          aria-label="Número de Factura"
          size="sm"
          className="w-32"
          type="number"
          value={numeroComprobanteAsociado?.toString() || ""}
          onValueChange={(v) =>
            setNumeroComprobanteAsociado(v ? Number(v) : null)
          }
          classNames={{
            inputWrapper:
              "h-10 min-h-10 rounded-lg shadow-none border border-slate-200 group-data-[focus=true]:border-blue-400",
          }}
        />
      )}
    </div>
  );
}
