"use client";
import { motion } from "framer-motion";
import { ShoppingCart, TrendingUp, Users, AlertTriangle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useDashboardSummary,
  useTopProducts,
  usePaymentMethods,
  useLowStock,
} from "@/hooks/useDashboard";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";

export default function DashboardPage() {
  const { isOpen, onOpenChange } = useDisclosure();
  const { data: summaryData, isLoading } = useDashboardSummary();
  const { data: topProductsData, isLoading: isLoadingTopProducts } =
    useTopProducts();
  const { data: paymentMethodsData, isLoading: isLoadingPaymentMethods } =
    usePaymentMethods();
  const { data: lowStockData, isLoading: isLoadingLowStock } = useLowStock();

  return (
    <div className="flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Dashboard"
        accentTitle="General"
        description="Aquí puedes observar un panorama rápido del rendimiento actual."
      />

      {/* Main App Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 rounded-3xl relative flex flex-col"
      >
        {/* Content */}
        <div className="relative z-10 w-full flex flex-col gap-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Ventas Hoy"
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
              delay={0.1}
            />

            <StatCard
              title="Stock Bajo"
              value={isLoading ? "..." : summaryData?.lowStock?.count || 0}
              subtitle="Productos Críticos"
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
              delay={0.2}
            />

            <StatCard
              title="Ingresos Mes"
              value={`$${(summaryData?.monthRevenue?.amount || 0).toLocaleString("es-AR")}`}
              bottomText={
                isLoading
                  ? "Cargando..."
                  : `${summaryData?.monthRevenue?.percentage! > 0 ? "+" : ""}${summaryData?.monthRevenue?.percentage || 0}% vs. mes anterior`
              }
              icon={TrendingUp}
              colorScheme="green"
              chartType="bar"
              delay={0.3}
            />

            <StatCard
              title="Clientes Activos"
              value={isLoading ? "..." : summaryData?.activeClients?.count || 0}
              subtitle="Este Mes"
              bottomText={
                isLoading
                  ? "Cargando..."
                  : `${summaryData?.activeClients?.percentage! > 0 ? "+" : ""}${summaryData?.activeClients?.percentage || 0}% vs. mes anterior`
              }
              icon={Users}
              colorScheme="blue"
              chartType="line"
              delay={0.4}
            />
          </div>

          {/* Listados Medios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PRODUCTOS MÁS VENDIDOS */}
            <div className="bg-white border text-sm border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 uppercase tracking-wide text-[13px]">
                  Productos Más Vendidos (Top 10 del día)
                </h3>
                <span className="text-slate-500 text-xs font-medium">
                  Total unidades:{" "}
                  {isLoadingTopProducts
                    ? "..."
                    : topProductsData?.totalUnidades || 0}
                </span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">
                      Producto
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs text-center w-28">
                      Unidades Vendidas
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs w-28">
                      Volumen
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs text-right w-24">
                      % total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!isLoadingTopProducts &&
                    topProductsData?.topProducts?.map((p, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-8 h-8 object-cover rounded-lg shrink-0 bg-slate-100 border border-slate-200"
                              onError={(e) => {
                                // Opcional: Fallback si la imagen no existe
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5NDkzYjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1wYWNrYWdlIj48bGluZSB4MT0iMTYuNSIgeTE9IjkuNCIgeDI9IjcuNSIgeTI9IjQuMjEiLz48cGF0aCBkPSJNMjEgMTdWNy4zYTIgMiAwIDAwLTEtMS43M2wtNy00YTIgMiAwIDAwLTIgMGwtNyA0QTIgMiAwIDAwMyA3LjNWMTdBMiAyIDAgMDA0IDE4LjcybDcgNGEyIDIgMCAwMDIgMGw3LTRBMiAyIDAgMDAyMSAxN1oiLz48cG9seWxpbmUgcG9pbnRzPSIzLjI3IDYuOTYgMTIgMTIgMjAuNzMgNi45NiIvPjxsaW5lIHgxPSIxMiIgeTE9IjIyLjA4IiB4Mj0iMTIiIHkyPSIxMiIvPjwvc3ZnPg==";
                              }}
                            />
                            <span
                              className="font-medium text-slate-700 max-w-[140px] truncate"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-semibold text-slate-700">
                          {p.uds}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-500 rounded-full"
                              style={{ width: `${p.pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-600">
                          {p.pct}%
                        </td>
                      </tr>
                    ))}

                  {isLoadingTopProducts && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-slate-400 text-sm"
                      >
                        Cargando productos...
                      </td>
                    </tr>
                  )}

                  {!isLoadingTopProducts &&
                    topProductsData?.topProducts?.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-slate-400 text-sm"
                        >
                          No hay ventas registradas hoy
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
              <div className="p-4 border-t border-slate-100/50 bg-slate-50/20 mt-auto">
                <span className="text-slate-600 font-semibold text-sm">
                  Total unidades:{" "}
                  {isLoadingTopProducts
                    ? "..."
                    : topProductsData?.totalUnidades || 0}
                </span>
              </div>
            </div>

            {/* MÉTODOS DE PAGO POPULARES */}
            <div className="bg-white border text-sm border-slate-200 rounded-xl flex flex-col shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 uppercase tracking-wide text-[13px]">
                  Métodos de Pago Populares (Top 10)
                </h3>
                {/* <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50">
                  Ver detalles
                </button> */}
              </div>
              <div className="p-4 bg-white grow flex flex-col gap-0.5 min-h-[300px]">
                <span className="text-slate-500 text-xs font-medium mb-3 block">
                  Total transacciones:{" "}
                  {isLoadingPaymentMethods
                    ? "..."
                    : paymentMethodsData?.totalTransacciones || 0}
                </span>

                {isLoadingPaymentMethods && (
                  <div className="py-8 text-center text-slate-400 text-sm flex-1 flex items-center justify-center">
                    Cargando métodos de pago...
                  </div>
                )}

                {!isLoadingPaymentMethods &&
                  paymentMethodsData?.paymentMethods?.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-sm flex-1 flex items-center justify-center">
                      No hay transacciones registradas hoy
                    </div>
                  )}

                {!isLoadingPaymentMethods &&
                  paymentMethodsData?.paymentMethods?.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 py-1 text-xs"
                    >
                      <span className="w-32 font-semibold text-slate-700 truncate min-w-0">
                        {p.name}
                      </span>
                      <div className="flex-1 flex items-center">
                        <div
                          className="h-3.5 bg-[#478299] rounded-r-md"
                          style={{ width: `${Math.max(p.pct, 1)}%` }}
                        />
                        <span className="text-slate-600 font-bold ml-2 w-10 shrink-0">
                          {p.pct}%
                        </span>
                      </div>
                      <span className="font-semibold text-slate-600 w-20 text-right shrink-0">
                        ${p.money.toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="p-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <span className="text-slate-600 font-semibold text-sm">
                  Total transacciones:{" "}
                  {isLoadingPaymentMethods
                    ? "..."
                    : paymentMethodsData?.totalTransacciones || 0}
                </span>
                <Link
                  href="/caja"
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50"
                >
                  Ver detalles
                </Link>
              </div>
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
