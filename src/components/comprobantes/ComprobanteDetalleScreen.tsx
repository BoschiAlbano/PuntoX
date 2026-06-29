"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
} from "@heroui/react";
import {
  FileText,
  ArrowLeft,
  TrendingUp,
  User,
  Building2,
  MapPin,
  Percent,
  Banknote,
  Receipt,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import {
  TIPO_PAGO,
  TIPO_COMPROBANTE_VENTA,
} from "@/lib/constants/comprobantes";
import { TicketImpresion } from "@/components/ventas/TicketImpresion";
import { useUserStore } from "@/store/useUserStore";
import { useConfiguracion } from "@/hooks/useConfiguracion";

interface ComprobanteDetalleScreenProps {
  id: number;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getTipoComprobanteLabel = (tipo: number) => {
  switch (tipo) {
    case 1:
      return "Factura A";
    case 2:
      return "Factura B";
    case 3:
      return "Factura C";
    case 4:
      return "Presupuesto";
    case 5:
      return "Remito";
    case 6:
      return "Nota de Crédito";
    default:
      return "Comprobante";
  }
};

const getTipoComprobanteColor = (tipo: number) => {
  switch (tipo) {
    case 1:
      return { bg: "#fee2e2", text: "#b91c1c", label: "A" };
    case 2:
      return { bg: "#fef3c7", text: "#92400e", label: "B" };
    case 3:
      return { bg: "#dbeafe", text: "#1e40af", label: "C" };
    default:
      return { bg: "#e2e8f0", text: "#475569", label: "Otro" };
  }
};

function LoadingSkeleton() {
  return (
    <div className="flex flex-col w-full bg-[#F5F8FD]">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0" />
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Skeleton className="w-32 sm:w-44 h-5 sm:h-6 rounded-lg" />
                <Skeleton className="w-20 h-5 rounded-full shrink-0" />
              </div>
              <Skeleton className="w-28 h-3.5 rounded" />
            </div>
          </div>
        </div>
        <Skeleton className="w-28 sm:w-32 h-9 sm:h-11 rounded-xl shrink-0" />
      </div>

      {/* Main content skeleton */}
      <div className="px-3 pt-4 pb-3 sm:p-6 sm:pb-6 lg:p-8 lg:pb-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6">

          {/* Info cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-100 bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                  <Skeleton className="w-20 h-3 rounded" />
                </div>
                <Skeleton className="w-40 h-5 rounded" />
                <div className="space-y-2">
                  <Skeleton className="w-full h-4 rounded" />
                  <Skeleton className="w-3/4 h-4 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Items section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-6 h-6 rounded-md shrink-0" />
              <Skeleton className="w-32 h-3.5 rounded" />
            </div>

            {/* Mobile: card skeletons */}
            <div className="sm:hidden flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm p-3.5 flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <Skeleton className="w-full h-4 rounded" />
                        <Skeleton className="w-16 h-3 rounded" />
                      </div>
                    </div>
                    <Skeleton className="w-16 h-4 rounded shrink-0" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <Skeleton className="w-24 h-3 rounded" />
                    <Skeleton className="w-16 h-3 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table row skeletons */}
            <div className="hidden sm:block border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 px-4 py-3.5 border-b border-slate-100 last:border-0 bg-white even:bg-slate-50/40"
                >
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <Skeleton className="flex-1 h-5 rounded" />
                  <Skeleton className="w-24 h-5 rounded" />
                  <Skeleton className="w-24 h-5 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Payments section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-6 h-6 rounded-md shrink-0" />
              <Skeleton className="w-44 h-3.5 rounded" />
            </div>
            <div className="flex flex-wrap gap-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="w-full sm:w-36 h-11 rounded-xl" />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ComprobanteDetalleScreen({
  id,
}: ComprobanteDetalleScreenProps) {
  const router = useRouter();
  const { isAdministrador, isSuperAdmin } = useUserStore();
  const { configuracion } = useConfiguracion({ enableConfiguracion: true });
  const isAdmin = isAdministrador || isSuperAdmin;

  const {
    data: selectedTicket,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["comprobante", id, { detalle: true }],
    queryFn: async () => {
      const response = await fetch(`/api/comprobantes?id=${id}&detalle=true`);
      if (!response.ok) throw new Error("Error fetching comprobante");
      return response.json();
    },
    enabled: !!id,
  });

  const ticketRef = useRef<HTMLDivElement>(null);
  const handlePrintTicket = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: "Ticket de Venta",
  });

  const fe = selectedTicket?.FacturaElectronica ?? null;
  const feRechazado = fe?.Estado === "RECHAZADO";

  if (isLoading) return <LoadingSkeleton />;

  if (isError || !selectedTicket) {
    return (
      <div className="flex flex-col w-full min-h-[50vh] items-center justify-center bg-[#F5F8FD] gap-4">
        <div className="p-4 rounded-full bg-red-50 border border-red-100">
          <Receipt size={32} className="text-red-400" />
        </div>
        <p className="text-slate-500 font-medium">
          No se encontró información del comprobante.
        </p>
        <Button
          onPress={() => router.back()}
          startContent={<ArrowLeft size={16} />}
          variant="flat"
          className="font-semibold"
        >
          Volver
        </Button>
      </div>
    );
  }

  const esVenta = Object.values(TIPO_COMPROBANTE_VENTA).includes(
    selectedTicket.TipoComprobante,
  );
  const feAutorizado = fe?.Estado === "AUTORIZADO";
  const tieneFe = !!fe;

  const totalCosto =
    selectedTicket.DetalleComprobante?.reduce(
      (sum: number, item: any) => sum + Number(item.Costo || 0),
      0,
    ) || 0;
  const gananciaNeta = Number(selectedTicket.Total || 0) - totalCosto;
  const margenGanancia =
    Number(selectedTicket.Total) > 0
      ? (gananciaNeta / Number(selectedTicket.Total)) * 100
      : 0;
  const showRentabilidad = isAdmin && esVenta;
  const tipoColor = getTipoComprobanteColor(selectedTicket.TipoComprobante);

  const datosVentaImpresion = selectedTicket
    ? {
        items:
          selectedTicket.DetalleComprobante?.map((item: any) => ({
            cantidad: Number(item.Cantidad) || 1,
            descripcion: item.Descripcion,
            precio: Number(item.Precio),
            subtotal: Number(item.SubTotal),
          })) || [],
        cliente: selectedTicket.cliente,
        subtotal: Number(selectedTicket.SubTotal) || 0,
        descuento: Number(selectedTicket.Descuento) || 0,
        total: Number(selectedTicket.Total) || 0,
        fecha: selectedTicket.Fecha,
        numeroComprobante:
          selectedTicket.Numero?.toString().padStart(8, "0") || "00000000",
        tipoComprobante: getTipoComprobanteLabel(
          selectedTicket.TipoComprobante,
        ),
        formasPago:
          selectedTicket.FormaPago?.map((fp: any) => ({
            tipo:
              Object.keys(TIPO_PAGO).find(
                (key) =>
                  TIPO_PAGO[key as keyof typeof TIPO_PAGO] === fp.TipoPago,
              ) || "OTRO",
            monto: Number(fp.Monto),
          })) || [],
        pie: "Gracias por su compra!",
        arcaStatus: fe?.Estado,
        cae: fe?.CAE,
        caeFchVto: fe?.CAEFchVto,
        cuitEmisor: configuracion?.cuit || "",
        puntoVentaNum: fe?.PuntoVenta,
        cbteNro: fe?.CbteNumero,
      }
    : null;

  return (
    <div className="flex flex-col w-full bg-[#F5F8FD]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Button
            isIconOnly
            variant="flat"
            className="bg-white hover:bg-slate-100 shadow-sm rounded-xl transition-all duration-200 cursor-pointer shrink-0"
            onPress={() => router.back()}
            aria-label="Volver"
            size="sm"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: "#67afc3" }}
            >
              <FileText size={16} className="text-white sm:size-5" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-xl font-bold text-slate-800 leading-tight truncate">
                  #{String(selectedTicket.Numero || "").padStart(8, "0")}
                </span>
                <Chip
                  size="sm"
                  variant="flat"
                  className="font-semibold shadow-sm cursor-default shrink-0"
                  style={{ backgroundColor: tipoColor.bg, color: tipoColor.text }}
                >
                  {getTipoComprobanteLabel(selectedTicket.TipoComprobante)}
                </Chip>
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-500 truncate">
                {formatDate(selectedTicket.Fecha)}
              </span>
            </div>
          </div>
        </div>

        <Button
          onPress={() => handlePrintTicket()}
          size="sm"
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 sm:px-6 h-9 sm:h-11 rounded-xl shadow-md transition-all duration-200 cursor-pointer shrink-0"
          startContent={<FileText size={16} strokeWidth={2.5} />}
        >
          Reimprimir
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-4 sm:space-y-6 px-3 pt-4 pb-6 sm:p-6 sm:pb-8 lg:p-8 lg:pb-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6">
          {/* Info Cards Grid */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${showRentabilidad ? "lg:grid-cols-3" : ""} gap-3 sm:gap-4`}
          >
            {/* Cliente */}
            <Card className="shadow-sm border border-slate-100 bg-white rounded-xl transition-shadow duration-200 hover:shadow-md">
              <CardBody className="py-4 px-5 gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#67afc315" }}
                  >
                    <User size={14} style={{ color: "#67afc3" }} />
                  </div>
                  <span
                    className="text-[11px] uppercase font-bold tracking-widest"
                    style={{ color: "#67afc3" }}
                  >
                    Cliente
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-base font-bold text-slate-800">
                    {selectedTicket.cliente?.Nombre
                      ? `${selectedTicket.cliente.Nombre} ${selectedTicket.cliente.Apellido || ""}`.trim()
                      : "Consumidor Final"}
                  </p>
                  {selectedTicket.cliente?.Dni && (
                    <div className="flex items-center gap-1.5">
                      <Building2
                        size={13}
                        className="text-slate-400 flex-shrink-0"
                      />
                      <span className="text-sm text-slate-500">
                        CUIT / DNI:{" "}
                        <span className="font-semibold text-slate-700">
                          {selectedTicket.cliente.Dni}
                        </span>
                      </span>
                    </div>
                  )}
                  {selectedTicket.cliente?.Direccion && (
                    <div className="flex items-center gap-1.5">
                      <MapPin
                        size={13}
                        className="text-slate-400 flex-shrink-0"
                      />
                      <span className="text-sm text-slate-500">
                        {selectedTicket.cliente.Direccion}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Resumen Económico */}
            <Card className="shadow-sm border border-slate-100 bg-white rounded-xl transition-shadow duration-200 hover:shadow-md">
              <CardBody className="py-4 px-5 gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#67afc315" }}
                  >
                    <Banknote size={14} style={{ color: "#67afc3" }} />
                  </div>
                  <span
                    className="text-[11px] uppercase font-bold tracking-widest"
                    style={{ color: "#67afc3" }}
                  >
                    Resumen Económico
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(selectedTicket.SubTotal)}
                    </span>
                  </div>
                  {Number(selectedTicket.Descuento) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Descuento</span>
                      <span className="font-bold text-red-500">
                        -{formatCurrency(selectedTicket.Descuento)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-700">
                      Total Facturado
                    </span>
                    <span
                      className="text-xl font-black tracking-tight"
                      style={{ color: "#67afc3" }}
                    >
                      {formatCurrency(selectedTicket.Total)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Rentabilidad (Admin) */}
            {showRentabilidad && (
              <Card className="shadow-sm border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white rounded-xl transition-shadow duration-200 hover:shadow-md">
                <CardBody className="py-4 px-5 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-100">
                      <Percent size={14} className="text-emerald-600" />
                    </div>
                    <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-600">
                      Rentabilidad
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Costo Total</span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(totalCosto)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Ganancia Neta</span>
                      <span
                        className={`font-bold ${gananciaNeta >= 0 ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {formatCurrency(gananciaNeta)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-emerald-200/50">
                      <span className="text-sm font-bold text-slate-700">
                        Margen
                      </span>
                      <span
                        className={`text-xl font-black tracking-tight ${margenGanancia >= 0 ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {margenGanancia.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* ARCA / FE Status */}
          {tieneFe && (
            <div
              className={`rounded-2xl border px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 shadow-sm transition-all duration-200 ${
                feAutorizado
                  ? "bg-emerald-50/60 border-emerald-200"
                  : feRechazado
                    ? "bg-red-50/60 border-red-200"
                    : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      feAutorizado
                        ? "bg-emerald-100"
                        : feRechazado
                          ? "bg-red-100"
                          : "bg-slate-200/60"
                    }`}
                  >
                    <Receipt
                      size={16}
                      className={
                        feAutorizado
                          ? "text-emerald-600"
                          : feRechazado
                            ? "text-red-500"
                            : "text-slate-500"
                      }
                    />
                  </div>
                  <span
                    className={`text-xs uppercase font-bold tracking-wider ${
                      feAutorizado
                        ? "text-emerald-700"
                        : feRechazado
                          ? "text-red-600"
                          : "text-slate-600"
                    }`}
                  >
                    Facturación Electrónica ARCA
                  </span>
                </div>
                <Chip
                  size="sm"
                  variant="flat"
                  className="font-bold shadow-sm cursor-default shrink-0"
                  color={
                    feAutorizado
                      ? "success"
                      : feRechazado
                        ? "danger"
                        : "default"
                  }
                >
                  {fe.Estado}
                </Chip>
              </div>

              {feAutorizado && fe.CAE && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-white/70 p-3 sm:p-4 rounded-xl border border-emerald-100/60">
                  {[
                    { label: "Código CAE", value: fe.CAE, mono: true },
                    {
                      label: "Vencimiento",
                      value: fe.CAEFchVto
                        ? new Date(fe.CAEFchVto).toLocaleDateString("es-AR")
                        : "-",
                    },
                    {
                      label: "Punto de Venta",
                      value: String(fe.PuntoVenta).padStart(4, "0"),
                    },
                    {
                      label: "Nro. Comprobante",
                      value: String(fe.CbteNumero).padStart(8, "0"),
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700/60">
                        {item.label}
                      </span>
                      <span
                        className={`font-bold text-emerald-900 text-xs sm:text-sm break-all ${item.mono ? "font-mono tracking-wide" : ""}`}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {feRechazado && fe.Observaciones && (
                <div className="p-3 rounded-lg bg-red-100/60 border border-red-200">
                  <p className="text-xs font-semibold text-red-700 mb-0.5">
                    Motivo del rechazo:
                  </p>
                  <p className="text-xs text-red-600 leading-relaxed">
                    {fe.Observaciones}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: "#67afc315" }}
              >
                <FileText size={13} style={{ color: "#67afc3" }} />
              </div>
              <h4
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#67afc3" }}
              >
                Detalle de Ítems
              </h4>
            </div>

            {/* Mobile: card list */}
            <div className="sm:hidden flex flex-col gap-2">
              {selectedTicket.DetalleComprobante?.map(
                (item: any, idx: number) => {
                  const cantidad = Number(item.Cantidad || 1);
                  const costoTotalItem = Number(item.Costo || 0);
                  const costoUnitario =
                    cantidad > 0 ? costoTotalItem / cantidad : 0;
                  const precioUnitario = Number(item.Precio || 0);
                  const subtotalItem = Number(item.SubTotal || 0);
                  const gananciaItem = subtotalItem - costoTotalItem;

                  return (
                    <div
                      key={item.Id}
                      className={`rounded-xl border border-slate-200 shadow-sm p-3.5 flex flex-col gap-2.5 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100/80 text-slate-700 font-bold text-xs shrink-0">
                            {cantidad}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-800 text-sm leading-tight">
                              {item.Descripcion}
                            </span>
                            {item.Codigo && (
                              <span className="text-[10px] font-medium text-slate-400">
                                SKU: {item.Codigo}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-black text-slate-900 shrink-0">
                          {formatCurrency(subtotalItem)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-400">
                          Precio u.:{" "}
                          <span className="font-semibold text-slate-600">
                            {formatCurrency(precioUnitario)}
                          </span>
                        </span>
                        {showRentabilidad && (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">
                              Costo:{" "}
                              <span className="font-semibold text-slate-600">
                                {formatCurrency(costoUnitario)}
                              </span>
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                gananciaItem >= 0
                                  ? "text-emerald-600"
                                  : "text-red-500"
                              }`}
                            >
                              {formatCurrency(gananciaItem)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table
                  aria-label="Items del comprobante"
                  removeWrapper
                  classNames={{
                    th: "text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 py-3.5 px-4 border-b border-slate-200 whitespace-nowrap",
                    td: "text-sm py-3.5 px-4 whitespace-nowrap",
                    tr: "border-b border-slate-100 last:border-0 transition-colors duration-150",
                  }}
                >
                  <TableHeader>
                    <TableColumn className="w-16 text-center">CANT</TableColumn>
                    <TableColumn>DESCRIPCIÓN</TableColumn>
                    <TableColumn
                      align="end"
                      className={showRentabilidad ? "" : "hidden"}
                    >
                      COSTO U.
                    </TableColumn>
                    <TableColumn align="end">PRECIO U.</TableColumn>
                    <TableColumn align="end">SUBTOTAL</TableColumn>
                    <TableColumn
                      align="end"
                      className={showRentabilidad ? "" : "hidden"}
                    >
                      GANANCIA
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {selectedTicket.DetalleComprobante?.map(
                      (item: any, idx: number) => {
                        const cantidad = Number(item.Cantidad || 1);
                        const costoTotalItem = Number(item.Costo || 0);
                        const costoUnitario =
                          cantidad > 0 ? costoTotalItem / cantidad : 0;
                        const precioUnitario = Number(item.Precio || 0);
                        const subtotalItem = Number(item.SubTotal || 0);
                        const gananciaItem = subtotalItem - costoTotalItem;

                        return (
                          <TableRow
                            key={item.Id}
                            className={
                              idx % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50/40 hover:bg-slate-100/60"
                            }
                          >
                            <TableCell>
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100/80 text-slate-700 font-bold text-xs mx-auto">
                                {cantidad}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-semibold text-slate-800 text-sm">
                                  {item.Descripcion}
                                </span>
                                {item.Codigo && (
                                  <span className="text-[11px] font-medium text-slate-400">
                                    SKU: {item.Codigo}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell
                              className={`text-right ${showRentabilidad ? "" : "hidden"}`}
                            >
                              <span className="text-sm text-slate-500 font-medium">
                                {formatCurrency(costoUnitario)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm text-slate-600 font-medium">
                                {formatCurrency(precioUnitario)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-bold text-slate-900">
                                {formatCurrency(subtotalItem)}
                              </span>
                            </TableCell>
                            <TableCell
                              className={`text-right ${showRentabilidad ? "" : "hidden"}`}
                            >
                              <span
                                className={`text-sm font-bold ${gananciaItem >= 0 ? "text-emerald-600" : "text-red-500"}`}
                              >
                                {formatCurrency(gananciaItem)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Pagos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: "#67afc315" }}
              >
                <TrendingUp size={13} style={{ color: "#67afc3" }} />
              </div>
              <h4
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#67afc3" }}
              >
                Formas de pago recibidas
              </h4>
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedTicket.FormaPago?.map((fp: any) => {
                const label =
                  Object.keys(TIPO_PAGO).find(
                    (key) =>
                      TIPO_PAGO[key as keyof typeof TIPO_PAGO] === fp.TipoPago,
                  ) || "OTRO";
                return (
                  <div
                    key={fp.Id}
                    className="w-full sm:w-auto rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between sm:justify-start gap-2 sm:gap-3 border shadow-sm transition-all duration-200 hover:shadow-md cursor-default"
                    style={{
                      backgroundColor: "#67afc308",
                      borderColor: "#67afc325",
                    }}
                  >
                    <span
                      className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-1 rounded-md"
                      style={{
                        backgroundColor: "#67afc315",
                        color: "#3a8fa3",
                      }}
                    >
                      {label}
                    </span>
                    <div
                      className="w-px h-4 sm:h-5 hidden sm:block"
                      style={{ backgroundColor: "#67afc320" }}
                    />
                    <span className="font-black text-slate-800 text-sm sm:text-base tracking-tight">
                      {formatCurrency(fp.Monto)}
                    </span>
                  </div>
                );
              })}
              {(!selectedTicket.FormaPago ||
                selectedTicket.FormaPago.length === 0) && (
                <p className="text-sm text-slate-400 italic">
                  Sin formas de pago registradas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Ticket Component */}
      <div style={{ display: "none" }}>
        <TicketImpresion ref={ticketRef} datosVenta={datosVentaImpresion} />
      </div>
    </div>
  );
}
