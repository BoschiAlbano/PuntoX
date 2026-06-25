"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  addToast,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { FileText, ArrowLeft, TrendingUp, Calendar, ArrowRightLeft } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { TIPO_PAGO, TIPO_COMPROBANTE_VENTA } from "@/lib/constants/comprobantes";
import { TicketImpresion } from "@/components/ventas/TicketImpresion";
import { useUserStore } from "@/store/useUserStore";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { LoadingComponent } from "@/components/loading/loading";

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

export default function ComprobanteDetalleScreen({ id }: ComprobanteDetalleScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tenant, isAdministrador, isSuperAdmin } = useUserStore();
  const { configuracion, fiscal } = useConfiguracion({ enableConfiguracion: true });
  const isAdmin = isAdministrador || isSuperAdmin;

  const { data: selectedTicket, isLoading, isError } = useQuery({
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

  // Estado para corrección de fecha
  const { isOpen: isFechaOpen, onOpen: onFechaOpen, onOpenChange: onFechaOpenChange } = useDisclosure();
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [isGuardandoFecha, setIsGuardandoFecha] = useState(false);

  // Estado para cambio de tipo
  const { isOpen: isTipoOpen, onOpen: onTipoOpen, onOpenChange: onTipoOpenChange } = useDisclosure();
  const [nuevoTipo, setNuevoTipo] = useState<number>(0);
  const [isGuardandoTipo, setIsGuardandoTipo] = useState(false);

  // Condiciones IVA (para filtrar tipos válidos como en ComprobanteSelector)
  const { data: condicionesIva = [] } = useQuery({
    queryKey: ["condiciones-iva"],
    queryFn: async () => {
      const res = await fetch("/api/condiciones-iva");
      if (!res.ok) throw new Error("Error al cargar condiciones de IVA");
      return res.json();
    },
  });

  // Determinar tipos de comprobante fiscales permitidos (misma lógica que ComprobanteSelector)
  const tiposFiscalesPermitidos = React.useMemo(() => {
    if (condicionesIva.length === 0 || !fiscal?.condicionIvaId) return [];
    const issuerCondicion = condicionesIva.find(
      (c: any) => String(c.id) === String(fiscal.condicionIvaId),
    );
    const clientCondicionIvaId = (selectedTicket as any)?.Comprobante_Factura?.Persona_Cliente?.CondicionIvaId;
    const clientCondicion = clientCondicionIvaId
      ? condicionesIva.find((c: any) => String(c.id) === String(clientCondicionIvaId))
      : null;

    if (!issuerCondicion) return [];
    const issuerStr = issuerCondicion.descripcion.toLowerCase();
    const clientStr = clientCondicion
      ? clientCondicion.descripcion.toLowerCase()
      : "consumidor final";
    const isIssuerRI = issuerStr.includes("responsable inscripto");
    const isClientRI = clientStr.includes("responsable inscripto");

    if (isIssuerRI) {
      return [
        isClientRI
          ? TIPO_COMPROBANTE_VENTA.FACTURA_A
          : TIPO_COMPROBANTE_VENTA.FACTURA_B,
      ];
    }
    return [TIPO_COMPROBANTE_VENTA.FACTURA_C];
  }, [condicionesIva, fiscal, selectedTicket]);

  const fe = selectedTicket?.FacturaElectronica ?? null;
  const feRechazado = fe?.Estado === "RECHAZADO";

  const handleCorregirFecha = async () => {
    if (!nuevaFecha) {
      addToast({ title: "Error", description: "Seleccione una fecha", color: "danger" });
      return;
    }

    setIsGuardandoFecha(true);
    try {
      const response = await fetch("/api/comprobantes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comprobanteId: id,
          fecha: nuevaFecha,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      addToast({
        title: "Fecha corregida",
        description: "La fecha se actualizó. Ahora puede reintentar la facturación.",
        color: "success",
      });

      // Refrescar datos
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["comprobante", id] }),
        queryClient.invalidateQueries({ queryKey: ["caja"] }),
      ]);
      onFechaOpenChange();
      setNuevaFecha("");
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message || "No se pudo actualizar la fecha",
        color: "danger",
      });
    } finally {
      setIsGuardandoFecha(false);
    }
  };

  const handleReintentarFe = async () => {
    try {
      const response = await fetch(`/api/facturacion/electronica/${id}/reprocesar`, {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.observaciones || "Error al reintentar");

      addToast({
        title: "Comprobante autorizado",
        description: `CAE: ${data.result.cae}`,
        color: "success",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["comprobante", id] }),
        queryClient.invalidateQueries({ queryKey: ["caja"] }),
      ]);
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message || "No se pudo autorizar",
        color: "danger",
      });
    }
  };

  const handleCambiarTipo = async () => {
    if (!nuevoTipo) {
      addToast({ title: "Error", description: "Seleccione un tipo de comprobante", color: "danger" });
      return;
    }
    setIsGuardandoTipo(true);
    try {
      const response = await fetch("/api/comprobantes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comprobanteId: id,
          tipoComprobante: nuevoTipo,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      addToast({
        title: "Tipo cambiado",
        description: `El comprobante ahora es ${getTipoComprobanteLabel(nuevoTipo)}. Puede reintentar la facturación.`,
        color: "success",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["comprobante", id] }),
        queryClient.invalidateQueries({ queryKey: ["caja"] }),
      ]);
      onTipoOpenChange();
      setNuevoTipo(0);
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message || "No se pudo cambiar el tipo",
        color: "danger",
      });
    } finally {
      setIsGuardandoTipo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <LoadingComponent message="Cargando detalles..." />
      </div>
    );
  }

  if (isError || !selectedTicket) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center bg-[#F5F8FD]">
        <p className="text-slate-500 mb-4">No se encontró información del comprobante.</p>
        <Button onPress={() => router.back()} startContent={<ArrowLeft size={16} />}>
          Volver
        </Button>
      </div>
    );
  }

  const esVenta = selectedTicket ? Object.values(TIPO_COMPROBANTE_VENTA).includes(selectedTicket.TipoComprobante) : false;
  const feAutorizado = fe?.Estado === "AUTORIZADO";
  const tieneFe = !!fe;

  // item.Costo en la base de datos ya almacena el costo total del renglón (Costo Unitario * Cantidad)
  const totalCosto = selectedTicket?.DetalleComprobante?.reduce((sum: number, item: any) => sum + Number(item.Costo || 0), 0) || 0;
  const gananciaNeta = Number(selectedTicket?.Total || 0) - totalCosto;
  const margenGanancia = Number(selectedTicket?.Total || 0) > 0 ? (gananciaNeta / Number(selectedTicket?.Total)) * 100 : 0;
  const showRentabilidad = isAdmin && esVenta;

  const datosVentaImpresion = selectedTicket ? {
    items: selectedTicket.DetalleComprobante?.map((item: any) => ({
      cantidad: Number(item.Cantidad) || 1,
      descripcion: item.Descripcion,
      precio: Number(item.Precio),
      subtotal: Number(item.SubTotal)
    })) || [],
    cliente: selectedTicket.cliente,
    subtotal: Number(selectedTicket.SubTotal) || 0,
    descuento: Number(selectedTicket.Descuento) || 0,
    total: Number(selectedTicket.Total) || 0,
    fecha: selectedTicket.Fecha,
    numeroComprobante: selectedTicket.Numero?.toString().padStart(8, "0") || "00000000",
    tipoComprobante: getTipoComprobanteLabel(selectedTicket.TipoComprobante),
    formasPago: selectedTicket.FormaPago?.map((fp: any) => ({
      tipo: Object.keys(TIPO_PAGO).find(key => TIPO_PAGO[key as keyof typeof TIPO_PAGO] === fp.TipoPago) || "OTRO",
      monto: Number(fp.Monto)
    })) || [],
    pie: "Gracias por su compra!",
    arcaStatus: fe?.Estado,
    cae: fe?.CAE,
    caeFchVto: fe?.CAEFchVto,
    cuitEmisor: configuracion?.cuit || "",
    puntoVentaNum: fe?.PuntoVenta,
    cbteNro: fe?.CbteNumero
  } : null;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#F5F8FD] p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="flat"
            className="bg-white hover:bg-slate-100 shadow-sm rounded-xl"
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#67afc3]/20"
              style={{ backgroundColor: "#67afc3" }}
            >
              <FileText size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-800 leading-tight">
                Comprobante #{selectedTicket.Numero?.toString().padStart(8, "0") || "00000000"}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {formatDate(selectedTicket.Fecha)}
              </span>
            </div>
          </div>
          <Chip
            size="md"
            variant="flat"
            style={{
              backgroundColor: "#67afc320",
              color: "#3a8fa3",
            }}
            className="hidden sm:flex font-semibold shadow-sm"
          >
            {getTipoComprobanteLabel(selectedTicket.TipoComprobante)}
          </Chip>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {feRechazado && (
            <>
              <Button
                onPress={() => {
                  const fechaActual = selectedTicket.Fecha
                    ? new Date(selectedTicket.Fecha).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0];
                  setNuevaFecha(fechaActual);
                  onFechaOpen();
                }}
                variant="flat"
                className="font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl"
                startContent={<Calendar size={16} />}
              >
                Corregir fecha
              </Button>
              {tiposFiscalesPermitidos.length > 0 && (
                <Button
                  onPress={() => {
                    setNuevoTipo(selectedTicket.TipoComprobante);
                    onTipoOpen();
                  }}
                  variant="flat"
                  className="font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl"
                  startContent={<ArrowRightLeft size={16} />}
                >
                  Cambiar tipo
                </Button>
              )}
              <Button
                onPress={handleReintentarFe}
                className="font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                startContent={<TrendingUp size={16} />}
              >
                Reintentar FE
              </Button>
            </>
          )}
          <Button
            onPress={() => handlePrintTicket()}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 h-11 rounded-xl shadow-md transition-all sm:w-auto w-full"
            startContent={<FileText size={18} strokeWidth={2.5} />}
          >
            Reimprimir Ticket
          </Button>
        </div>
      </div>

      {/* Main Content scrollable area */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {/* Cliente + Totales + Rentabilidad (opcional) */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${showRentabilidad ? 'lg:grid-cols-3' : ''} gap-4`}>
            {/* Cliente */}
            <Card className="shadow-sm border border-slate-100 bg-slate-50/60 rounded-xl">
              <CardBody className="py-4 px-5 gap-2">
                <span
                  className="text-xs uppercase font-bold tracking-wider"
                  style={{ color: "#67afc3" }}
                >
                  Cliente
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {selectedTicket?.cliente?.Nombre
                    ? `${selectedTicket.cliente.Nombre} ${selectedTicket.cliente.Apellido || ""}`.trim()
                    : "Consumidor Final"}
                </span>
                {selectedTicket?.cliente?.Dni && (
                  <span className="text-sm font-medium text-slate-500">
                    DNI / CUIT: <span className="text-slate-700">{selectedTicket.cliente.Dni}</span>
                  </span>
                )}
                {selectedTicket?.cliente?.Direccion && (
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {selectedTicket.cliente.Direccion}
                  </span>
                )}
              </CardBody>
            </Card>

            {/* Totales */}
            <Card className="shadow-sm border border-slate-100 bg-slate-50/60 rounded-xl">
              <CardBody className="py-4 px-5 gap-3">
                <span
                  className="text-xs uppercase font-bold tracking-wider"
                  style={{ color: "#67afc3" }}
                >
                  Resumen Económico
                </span>
                <div className="flex justify-between text-base font-medium text-slate-600">
                  <span>Subtotal</span>
                  <span className="text-slate-800">
                    {formatCurrency(selectedTicket.SubTotal)}
                  </span>
                </div>
                {Number(selectedTicket.Descuento) > 0 && (
                  <div className="flex justify-between text-base font-medium text-slate-500">
                    <span>Descuento</span>
                    <span className="text-danger font-bold">
                      -{formatCurrency(selectedTicket.Descuento)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-1">
                  <span className="text-lg font-bold text-slate-700">
                    Total Facturado
                  </span>
                  <span
                    className="text-2xl font-black tracking-tight"
                    style={{ color: "#67afc3" }}
                  >
                    {formatCurrency(selectedTicket.Total)}
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* Análisis de Rentabilidad (Solo Admins) */}
            {showRentabilidad && (
              <Card className="shadow-sm border border-emerald-100 bg-emerald-50/30 rounded-xl">
                <CardBody className="py-4 px-5 gap-3">
                  <span
                    className="text-xs uppercase font-bold tracking-wider text-emerald-600"
                  >
                    Análisis de Rentabilidad
                  </span>
                  <div className="flex justify-between text-base font-medium text-slate-600">
                    <span>Costo Total</span>
                    <span className="text-slate-800">
                      {formatCurrency(totalCosto)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-medium text-slate-600">
                    <span>Ganancia Neta</span>
                    <span className="text-emerald-600 font-bold">
                      {formatCurrency(gananciaNeta)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-emerald-200/50 mt-1">
                    <span className="text-lg font-bold text-slate-700">
                      Margen
                    </span>
                    <span
                      className="text-2xl font-black tracking-tight text-emerald-600"
                    >
                      {margenGanancia.toFixed(1)}%
                    </span>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* ARCA / Factura Electrónica */}
          {tieneFe && (
            <div
              className={`rounded-2xl border px-6 py-5 flex flex-col gap-4 shadow-sm ${
                feAutorizado
                  ? "bg-emerald-50/50 border-emerald-200"
                  : feRechazado
                    ? "bg-red-50/50 border-red-200"
                    : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className={`w-5 h-5 ${feAutorizado ? 'text-emerald-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
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
                  size="md"
                  variant="flat"
                  className="font-bold shadow-sm"
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-white/60 p-4 rounded-xl border border-emerald-100/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase font-bold text-emerald-800/60">
                      Código CAE
                    </span>
                    <span className="font-mono font-bold text-emerald-900 text-sm">
                      {fe.CAE}
                    </span>
                  </div>
                  {fe.CAEFchVto && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase font-bold text-emerald-800/60">
                        Vencimiento
                      </span>
                      <span className="font-semibold text-emerald-900 text-sm">
                        {new Date(fe.CAEFchVto).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase font-bold text-emerald-800/60">
                      Punto de Venta
                    </span>
                    <span className="font-semibold text-emerald-900 text-sm">
                      {String(fe.PuntoVenta).padStart(4, "0")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase font-bold text-emerald-800/60">
                      Nro. Comprobante
                    </span>
                    <span className="font-semibold text-emerald-900 text-sm">
                      {String(fe.CbteNumero).padStart(8, "0")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <h4
              className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: "#67afc3" }}
            >
              <FileText size={16} />
              Detalle de Ítems
            </h4>
            <div className="border-2 border-slate-100/80 rounded-2xl overflow-hidden shadow-sm">
              <Table
                aria-label="Items del comprobante"
                removeWrapper
                classNames={{
                  th: "text-xs font-bold uppercase tracking-wider bg-slate-50/80 text-slate-500 py-3",
                  td: "text-sm py-3 px-4",
                  tr: "border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-colors",
                }}
              >
                <TableHeader>
                  <TableColumn>CANT</TableColumn>
                  <TableColumn>DESCRIPCIÓN</TableColumn>
                  <TableColumn align="end" className={showRentabilidad ? "" : "hidden"}>COSTO UNIT.</TableColumn>
                  <TableColumn align="end">PRECIO UNIT.</TableColumn>
                  <TableColumn align="end">SUBTOTAL</TableColumn>
                  <TableColumn align="end" className={showRentabilidad ? "" : "hidden"}>GANANCIA</TableColumn>
                </TableHeader>
                <TableBody>
                  {selectedTicket.DetalleComprobante?.map((item: any) => {
                    const globalSubtotal = Number(selectedTicket?.SubTotal || 0);
                    const globalDescuento = Number(selectedTicket?.Descuento || 0);
                    const ratioFacturado = globalSubtotal > 0 ? (globalSubtotal - globalDescuento) / globalSubtotal : 1;

                    const cantidad = Number(item.Cantidad || 1);
                    const costoTotalItem = Number(item.Costo || 0);
                    const costoUnitario = cantidad > 0 ? costoTotalItem / cantidad : 0;
                    
                    const precioUnitario = Number(item.Precio || 0);
                    const subtotalItem = Number(item.SubTotal || 0);
                    const subtotalNetoItem = subtotalItem * ratioFacturado;
                    const gananciaItem = subtotalNetoItem - costoTotalItem;

                    return (
                      <TableRow key={item.Id}>
                        <TableCell>
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100/80 text-slate-700 font-bold text-sm">
                            {cantidad}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800 text-base">
                              {item.Descripcion}
                            </span>
                            {item.Codigo && (
                              <span className="text-xs font-medium text-slate-400">
                                SKU: {item.Codigo}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`text-slate-500 font-medium ${showRentabilidad ? "" : "hidden"}`}>
                          {formatCurrency(costoUnitario)}
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium">
                          {formatCurrency(precioUnitario)}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-slate-900 text-base">
                            {formatCurrency(subtotalItem)}
                          </span>
                        </TableCell>
                        <TableCell className={showRentabilidad ? "" : "hidden"}>
                          <span className="font-bold text-emerald-600 text-base">
                            {formatCurrency(gananciaItem)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagos */}
          <div>
            <h4
              className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: "#67afc3" }}
            >
              <TrendingUp size={16} />
              Formas de pago recibidas
            </h4>
            <div className="flex flex-wrap gap-3">
              {selectedTicket.FormaPago?.map((fp: any) => (
                <div
                  key={fp.Id}
                  className="rounded-xl px-5 py-3 flex items-center gap-3 border shadow-sm"
                  style={{
                    backgroundColor: "#67afc308",
                    borderColor: "#67afc330",
                  }}
                >
                  <span
                    className="text-xs font-black uppercase tracking-wide"
                    style={{ color: "#3a8fa3" }}
                  >
                    {Object.keys(TIPO_PAGO).find(
                      (key) =>
                        TIPO_PAGO[key as keyof typeof TIPO_PAGO] === fp.TipoPago,
                    ) || "OTRO"}
                  </span>
                  <div className="w-px h-6 bg-[#67afc3]/20" />
                  <span className="font-black text-slate-800 text-lg tracking-tight">
                    {formatCurrency(fp.Monto)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Ticket Component for Printing */}
      <div style={{ display: "none" }}>
        <TicketImpresion ref={ticketRef} datosVenta={datosVentaImpresion} />
      </div>

      {/* Modal Corregir Fecha */}
      <Modal isOpen={isFechaOpen} onOpenChange={onFechaOpenChange} placement="center" backdrop="opaque">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Calendar size={18} className="text-amber-500" />
            <span>Corregir Fecha del Comprobante</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-slate-500">
              La fecha actual no es válida para ARCA. Seleccione una fecha dentro del rango permitido (±5 días desde hoy).
            </p>
            <Input
              type="date"
              label="Nueva fecha"
              value={nuevaFecha}
              onValueChange={setNuevaFecha}
              variant="bordered"
              classNames={{
                label: "font-semibold text-slate-600",
                inputWrapper: "border-2 hover:border-amber-400 focus-within:!border-amber-500",
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onFechaOpenChange}
              className="font-semibold text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onPress={handleCorregirFecha}
              isLoading={isGuardandoFecha}
              className="font-semibold bg-amber-500 hover:bg-amber-600 text-white"
            >
              Guardar y reintentar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Cambiar Tipo */}
      <Modal isOpen={isTipoOpen} onOpenChange={onTipoOpenChange} placement="center" backdrop="opaque">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-blue-500" />
            <span>Cambiar Tipo de Comprobante</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-slate-500">
              El tipo de comprobante actual no es válido para ARCA según su configuración fiscal. Seleccione el tipo correcto.
            </p>
            <Select
              label="Nuevo tipo"
              placeholder="Seleccione un tipo"
              selectedKeys={nuevoTipo ? [String(nuevoTipo)] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0];
                if (val) setNuevoTipo(Number(val));
              }}
              variant="bordered"
              classNames={{
                label: "font-semibold text-slate-600",
                trigger: "border-2 hover:border-blue-400 focus-within:!border-blue-500",
              }}
            >
              {tiposFiscalesPermitidos.map((tipo) => (
                <SelectItem key={String(tipo)} textValue={getTipoComprobanteLabel(tipo)}>
                  {getTipoComprobanteLabel(tipo)}
                </SelectItem>
              ))}
            </Select>
            {nuevoTipo === selectedTicket?.TipoComprobante && (
              <p className="text-xs text-amber-600 font-medium mt-1">
                El tipo seleccionado es el mismo que el actual.
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onTipoOpenChange}
              className="font-semibold text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onPress={handleCambiarTipo}
              isLoading={isGuardandoTipo}
              isDisabled={nuevoTipo === selectedTicket?.TipoComprobante}
              className="font-semibold bg-blue-500 hover:bg-blue-600 text-white"
            >
              Cambiar y reintentar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
