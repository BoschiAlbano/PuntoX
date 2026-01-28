import { useConfiguracion } from "@/hooks/useConfiguracion";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";
import React, { forwardRef, useMemo } from "react";

interface TicketProps {
  datosVenta: {
    items: any[];
    cliente: any;
    subtotal: number;
    descuento: number;
    total: number;
    fecha: string;
    numeroComprobante: string;
    tipoComprobante: string;
    formasPago: any[];
  } | null;
}

export const TicketImpresion = forwardRef<HTMLDivElement, TicketProps>(
  ({ datosVenta }, ref) => {
    console.log("datosVenta", datosVenta);
    const { configuracion } = useConfiguracion({
      enableConfiguracion: true,
    });

    // Helper function to get payment method name
    const getNombrePago = (tipo: number) => {
      const entry = Object.entries(TIPO_PAGO).find(
        ([, value]) => value === tipo,
      );
      return entry ? entry[0] : "OTRO";
    };

    const calculatedData = useMemo(() => {
      if (!datosVenta) return null;

      const isFacturaA = datosVenta.tipoComprobante === "Factura A";

      if (!isFacturaA) {
        return {
          items: datosVenta.items,
          subtotal: datosVenta.subtotal,
          descuento: datosVenta.descuento,
          ivaBreakdown: null,
          isFacturaA: false,
        };
      }

      // Logic for Factura A
      let netSubtotal = 0;
      const ivaMap: Record<number, number> = {};

      const netItems = datosVenta.items.map((item) => {
        const ivaRate = Number(item.Iva?.Porcentaje || 0);
        const div = 1 + ivaRate / 100;
        const net = item.subtotal / div;

        netSubtotal += net;

        // Calculate IVA for this item
        const iva = item.subtotal - net;
        ivaMap[ivaRate] = (ivaMap[ivaRate] || 0) + iva;

        return {
          ...item,
          subtotal: net,
        };
      });

      // Apply discount to Net Subtotal and IVA
      const discountRate =
        datosVenta.subtotal > 0
          ? datosVenta.descuento / datosVenta.subtotal
          : 0;
      const netDiscount = netSubtotal * discountRate;

      // Adjust IVA values by discount
      const finalIvaMap: Record<number, number> = {};
      Object.entries(ivaMap).forEach(([rate, amount]) => {
        finalIvaMap[Number(rate)] = amount * (1 - discountRate);
      });

      return {
        items: netItems,
        subtotal: netSubtotal,
        descuento: netDiscount,
        ivaBreakdown: finalIvaMap,
        isFacturaA: true,
      };
    }, [datosVenta]);

    if (!datosVenta || !calculatedData) return null;

    return (
      <div
        ref={ref}
        className="p-2 font-mono text-xs text-black bg-white"
        style={{ width: "80mm", margin: "0 auto" }}
      >
        {/* Logo */}
        <section className="flex justify-center items-center">
          {configuracion?.ShowFoto && configuracion?.foto && (
            <img src={configuracion.foto} alt="Logo" className=" w-1/3" />
          )}
        </section>

        {/* Header */}
        <div className="text-center mb-2">
          <h2 className="font-bold text-sm uppercase">
            {configuracion?.nombreFantasia || configuracion?.razonSocial}
          </h2>
          <p>{configuracion?.direccion}</p>
          <p>CUIT: {configuracion?.cuit}</p>
          <p>Tel: {configuracion?.telefono}</p>
        </div>

        <div className="border-b border-black border-dashed my-2" />

        {/* Info Comprobante */}
        <div className="mb-2">
          <p>Fecha: {new Date(datosVenta.fecha).toLocaleString()}</p>
          <p>
            Comp: {datosVenta.tipoComprobante} N° {datosVenta.numeroComprobante}
          </p>
          <p>
            Cliente:{" "}
            {datosVenta.cliente?.Nombre
              ? `${datosVenta.cliente.Nombre} ${datosVenta.cliente.Apellido || ""}`
              : "Consumidor Final"}
          </p>
          {datosVenta.cliente?.Cuit && (
            <p>CUIT/DNI: {datosVenta.cliente.Cuit}</p>
          )}
        </div>

        <div className="border-b border-black border-dashed my-2" />

        {/* Items */}
        <table className="w-full mb-2">
          <thead>
            <tr className="text-left">
              <th className="w-8">Cant</th>
              <th>Desc</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {calculatedData.items.map((item: any, i: number) => (
              <tr key={i}>
                <td className="align-top">{item.cantidad}</td>
                <td className="align-top pr-1">{item.Descripcion}</td>
                <td className="text-right align-top">
                  ${item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-b border-black border-dashed my-2" />

        {/* Totals */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span>Subtotal{calculatedData.isFacturaA ? " (Neto)" : ""}:</span>
            <span>${calculatedData.subtotal.toFixed(2)}</span>
          </div>
          {calculatedData.descuento > 0 && (
            <div className="flex justify-between">
              <span>Descuento:</span>
              <span>-${calculatedData.descuento.toFixed(2)}</span>
            </div>
          )}

          {/* IVA Breakdown for Factura A */}
          {calculatedData.isFacturaA &&
            calculatedData.ivaBreakdown &&
            Object.entries(calculatedData.ivaBreakdown).map(
              ([rate, amount]) =>
                amount > 0 && (
                  <div key={rate} className="flex justify-between">
                    <span>IVA {rate}%:</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                ),
            )}

          <div className="flex justify-between font-bold text-sm mt-1">
            <span>TOTAL:</span>
            <span>${datosVenta.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-b border-black border-dashed my-2" />

        {/* Formas de Pago */}
        <div className="mb-2">
          <p className="font-bold mb-1">Formas de Pago:</p>
          {datosVenta.formasPago.map((p: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>{getNombrePago(p.tipoPago)}</span>
              <span>${p.monto.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-b border-black border-dashed my-2" />

        {/* Footer */}
        <div className="text-center text-[10px] mt-4">
          <p>¡Gracias por su compra!</p>
          <p className="mt-1">PuntoX Software</p>
        </div>
      </div>
    );
  },
);

TicketImpresion.displayName = "TicketImpresion";
