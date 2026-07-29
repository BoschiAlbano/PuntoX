"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { DateRangePicker, Button } from "@heroui/react";
import { parseDate, type CalendarDate } from "@internationalized/date";
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Receipt,
  Percent,
  ShoppingCart,
  Store,
  Printer,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useKPIs,
  useGraficas,
  useComplementarios,
} from "@/hooks/useAnaliticas";
import KPICard from "@/components/analiticas/KPICard";
import GraficaIngresos from "@/components/analiticas/GraficaIngresos";
import GraficaPagos from "@/components/analiticas/GraficaPagos";
import GraficaProductos from "@/components/analiticas/GraficaProductos";

// ─── Shared class tokens ────────────────────────────────────────────────────
const dateRangeCls = {
  inputWrapper:
    "border-slate-200 bg-slate-50/50 hover:border-[#67afc3]/60 focus-within:!border-[#67afc3] rounded-xl",
  segment:
    "data-[focus=true]:bg-[#67afc3]/20 data-[focus=true]:text-[#67afc3] data-[placeholder=true]:text-slate-400",
  selectorIcon: "text-[#67afc3]",
};

// ─── Skeleton KPI ──────────────────────────────────────────────────────────
function KPISkeleton({ size = "default" }: { size?: "hero" | "default" }) {
  return (
    <div
      className={`bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm animate-pulse ${
        size === "hero" ? "p-4 sm:p-6" : "p-3.5 sm:p-4"
      }`}
    >
      <div className="h-3 bg-slate-200 rounded w-3/4 mb-3" />
      <div className={`bg-slate-200 rounded w-1/2 ${size === "hero" ? "h-8" : "h-6"}`} />
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────
function AnaliticasContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const fechasPorDefecto = useMemo(() => {
    const hoy = new Date();
    const desde = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      desde: desde.toISOString().split("T")[0],
      hasta: hoy.toISOString().split("T")[0],
    };
  }, []);

  const [fechaDesde, setFechaDesde] = useState(fechasPorDefecto.desde);
  const [fechaHasta, setFechaHasta] = useState(fechasPorDefecto.hasta);

  const [filtrosActivos, setFiltrosActivos] = useState({
    fechaDesde: fechasPorDefecto.desde,
    fechaHasta: fechasPorDefecto.hasta,
  });

  const dateRangeValue = useMemo(
    () => ({ start: parseDate(fechaDesde), end: parseDate(fechaHasta) }),
    [fechaDesde, fechaHasta],
  );

  const handleDateRangeChange = (
    range: { start: CalendarDate; end: CalendarDate } | null,
  ) => {
    if (!range) return;
    setFechaDesde(range.start.toString());
    setFechaHasta(range.end.toString());
  };

  const handleAplicarFiltros = () => {
    setFiltrosActivos({
      fechaDesde,
      fechaHasta,
    });
  };

  const { data: kpisData, isLoading: kpisLoading } = useKPIs({
    fechaDesde: filtrosActivos.fechaDesde,
    fechaHasta: filtrosActivos.fechaHasta,
  });
  const { data: graficasIngresos, isLoading: ingresosLoading } = useGraficas({
    tipo: "ingresos",
    fechaDesde: filtrosActivos.fechaDesde,
    fechaHasta: filtrosActivos.fechaHasta,
  });
  const { data: graficasPagos, isLoading: pagosLoading } = useGraficas({
    tipo: "pagos",
    fechaDesde: filtrosActivos.fechaDesde,
    fechaHasta: filtrosActivos.fechaHasta,
  });
  const { data: graficasProductos, isLoading: productosLoading } = useGraficas({
    tipo: "productos",
    fechaDesde: filtrosActivos.fechaDesde,
    fechaHasta: filtrosActivos.fechaHasta,
  });
  const { data: complementariosData } = useComplementarios({
    fechaDesde: filtrosActivos.fechaDesde,
    fechaHasta: filtrosActivos.fechaHasta,
  });

  const isRefreshing =
    kpisLoading || ingresosLoading || pagosLoading || productosLoading;

  return (
    <div className="flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6 print:p-0 print:m-0 print:block">
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Resumen de Analíticas
        </h1>
        <p className="text-slate-500">
          Período: {filtrosActivos.fechaDesde} al {filtrosActivos.fechaHasta}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 relative flex flex-col print:overflow-visible print:block print:h-auto"
      >
        <div className="space-y-5 pt-2">
          {/* Filtros */}
          <div className="print:hidden bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl sm:rounded-[20px] shadow-sm px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 text-[#67afc3]">
                  <SlidersHorizontal size={16} strokeWidth={2.5} className="shrink-0" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 tracking-tight whitespace-nowrap">
                  Filtro de fechas
                </h3>
              </div>

              <DateRangePicker
                aria-label="Rango de fechas"
                size="sm"
                variant="bordered"
                classNames={dateRangeCls}
                value={dateRangeValue}
                onChange={handleDateRangeChange}
                className="w-full lg:w-auto lg:min-w-[300px]"
              />

              <div className="flex gap-2 w-full lg:w-auto lg:ml-auto">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => window.print()}
                  className="text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl gap-1.5 flex-1 lg:flex-initial"
                  startContent={<Printer size={13} className="shrink-0" />}
                >
                  <span className="hidden sm:inline">Imprimir</span>
                </Button>
                <Button
                  size="sm"
                  variant="solid"
                  isLoading={isRefreshing}
                  onPress={handleAplicarFiltros}
                  className="bg-[#67afc3] text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm shadow-[#67afc3]/30 flex-1 lg:flex-initial"
                  startContent={
                    !isRefreshing && (
                      <CheckCircle2 size={13} className="shrink-0" />
                    )
                  }
                >
                  <span className="hidden sm:inline">Aplicar</span>
                  <span className="sm:hidden">OK</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ─── KPIs principales ─── */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpisLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <KPISkeleton key={i} size="hero" />
                ))
              : kpisData && (
                  <>
                    <KPICard
                      size="hero"
                      tone="emerald"
                      title="Ingresos Netos"
                      value={kpisData.kpis.ingresosNetos.valor}
                      variation={kpisData.kpis.ingresosNetos.variacion}
                      format="currency"
                      icon={<DollarSign size={20} />}
                    />
                    <KPICard
                      size="hero"
                      tone="emerald"
                      title="Margen de Ganancia (Ventas)"
                      value={kpisData.kpis.margenGanancia.valor}
                      variation={kpisData.kpis.margenGanancia.variacion}
                      format="currency"
                      icon={<TrendingUp size={20} />}
                    />
                    {complementariosData?.gastos && (
                      <KPICard
                        size="hero"
                        tone="amber"
                        title="Total Gastos"
                        value={complementariosData.gastos.total}
                        format="currency"
                        icon={<Receipt size={20} />}
                      />
                    )}
                    <KPICard
                      size="hero"
                      tone="teal"
                      title="Tickets Emitidos"
                      value={kpisData.kpis.tickets.valor}
                      variation={kpisData.kpis.tickets.variacion}
                      format="number"
                      icon={<Receipt size={20} />}
                    />
                  </>
                )}
          </div>

          {/* ─── KPIs secundarios ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {kpisLoading
              ? Array.from({ length: 6 }).map((_, i) => <KPISkeleton key={i} />)
              : kpisData && (
                  <>
                    {complementariosData?.gastos && (
                      <KPICard
                        tone="emerald"
                        title="Ganancia de Cajas"
                        value={complementariosData.gastos.totalGanancia}
                        format="currency"
                        icon={<TrendingUp size={20} />}
                      />
                    )}
                    <KPICard
                      tone="teal"
                      title="Productos Vendidos"
                      value={kpisData.kpis.productosVendidos.valor}
                      variation={kpisData.kpis.productosVendidos.variacion}
                      format="number"
                      icon={<ShoppingCart size={20} />}
                    />
                    <KPICard
                      tone="teal"
                      title="Clientes Activos"
                      value={kpisData.kpis.clientesActivos.valor}
                      variation={kpisData.kpis.clientesActivos.variacion}
                      format="number"
                      icon={<Users size={20} />}
                    />
                    <KPICard
                      tone="slate"
                      title="IVA Facturado"
                      value={kpisData.kpis.ivaFacturado.valor}
                      variation={kpisData.kpis.ivaFacturado.variacion}
                      format="currency"
                      icon={<Receipt size={20} />}
                    />
                    <KPICard
                      tone="amber"
                      title="Descuentos Aplicados"
                      value={kpisData.kpis.descuentos.valor}
                      variation={kpisData.kpis.descuentos.variacion}
                      format="currency"
                      icon={<Percent size={20} />}
                    />
                    <KPICard
                      tone="rose"
                      invertVariation
                      title="Notas de Crédito"
                      value={kpisData.kpis.notasCredito.valor}
                      variation={
                        kpisData.kpis.notasCredito.periodoAnterior > 0
                          ? ((kpisData.kpis.notasCredito.valor -
                              kpisData.kpis.notasCredito.periodoAnterior) /
                              kpisData.kpis.notasCredito.periodoAnterior) *
                            100
                          : 0
                      }
                      format="number"
                      icon={<Package size={20} />}
                    />
                  </>
                )}
          </div>

          {/* ─── Charts Section ─── */}
          <div className="pt-4 border-t border-slate-100 mt-4 space-y-4 sm:space-y-5 print:hidden">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight px-1">
              Visualización de Datos
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {ingresosLoading ? (
                <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm h-[340px] animate-pulse" />
              ) : graficasIngresos ? (
                <GraficaIngresos datos={graficasIngresos.datos} />
              ) : null}

              {pagosLoading ? (
                <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm h-[340px] animate-pulse" />
              ) : graficasPagos ? (
                <GraficaPagos datos={graficasPagos.datos} />
              ) : null}
            </div>

            {productosLoading ? (
              <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm h-[400px] animate-pulse" />
            ) : graficasProductos ? (
              <GraficaProductos datos={graficasProductos.datos} />
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Analiticas() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-[#67afc3]/30 border-t-[#67afc3] animate-spin" />
        </div>
      }
    >
      <AnaliticasContent />
    </Suspense>
  );
}
