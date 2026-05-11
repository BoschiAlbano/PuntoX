"use client";

import { useState, useMemo, Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Input, Select, SelectItem, Button } from "@heroui/react";
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
  CalendarDays,
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
import { PageHeader } from "@/components/dashboard/PageHeader";

// ─── Shared class tokens ────────────────────────────────────────────────────
const selectCls = {
  trigger:
    "border-slate-200 bg-slate-50/50 hover:border-[#67afc3]/60 data-[focus=true]:border-[#67afc3] rounded-xl",
};
const inputCls = {
  inputWrapper:
    "border-slate-200 bg-slate-50/50 hover:border-[#67afc3]/60 focus-within:!border-[#67afc3] rounded-xl",
};

// ─── Skeleton KPI ──────────────────────────────────────────────────────────
function KPISkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="h-7 bg-slate-200 rounded w-1/2" />
    </div>
  );
}

// ─── Panel glassmorphism ──────────────────────────────────────────────────
function Panel({
  title,
  icon: Icon,
  children,
  action,
  className = "",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm ${className}`}
    >
      <div className="px-6 py-4 border-b border-slate-100/60 bg-slate-50/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 text-[#67afc3]">
            <Icon size={16} strokeWidth={2.5} />
          </div>
          <h3 className="text-sm font-bold text-slate-700 tracking-tight">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────
function AnaliticasContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [periodo, setPeriodo] = useState<"semanal" | "mensual">("mensual");
  const [agrupacion, setAgrupacion] = useState<"dia" | "semana" | "mes">("dia");

  const fechasPorDefecto = useMemo(() => {
    const hoy = new Date();
    const diasAtras = periodo === "semanal" ? 7 : 30;
    const desde = new Date(hoy.getTime() - diasAtras * 24 * 60 * 60 * 1000);
    return {
      desde: desde.toISOString().split("T")[0],
      hasta: hoy.toISOString().split("T")[0],
    };
  }, [periodo]);

  const [fechaDesde, setFechaDesde] = useState(fechasPorDefecto.desde);
  const [fechaHasta, setFechaHasta] = useState(fechasPorDefecto.hasta);

  const [filtrosActivos, setFiltrosActivos] = useState({
    fechaDesde: fechasPorDefecto.desde,
    fechaHasta: fechasPorDefecto.hasta,
    periodo: "mensual" as "semanal" | "mensual",
    agrupacion: "dia" as "dia" | "semana" | "mes",
  });

  const fechasModificadasPorUsuario = useRef(false);

  useEffect(() => {
    if (!fechasModificadasPorUsuario.current) {
      setFechaDesde(fechasPorDefecto.desde);
      setFechaHasta(fechasPorDefecto.hasta);
    }
  }, [fechasPorDefecto]);

  const handleAplicarFiltros = () => {
    setFiltrosActivos({
      fechaDesde,
      fechaHasta,
      periodo,
      agrupacion,
    });
  };

  const { data: kpisData, isLoading: kpisLoading } = useKPIs({
    fechaDesde: filtrosActivos.fechaDesde,
    fechaHasta: filtrosActivos.fechaHasta,
    periodo: filtrosActivos.periodo,
  });
  const { data: graficasIngresos, isLoading: ingresosLoading } = useGraficas({
    tipo: "ingresos",
    fechaDesde: filtrosActivos.fechaDesde,
    fechaHasta: filtrosActivos.fechaHasta,
    agrupacion: filtrosActivos.agrupacion,
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
    <div className="   flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6 print:p-0 print:m-0 print:block">
      <div className="print:hidden">
        <PageHeader
          title="Gestión de"
          accentTitle="Analíticas"
          description="Aquí puedes observar un panorama rápido del rendimiento actual."
        />
      </div>

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
          <Panel
            title="Filtros de período"
            icon={SlidersHorizontal}
            className="print:hidden"
            action={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => window.print()}
                  className="text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl gap-1.5"
                  startContent={<Printer size={13} />}
                >
                  Imprimir
                </Button>
                <Button
                  size="sm"
                  variant="solid"
                  isLoading={isRefreshing}
                  onPress={handleAplicarFiltros}
                  className="bg-[#67afc3] text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm shadow-[#67afc3]/30"
                  startContent={!isRefreshing && <CheckCircle2 size={13} />}
                >
                  Aplicar
                </Button>
              </div>
            }
          >
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <Select
                size="sm"
                label="Período"
                labelPlacement="outside"
                variant="bordered"
                classNames={selectCls}
                selectedKeys={[periodo]}
                onChange={(e) => {
                  setPeriodo(e.target.value as "semanal" | "mensual");
                  fechasModificadasPorUsuario.current = false;
                }}
                className="w-full sm:w-1/4"
              >
                <SelectItem key="semanal">Últimos 7 días</SelectItem>
                <SelectItem key="mensual">Últimos 30 días</SelectItem>
              </Select>
              <Input
                size="sm"
                type="date"
                label="Desde"
                labelPlacement="outside"
                variant="bordered"
                classNames={inputCls}
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  fechasModificadasPorUsuario.current = true;
                }}
                startContent={
                  <CalendarDays
                    size={14}
                    className="text-slate-400 shrink-0 mr-1"
                  />
                }
                className="w-full sm:w-1/4"
              />
              <Input
                size="sm"
                type="date"
                label="Hasta"
                labelPlacement="outside"
                variant="bordered"
                classNames={inputCls}
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  fechasModificadasPorUsuario.current = true;
                }}
                startContent={
                  <CalendarDays
                    size={14}
                    className="text-slate-400 shrink-0 mr-1"
                  />
                }
                className="w-full sm:w-1/4"
              />
              <Select
                size="sm"
                label="Agrupación"
                labelPlacement="outside"
                variant="bordered"
                classNames={selectCls}
                selectedKeys={[agrupacion]}
                onChange={(e) =>
                  setAgrupacion(e.target.value as "dia" | "semana" | "mes")
                }
                className="w-full sm:w-1/4"
              >
                <SelectItem key="dia">Por día</SelectItem>
                <SelectItem key="semana">Por semana</SelectItem>
                <SelectItem key="mes">Por mes</SelectItem>
              </Select>
            </div>
          </Panel>

          {/* ─── Top Level KPIs ─── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {kpisLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <KPISkeleton key={i} />
                ))
              : kpisData && (
                  <>
                    <KPICard
                      title="Ingresos Netos"
                      value={kpisData.kpis.ingresosNetos.valor}
                      variation={kpisData.kpis.ingresosNetos.variacion}
                      format="currency"
                      icon={<DollarSign size={20} />}
                    />
                    {complementariosData?.gastos && (
                      <KPICard
                        title="Total Gastos"
                        value={complementariosData.gastos.total}
                        format="currency"
                        icon={<Receipt size={20} />}
                      />
                    )}
                    {complementariosData?.gastos && (
                      <KPICard
                        title="Ganancia de Cajas"
                        value={complementariosData.gastos.totalGanancia}
                        format="currency"
                        icon={<TrendingUp size={20} />}
                      />
                    )}
                    <KPICard
                      title="Margen de Ganancia (Ventas)"
                      value={kpisData.kpis.margenGanancia.valor}
                      variation={kpisData.kpis.margenGanancia.variacion}
                      format="currency"
                      icon={<TrendingUp size={20} />}
                    />

                    <KPICard
                      title="Tickets Emitidos"
                      value={kpisData.kpis.tickets.valor}
                      variation={kpisData.kpis.tickets.variacion}
                      format="number"
                      icon={<Receipt size={20} />}
                    />
                    <KPICard
                      title="Productos Vendidos"
                      value={kpisData.kpis.productosVendidos.valor}
                      variation={kpisData.kpis.productosVendidos.variacion}
                      format="number"
                      icon={<ShoppingCart size={20} />}
                    />
                    <KPICard
                      title="Clientes Activos"
                      value={kpisData.kpis.clientesActivos.valor}
                      variation={kpisData.kpis.clientesActivos.variacion}
                      format="number"
                      icon={<Users size={20} />}
                    />
                    <KPICard
                      title="IVA Facturado"
                      value={kpisData.kpis.ivaFacturado.valor}
                      variation={kpisData.kpis.ivaFacturado.variacion}
                      format="currency"
                      icon={<Receipt size={20} />}
                    />
                    <KPICard
                      title="Descuentos Aplicados"
                      value={kpisData.kpis.descuentos.valor}
                      variation={kpisData.kpis.descuentos.variacion}
                      format="currency"
                      icon={<Percent size={20} />}
                    />
                    <KPICard
                      title="Notas de Crédito"
                      value={kpisData.kpis.notasCredito.valor}
                      format="number"
                      icon={<Package size={20} />}
                    />
                  </>
                )}
          </div>

          {/* ─── Charts Section ─── */}
          <div className="pt-4 border-t border-slate-100 mt-4 space-y-5 print:hidden">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight px-1">
              Visualización de Datos
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
