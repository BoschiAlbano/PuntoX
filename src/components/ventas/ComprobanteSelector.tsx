"use client";

import { Select, SelectItem, Input } from "@heroui/react";
import { TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";

interface ComprobanteSelectorProps {
  tipoComprobante: number;
  setTipoComprobante: (tipoComprobante: number) => void;
  numeroComprobanteAsociado: number | null;
  setNumeroComprobanteAsociado: (
    numeroComprobanteAsociado: number | null,
  ) => void;
}

export default function ComprobanteSelector({
  tipoComprobante,
  setTipoComprobante,
  numeroComprobanteAsociado,
  setNumeroComprobanteAsociado,
}: ComprobanteSelectorProps) {
  return (
    <div className="flex gap-2 w-full items-end rounded-lg">
      <Select
        label="Comprobante"
        size="sm"
        className="w-full"
        selectedKeys={[tipoComprobante.toString()]}
        value={tipoComprobante.toString()}
        onChange={(e) => setTipoComprobante(Number(e.target.value))}
        classNames={{
          trigger:
            "h-10 min-h-10 rounded-lg shadow-none bg-transparent text-black hover:bg-white",
        }}
      >
        <SelectItem
          key={TIPO_COMPROBANTE_VENTA.FACTURA_A}
          textValue={"Factura A"}
        >
          Factura A
        </SelectItem>
        <SelectItem
          key={TIPO_COMPROBANTE_VENTA.FACTURA_B}
          textValue={"Factura B"}
        >
          Factura B
        </SelectItem>
        <SelectItem
          key={TIPO_COMPROBANTE_VENTA.FACTURA_C}
          textValue={"Factura C"}
        >
          Factura C
        </SelectItem>
        <SelectItem
          key={TIPO_COMPROBANTE_VENTA.PRESUPUESTO}
          textValue={"Presupuesto"}
        >
          Presupuesto
        </SelectItem>
        <SelectItem key={TIPO_COMPROBANTE_VENTA.REMITO} textValue={"Remito"}>
          Remito
        </SelectItem>
        <SelectItem
          key={TIPO_COMPROBANTE_VENTA.NOTA_CREDITO}
          textValue={"Nota de Credito"}
        >
          Nota de Credito
        </SelectItem>
      </Select>

      {tipoComprobante === TIPO_COMPROBANTE_VENTA.NOTA_CREDITO && (
        <Input
          label="Nro. Factura"
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
