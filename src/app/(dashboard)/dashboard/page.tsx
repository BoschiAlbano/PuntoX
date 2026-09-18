"use client";
import { motion } from "framer-motion";
import { ShoppingCart, TrendingUp, AlertTriangle, Wallet } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useDashboardSummary,
  useTopProducts,
  usePaymentMethods,
  useLowStock,
} from "@/hooks/useDashboard";
import { useCaja } from "@/hooks/useCaja";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";

export default function DashboardPage() {
  const { isOpen, onOpenChange } = useDisclosure();
  const { data: summaryData, isLoading } = useDashboardSummary();
  const { data: lowStockData, isLoading: isLoadingLowStock } = useLowStock();
  const { data: topProductsData, isLoading: isLoadingTopProducts } =
    useTopProducts();
  const { data: paymentMethodsData, isLoading: isLoadingPaymentMethods } =
    usePaymentMethods();
  const {
    cajaActual,
    isLoading: isLoadingCaja,
    isCajaAbierta,
  } = useCaja({
    enableCaja: true,
  });

  const totalCobranzaCajaActual = cajaActual
    ? Number(cajaActual.TotalEntradaEfectivo || 0) +
      Number(cajaActual.TotalEntradaTarjeta || 0) +
      Number(cajaActual.TotalEntradaTransf || 0) +
      Number(cajaActual.TotalEntradaCheque || 0) +
      Number(cajaActual.TotalEntradaCtaCte || 0)
    : 0;

  const cajaActualEnEfectivo = cajaActual
    ? Number(cajaActual.MontoInicial || 0) +
      Number(cajaActual.TotalEntradaEfectivo || 0) -
      Number(cajaActual.TotalSalidaEfectivo || 0)
    : 0;

  const totalCobranzaHoy =
    paymentMethodsData?.paymentMethods?.reduce(
      (sum, method) => sum + Number(method.money || 0),
      0,
    ) ?? 0;

  const totalGastosCajaActual = cajaActual
    ? Number(cajaActual.TotalSalidaEfectivo || 0) +
      Number(cajaActual.TotalSalidaTarjeta || 0) +
      Number(cajaActual.TotalSalidaTransf || 0) +
      Number(cajaActual.TotalSalidaCheque || 0) +
      Number(cajaActual.TotalSalidaCtaCte || 0)
    : 0;

  const infoBadge = (label: string) => (
    <Tooltip content={label} placement="top" showArrow color="default">
      <span className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700">
        i
      </span>
    </Tooltip>
  );

  return (
    <div className="flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Dashboard"
        accentTitle="General"
        description="Operación actual del negocio y estado de caja del día."
      />

      {/* Main App Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 rounded-3xl relative flex flex-col"
      >
        {/* Content */}
        <div className="relative z-10 w-full flex flex-col gap-5">
          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
                Caja actual
              </h2>
              {infoBadge(
                "Monto real disponible en la caja abierta en este momento.",
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Efectivo disponible"
                value={
                  isLoadingCaja
                    ? "..."
                    : `$${cajaActualEnEfectivo.toLocaleString("es-AR")}`
                }
                subtitle={
                  isLoadingCaja
                    ? "Cargando..."
                    : isCajaAbierta
                      ? "Caja abierta"
                      : "Sin caja abierta"
                }
                bottomText={
                  isLoadingCaja
                    ? "Cargando..."
                    : `Entradas: $${Number(cajaActual?.TotalEntradaEfectivo || 0).toLocaleString("es-AR")}`
                }
                icon={Wallet}
                colorScheme="green"
                chartType="bar"
                delay={0.1}
              />

              <StatCard
                title="Entradas"
                value={`$${Number(cajaActual?.TotalEntradaEfectivo || 0).toLocaleString("es-AR")}`}
                subtitle={
                  isLoadingCaja
                    ? "Cargando..."
                    : `${cajaActual?.Movimiento?.length || 0} movimientos`
                }
                bottomText={
                  isLoadingCaja ? "Cargando..." : "Cobros del turno actual"
                }
                icon={TrendingUp}
                colorScheme="blue"
                chartType="line"
                delay={0.15}
              />

              <StatCard
                title="Salidas"
                value={`$${Number(cajaActual?.TotalSalidaEfectivo || 0).toLocaleString("es-AR")}`}
                subtitle={
                  isLoadingCaja
                    ? "Cargando..."
                    : `${Number(cajaActual?.Gasto?.length || 0).toString()} gastos`
                }
                bottomText={isLoadingCaja ? "Cargando..." : "Egresos del turno"}
                icon={AlertTriangle}
                colorScheme="orange"
                chartType="none"
                delay={0.2}
              />

              <StatCard
                title="Cobranza actual"
                value={`$${totalCobranzaCajaActual.toLocaleString("es-AR")}`}
                subtitle={
                  isLoadingCaja
                    ? "Cargando..."
                    : `${paymentMethodsData?.totalTransacciones || 0} pagos`
                }
                bottomText={
                  isLoadingCaja ? "Cargando..." : "Total en caja actual"
                }
                icon={ShoppingCart}
                colorScheme="red"
                chartType="line"
                delay={0.25}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
                Caja del día
              </h2>
              {infoBadge(
                "Totales acumulados del día, aunque haya más de un turno o caja abierta.",
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Ventas del día"
                value={`$${(summaryData?.todaySales?.amount || 0).toLocaleString("es-AR")}`}
                subtitle={`${summaryData?.todaySales?.transactions || 0} Transacciones`}
                bottomText={
                  isLoading
                    ? "Cargando..."
                    : `${summaryData?.todaySales?.percentage! > 0 ? "+" : ""}${summaryData?.todaySales?.percentage || 0}% vs. ayer`
                }
                icon={ShoppingCart}
                colorScheme="red"
                chartType="line"
                delay={0.3}
              />

              <StatCard
                title="Cobranza del día"
                value={`$${totalCobranzaHoy.toLocaleString("es-AR")}`}
                subtitle={
                  isLoadingPaymentMethods
                    ? "Cargando..."
                    : `${paymentMethodsData?.totalTransacciones || 0} pagos`
                }
                bottomText={
                  isLoadingPaymentMethods ? "Cargando..." : "Resumen por medios"
                }
                icon={TrendingUp}
                colorScheme="blue"
                chartType="bar"
                delay={0.35}
              />

              <StatCard
                title="Gastos del día"
                value={`$${totalGastosCajaActual.toLocaleString("es-AR")}`}
                subtitle={
                  isLoadingCaja
                    ? "Cargando..."
                    : `${Number(cajaActual?.Gasto?.length || 0)} movimientos`
                }
                bottomText={
                  isLoadingCaja ? "Cargando..." : "Egresos operativos"
                }
                icon={AlertTriangle}
                colorScheme="orange"
                chartType="none"
                delay={0.4}
              />

              <StatCard
                title="Neto del día"
                value={`$${((summaryData?.todaySales?.amount || 0) - totalGastosCajaActual).toLocaleString("es-AR")}`}
                subtitle={isLoading ? "Cargando..." : "Ventas menos egresos"}
                bottomText={isLoading ? "Cargando..." : "Resultado operativo"}
                icon={Wallet}
                colorScheme="green"
                chartType="bar"
                delay={0.45}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
                Inventario
              </h2>
              {infoBadge(
                "Productos críticos y más vendidos del día, útiles para la operación actual.",
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Stock bajo"
                value={isLoading ? "..." : summaryData?.lowStock?.count || 0}
                subtitle="Productos críticos"
                bottomText={
                  <Link
                    href="/productos?bajoStock=true"
                    className="underline cursor-pointer hover:text-orange-600 transition-colors"
                  >
                    Ver todos
                  </Link>
                }
                icon={AlertTriangle}
                colorScheme="orange"
                chartType="none"
                delay={0.5}
              />

              <StatCard
                title="Top vendido"
                value={
                  isLoadingTopProducts
                    ? "..."
                    : topProductsData?.topProducts?.[0]?.name || "Sin ventas"
                }
                subtitle={
                  isLoadingTopProducts
                    ? "Cargando..."
                    : topProductsData?.topProducts?.[0]
                      ? `${topProductsData.topProducts[0].uds} unidades`
                      : "Sin ventas aún"
                }
                bottomText={
                  isLoadingTopProducts
                    ? "Cargando..."
                    : topProductsData?.topProducts?.[0]
                      ? `${topProductsData.topProducts[0].pct}% del día`
                      : "Sin ventas hoy"
                }
                icon={TrendingUp}
                colorScheme="blue"
                chartType="line"
                delay={0.55}
              />

              <StatCard
                title="Productos vendidos"
                value={
                  isLoadingTopProducts
                    ? "..."
                    : topProductsData?.totalUnidades || 0
                }
                subtitle="Unidades hoy"
                bottomText={
                  isLoadingTopProducts ? "Cargando..." : "Top 10 del día"
                }
                icon={ShoppingCart}
                colorScheme="red"
                chartType="bar"
                delay={0.6}
              />

              <StatCard
                title="Alertas"
                value={
                  isLoadingLowStock ? "..." : lowStockData?.totalCount || 0
                }
                subtitle="Criticas de stock"
                bottomText={
                  isLoadingLowStock ? "Cargando..." : "Revisión rápida"
                }
                icon={AlertTriangle}
                colorScheme="orange"
                chartType="none"
                delay={0.65}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
                Comprobantes
              </h2>
              {infoBadge(
                "Datos operativos de facturación y estado de emisión en el sistema actual.",
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Emitidas"
                value={summaryData?.todaySales?.transactions || 0}
                subtitle="Facturas / ventas"
                bottomText={isLoading ? "Cargando..." : "En el día"}
                icon={ShoppingCart}
                colorScheme="green"
                chartType="bar"
                delay={0.7}
              />

              <StatCard
                title="Pendientes"
                value={0}
                subtitle="Sin emisión"
                bottomText="ARCA / emisión"
                icon={AlertTriangle}
                colorScheme="orange"
                chartType="none"
                delay={0.75}
              />

              <StatCard
                title="Rechazadas"
                value={0}
                subtitle="Con observación"
                bottomText="Ver detalle en AFIP"
                icon={AlertTriangle}
                colorScheme="red"
                chartType="none"
                delay={0.8}
              />

              <StatCard
                title="Estado"
                value={"OK"}
                subtitle="Sistema actual"
                bottomText="Conexión operativa"
                icon={TrendingUp}
                colorScheme="blue"
                chartType="line"
                delay={0.85}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        scrollBehavior="inside"
        size="2xl"
        classNames={{
          base: "bg-white",
          header: "border-b border-slate-100",
          body: "p-0",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="font-bold text-slate-800 uppercase tracking-wide text-[13px] flex items-center gap-2">
                    Alertas de Inventario Crítico
                  </span>
                  <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-bold border border-red-100 ml-auto mr-4">
                    Total:{" "}
                    {isLoadingLowStock ? "..." : lowStockData?.totalCount || 0}
                  </span>
                </div>
              </ModalHeader>
              <ModalBody className="p-6 bg-slate-50/30">
                <div className="bg-white border text-sm border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm min-h-[300px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/80 border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="py-3 px-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-center">
                            Sucursal
                          </th>
                          <th className="py-3 px-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-center">
                            Mínimo
                          </th>
                          <th className="py-3 px-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-right">
                            Stock Actual
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {isLoadingLowStock && (
                          <tr>
                            <td colSpan={4} className="py-12 text-center">
                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400"></span>
                                <span className="text-sm font-medium">
                                  Cargando alertas...
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        {!isLoadingLowStock &&
                          lowStockData?.lowStockItems?.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center">
                                <div className="flex justify-center items-center gap-2 text-slate-400">
                                  <span className="text-sm font-medium">
                                    No hay alertas críticas de stock
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}

                        {!isLoadingLowStock &&
                          lowStockData?.lowStockItems?.map((item, idx) => (
                            <tr
                              key={`${item.id}-${item.branch}-${idx}`}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-2 rounded-lg shrink-0 ${item.stock <= 0 ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"}`}
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span
                                      className="font-semibold text-slate-700 text-[13px] truncate max-w-[280px]"
                                      title={item.name}
                                    >
                                      {item.name}
                                    </span>
                                    {item.barcode && (
                                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                        {item.barcode}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-[13px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                                  {item.branch}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-[13px] font-semibold text-slate-500">
                                  {item.minStock}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-[13px] font-bold leading-none ${
                                    item.stock <= 0
                                      ? "bg-red-50 text-red-600 border border-red-100"
                                      : "bg-orange-50 text-orange-600 border border-orange-100"
                                  }`}
                                >
                                  {item.stock}{" "}
                                  {item.stock <= 0 ? "(Agotado)" : ""}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ModalBody>
              <div className="p-4 border-t border-slate-100 bg-white rounded-b-[24px] flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
