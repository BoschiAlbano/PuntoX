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
  RefreshCw,
  CalendarDays,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useKPIs,
  useGraficas,
  useAlertas,
  useComplementarios,
} from "@/hooks/useAnaliticas";
import KPICard from "@/components/analiticas/KPICard";
import GraficaIngresos from "@/components/analiticas/GraficaIngresos";
import GraficaPagos from "@/components/analiticas/GraficaPagos";
import GraficaProductos from "@/components/analiticas/GraficaProductos";
import PanelAlertas from "@/components/analiticas/PanelAlertas";
import { PageHeader } from "@/components/dashboard/PageHeader";

// ─── Shared class tokens ────────────────────────────────────────────────────
const selectCls = {
  trigger:
    "h-10 border-slate-200 bg-slate-50/50 hover:border-[#67afc3]/60 data-[focus=true]:border-[#67afc3] rounded-xl",
};
const inputCls = {
  inputWrapper:
    "h-10 border-slate-200 bg-slate-50/50 hover:border-[#67afc3]/60 focus-within:!border-[#67afc3] rounded-xl",
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
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm overflow-hidden">
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
  const initialTab = searchParams.get("tab") || "dashboard";
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
  const fechasModificadasPorUsuario = useRef(false);

  useEffect(() => {
    if (!fechasModificadasPorUsuario.current) {
      setFechaDesde(fechasPorDefecto.desde);
      setFechaHasta(fechasPorDefecto.hasta);
    }
  }, [fechasPorDefecto]);

  const fechaDesdeDebounced = useDebounce(fechaDesde, 300);
  const fechaHastaDebounced = useDebounce(fechaHasta, 300);

  const { data: kpisData, isLoading: kpisLoading } = useKPIs({
    fechaDesde: fechaDesdeDebounced,
    fechaHasta: fechaHastaDebounced,
    periodo,
  });
  const { data: graficasIngresos, isLoading: ingresosLoading } = useGraficas({
    tipo: "ingresos",
    fechaDesde: fechaDesdeDebounced,
    fechaHasta: fechaHastaDebounced,
    agrupacion,
  });
  const { data: graficasPagos, isLoading: pagosLoading } = useGraficas({
    tipo: "pagos",
    fechaDesde: fechaDesdeDebounced,
    fechaHasta: fechaHastaDebounced,
  });
  const { data: graficasProductos, isLoading: productosLoading } = useGraficas({
    tipo: "productos",
    fechaDesde: fechaDesdeDebounced,
    fechaHasta: fechaHastaDebounced,
  });
  const { data: alertasData, isLoading: alertasLoading } = useAlertas({});
  const { data: complementariosData } = useComplementarios({
    fechaDesde: fechaDesdeDebounced,
    fechaHasta: fechaHastaDebounced,
  });

  const isRefreshing =
    kpisLoading || ingresosLoading || pagosLoading || productosLoading;

  return (
    <div className="max-w-[1400px] mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Gestión de"
        accentTitle="Analíticas"
        description="Aquí puedes observar un panorama rápido del rendimiento actual."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-hidden relative flex flex-col"
      >
        <div className="space-y-5 pt-2">
          {/* Filtros */}
          <Panel
            title="Filtros de período"
            icon={SlidersHorizontal}
            action={
              <Button
                size="sm"
                variant="flat"
                isLoading={isRefreshing}
                onPress={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["analiticas"],
                  })
                }
                className="text-[#67afc3] bg-[#67afc3]/10 border border-[#67afc3]/20 font-bold text-xs rounded-xl gap-1.5"
                startContent={!isRefreshing && <RefreshCw size={13} />}
              >
                Actualizar
              </Button>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Select
                size="sm"
                label="Período"
                variant="bordered"
                classNames={selectCls}
                selectedKeys={[periodo]}
                onChange={(e) => {
                  setPeriodo(e.target.value as "semanal" | "mensual");
                  fechasModificadasPorUsuario.current = false;
                }}
              >
                <SelectItem key="semanal">Últimos 7 días</SelectItem>
                <SelectItem key="mensual">Últimos 30 días</SelectItem>
              </Select>
              <Input
                size="sm"
                type="date"
                label="Desde"
                variant="bordered"
                classNames={inputCls}
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  fechasModificadasPorUsuario.current = true;
                }}
                startContent={
                  <CalendarDays size={14} className="text-slate-400 shrink-0" />
                }
              />
              <Input
                size="sm"
                type="date"
                label="Hasta"
                variant="bordered"
                classNames={inputCls}
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  fechasModificadasPorUsuario.current = true;
                }}
                startContent={
                  <CalendarDays size={14} className="text-slate-400 shrink-0" />
                }
              />
              <Select
                size="sm"
                label="Agrupación"
                variant="bordered"
                classNames={selectCls}
                selectedKeys={[agrupacion]}
                onChange={(e) =>
                  setAgrupacion(e.target.value as "dia" | "semana" | "mes")
                }
              >
                <SelectItem key="dia">Por día</SelectItem>
                <SelectItem key="semana">Por semana</SelectItem>
                <SelectItem key="mes">Por mes</SelectItem>
              </Select>
            </div>
          </Panel>

          {/* KPIs */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
              Indicadores clave
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                        color="success"
                      />
                      <KPICard
                        title="Descuentos"
                        value={kpisData.kpis.descuentos.valor}
                        variation={kpisData.kpis.descuentos.variacion}
                        format="currency"
                        icon={<Percent size={20} />}
                        color="warning"
                      />
                      <KPICard
                        title="IVA Facturado"
                        value={kpisData.kpis.ivaFacturado.valor}
                        variation={kpisData.kpis.ivaFacturado.variacion}
                        format="currency"
                        icon={<Receipt size={20} />}
                        color="primary"
                      />
                      <KPICard
                        title="Tickets"
                        value={kpisData.kpis.tickets.valor}
                        variation={kpisData.kpis.tickets.variacion}
                        format="number"
                        icon={<TrendingUp size={20} />}
                        color="default"
                      />
                      <KPICard
                        title="Ticket Promedio"
                        value={kpisData.kpis.ticketPromedio.valor}
                        variation={kpisData.kpis.ticketPromedio.variacion}
                        format="currency"
                        icon={<DollarSign size={20} />}
                        color="success"
                      />
                      <KPICard
                        title="Margen de Ganancia"
                        value={kpisData.kpis.margenGanancia.valor}
                        variation={kpisData.kpis.margenGanancia.variacion}
                        format="currency"
                        icon={<TrendingUp size={20} />}
                        color="success"
                      />
                      <KPICard
                        title="Productos Vendidos"
                        value={kpisData.kpis.productosVendidos.valor}
                        variation={kpisData.kpis.productosVendidos.variacion}
                        format="number"
                        icon={<ShoppingCart size={20} />}
                        color="default"
                      />
                      <KPICard
                        title="Clientes Activos"
                        value={kpisData.kpis.clientesActivos.valor}
                        variation={kpisData.kpis.clientesActivos.variacion}
                        format="number"
                        icon={<Users size={20} />}
                        color="primary"
                      />
                      <KPICard
                        title="Notas de Crédito"
                        value={kpisData.kpis.notasCredito.valor}
                        format="number"
                        icon={<Package size={20} />}
                        color="warning"
                      />
                      {kpisData.kpis.estadoCaja && (
                        <KPICard
                          title="Estado de Caja"
                          value={
                            kpisData.kpis.estadoCaja.estaAbierta
                              ? "Abierta"
                              : "Cerrada"
                          }
                          format="custom"
                          icon={<Store size={20} />}
                          color={
                            kpisData.kpis.estadoCaja.estaAbierta
                              ? "success"
                              : "default"
                          }
                        />
                      )}
                    </>
                  )}
            </div>
          </div>

          {/* Gráficas */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
              Gráficas
            </p>
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
          </div>

          {productosLoading ? (
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm h-[400px] animate-pulse" />
          ) : graficasProductos ? (
            <GraficaProductos datos={graficasProductos.datos} />
          ) : null}

          {/* Alertas */}
          {alertasData && (
            <PanelAlertas data={alertasData} isLoading={alertasLoading} />
          )}

          {/* Complementarios */}
          {complementariosData && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                Detalles complementarios
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {complementariosData.gastos && (
                  <Panel title="Gastos y caja" icon={Receipt}>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Total gastos",
                          value: new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: "ARS",
                          }).format(complementariosData.gastos.total),
                          color: "text-slate-700",
                        },
                        {
                          label: "Total ganancia",
                          value: new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: "ARS",
                          }).format(complementariosData.gastos.totalGanancia),
                          color: "text-emerald-600",
                        },
                      ].map(({ label, value, color }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50/60 border border-slate-100"
                        >
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {label}
                          </span>
                          <span className={`text-base font-extrabold ${color}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50/60 border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Eficiencia
                        </span>
                        <span
                          className={`text-sm font-extrabold px-3 py-1 rounded-lg ${complementariosData.gastos.eficiencia >= 50 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
                        >
                          {complementariosData.gastos.eficiencia.toFixed(1)}%
                        </span>
                      </div>
                      {complementariosData.gastos.porConcepto?.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Por concepto
                          </p>
                          {complementariosData.gastos.porConcepto
                            .slice(0, 5)
                            .map((g, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0"
                              >
                                <span className="text-slate-500 font-medium">
                                  {g.concepto}
                                </span>
                                <span className="text-slate-700 font-bold">
                                  {new Intl.NumberFormat("es-AR", {
                                    style: "currency",
                                    currency: "ARS",
                                  }).format(g.monto)}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </Panel>
                )}

                {complementariosData.usuarios && (
                  <Panel title="Usuarios activos" icon={Users}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50/60 border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Activos ahora
                        </span>
                        <span className="text-base font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-0.5 rounded-lg">
                          {complementariosData.usuarios.activosAhora}
                        </span>
                      </div>
                      {complementariosData.usuarios.dispositivosNoConfiables
                        ?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Dispositivos no confiables
                          </p>
                          {complementariosData.usuarios.dispositivosNoConfiables.map(
                            (d) => (
                              <div
                                key={d.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100"
                              >
                                <AlertCircle
                                  size={14}
                                  className="text-amber-500 shrink-0"
                                />
                                <div>
                                  <p className="text-xs font-bold text-slate-700">
                                    {d.usuario}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {d.dispositivo || "Desconocido"}
                                  </p>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </Panel>
                )}
              </div>
            </div>
          )}
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
