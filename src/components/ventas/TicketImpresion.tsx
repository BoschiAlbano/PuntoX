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
    pie: string;
  } | null;
}

// ════════════════════════════════════════════════════════════════════════
//  Helpers de texto — réplica del TicketPrinter de C#
//  48mm imprimibles → ~28 caracteres por línea con Arial 11px
// ════════════════════════════════════════════════════════════════════════
const MAX = 36;

const truncate = (t: string, max = MAX) =>
  !t ? "" : t.length > max ? t.substring(0, max) : t;

const addLine = (t = "") => truncate(t, MAX);

const addCenter = (t: string) => {
  const s = truncate(t, MAX);
  const pad = Math.max(0, Math.floor((MAX - s.length) / 2));
  return " ".repeat(pad) + s;
};

const addExtremes = (left: string, right: string) => {
  const l = truncate(left, MAX - right.length - 1);
  const r = truncate(right, MAX - l.length - 1);
  const spaces = Math.max(1, MAX - l.length - r.length);
  return l + " ".repeat(spaces) + r;
};

const addSeparator = () => "*".repeat(MAX);

const fmt = (n: number) => `$${n.toFixed(2)}`;

const fmtCant = (n: number) =>
  n === Math.trunc(n) ? n.toFixed(0) : n.toFixed(3);

// Word-wrap: corta por palabras completas, nunca a la mitad de una
const wrapWords = (text: string, max = 25): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length === 0) {
      // Palabra más larga que MAX → partirla por fuerza
      current = word.length > max ? word.substring(0, max) : word;
    } else if (current.length + 1 + word.length <= max) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word.length > max ? word.substring(0, max) : word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

export const TicketImpresion = forwardRef<HTMLDivElement, TicketProps>(
  ({ datosVenta }, ref) => {
    const { configuracion } = useConfiguracion({
      enableConfiguracion: true,
    });

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

      let netSubtotal = 0;
      const ivaMap: Record<number, number> = {};

      const netItems = datosVenta.items.map((item) => {
        const ivaRate = Number(item.Iva?.Porcentaje || 0);
        const div = 1 + ivaRate / 100;
        const net = item.subtotal / div;
        netSubtotal += net;
        const iva = item.subtotal - net;
        ivaMap[ivaRate] = (ivaMap[ivaRate] || 0) + iva;
        return { ...item, subtotal: net };
      });

      const discountRate =
        datosVenta.subtotal > 0
          ? datosVenta.descuento / datosVenta.subtotal
          : 0;
      const netDiscount = netSubtotal * discountRate;

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

    // ══════════════════════════════════════════════════════════════════
    //  Construir líneas del ticket (igual que StringBuilder en C#)
    // ══════════════════════════════════════════════════════════════════
    const ticketLines = useMemo(() => {
      if (!datosVenta || !calculatedData) return [];

      const lines: string[] = [];
      const push = (l: string) => lines.push(l);

      // ── Encabezado empresa ─────────────────────────────────────────
      push(
        addCenter(
          (
            configuracion?.nombreFantasia ||
            configuracion?.razonSocial ||
            ""
          ).toUpperCase(),
        ),
      );
      push(addLine());
      push(addSeparator());

      if (configuracion?.direccion)
        push(addLine(`Dire: ${configuracion.direccion}`));
      if (configuracion?.cuit) push(addLine(`Cuit: ${configuracion.cuit}`));
      if (configuracion?.telefono)
        push(addLine(`Tel: ${configuracion.telefono}`));

      push(addSeparator());

      // ── Datos del comprobante ──────────────────────────────────────
      push(addLine(`Fecha: ${new Date(datosVenta.fecha).toLocaleString()}`));
      push(
        addLine(
          `Comp: ${datosVenta.tipoComprobante} N° ${datosVenta.numeroComprobante.toString().padStart(8, "0")}`,
        ),
      );
      const clienteNombre = datosVenta.cliente?.Nombre
        ? `${datosVenta.cliente.Nombre} ${datosVenta.cliente.Apellido || ""}`
        : "Consumidor Final";
      push(addLine(`Cliente: ${clienteNombre}`));
      if (datosVenta.cliente?.Cuit) {
        push(addLine(`CUIT/DNI: ${datosVenta.cliente.Cuit}`));
      }

      push(addSeparator());

      // ── Cabecera artículos ─────────────────────────────────────────
      push(addLine("Art.  Cant. P/U  Sub.T"));
      push(addSeparator());

      // ── Artículos (formato apilado como en C#) ─────────────────────
      calculatedData.items.forEach((item: any) => {
        const precioUnit =
          item.cantidad > 0 ? item.subtotal / item.cantidad : item.subtotal;

        // Línea(s) de descripción con word-wrap
        const descLines = wrapWords(item.Descripcion || "");
        descLines.forEach((l) => push(l));

        // Línea: cant X $precio = $subtotal
        push(
          addLine(
            `${fmtCant(item.cantidad)} X ${fmt(precioUnit)} = ${fmt(item.subtotal)}`,
          ),
        );
        push(addLine());
      });

      push(addSeparator());

      // ── Totales ────────────────────────────────────────────────────
      push(
        addExtremes(
          `Sub.T${calculatedData.isFacturaA ? " (Neto)" : ""}:`,
          fmt(calculatedData.subtotal),
        ),
      );

      if (calculatedData.descuento > 0) {
        push(addExtremes("Descuento:", `-${fmt(calculatedData.descuento)}`));
      }

      // IVA Factura A
      if (calculatedData.isFacturaA && calculatedData.ivaBreakdown) {
        Object.entries(calculatedData.ivaBreakdown).forEach(
          ([rate, amount]) => {
            if (amount > 0) {
              push(addExtremes(`IVA ${rate}%:`, fmt(amount)));
            }
          },
        );
      }

      push(addSeparator());
      push(addExtremes("TOTAL:", fmt(datosVenta.total)));
      push(addSeparator());

      // ── Formas de pago ─────────────────────────────────────────────
      push(addLine("Pagos"));
      datosVenta.formasPago.forEach((p: any) => {
        push(
          addCenter(
            (() => {
              const s = getNombrePago(p.tipoPago).toLowerCase();
              return s.charAt(0).toUpperCase() + s.slice(1);
            })() +
              ": " +
              fmt(p.monto),
          ),
        );
      });

      push(addSeparator());

      // ── Pie ────────────────────────────────────────────────────────
      push(addLine());
      wrapWords(datosVenta.pie).forEach((l) => push(addCenter(l)));
      push(addLine());
      push(addCenter("PuntoX Software"));
      push(addCenter("www.puntox.com.ar"));

      push(addLine());

      return lines;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [datosVenta, calculatedData, configuracion]);

    if (!datosVenta || !calculatedData) return null;

    return (
      <div
        ref={ref}
        style={{
          width: "220px",
          maxWidth: "220px",
          margin: "0 auto",
          padding: "0",
          background: "#fff",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Logo centrado */}
        {configuracion?.ShowFoto && configuracion?.foto && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "75%",
              // marginBottom: "4px",
            }}
          >
            <img
              src={configuracion.foto}
              alt="Logo"
              style={{
                maxWidth: "90px",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Contenido del ticket renderizado como <pre> */}
        <pre
          style={{
            fontFamily: "Arial",
            fontSize: "12px",
            lineHeight: "1.3",
            margin: 0,
            padding: "0",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            color: "#000",
          }}
        >
          {ticketLines.join("\n")}
        </pre>
      </div>
    );
  },
);

TicketImpresion.displayName = "TicketImpresion";
