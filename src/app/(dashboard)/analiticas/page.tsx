"use client";

import { useState, useMemo, Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePagePermission } from "@/lib/permissions/usePagePermission";
import { useQueryEnabled } from "@/lib/react-query/useQueryEnabled";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Select,
  SelectItem,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
} from "@heroui/react";
import {
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Receipt,
  Percent,
  ShoppingCart,
  Store,
  RefreshCw,
} from "lucide-react";
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

// TODO: Reemplazar con datos reales del API cuando esté disponible
// Endpoint esperado: GET /api/logs?fechaDesde=...&fechaHasta=...&usuario=...&accion=...&modulo=...&page=...&limit=...
const mockLogs = [
  {
    id: 1,
    fecha: "2024-01-15 14:30:25",
    usuario: "Lucas Martínez",
    accion: "Login exitoso",
    modulo: "Autenticación",
    ip: "192.168.1.100",
    estado: "success",
  },
  {
    id: 2,
    fecha: "2024-01-15 14:25:10",
    usuario: "María García",
    accion: "Crear rol",
    modulo: "Empleados",
    ip: "192.168.1.101",
    estado: "success",
  },
  {
    id: 3,
    fecha: "2024-01-15 14:20:05",
    usuario: "Juan Pérez",
    accion: "Eliminar empleado",
    modulo: "Empleados",
    ip: "192.168.1.102",
    estado: "success",
  },
  {
    id: 4,
    fecha: "2024-01-15 14:15:30",
    usuario: "Ana López",
    accion: "Actualizar producto",
    modulo: "Productos",
    ip: "192.168.1.103",
    estado: "success",
  },
  {
    id: 5,
    fecha: "2024-01-15 14:10:15",
    usuario: "Carlos Rodríguez",
    accion: "Login fallido",
    modulo: "Autenticación",
    ip: "192.168.1.104",
    estado: "error",
  },
  {
    id: 6,
    fecha: "2024-01-15 14:05:45",
    usuario: "Lucas Martínez",
    accion: "Exportar datos",
    modulo: "Reportes",
    ip: "192.168.1.100",
    estado: "success",
  },
  {
    id: 7,
    fecha: "2024-01-15 14:00:20",
    usuario: "María García",
    accion: "Cambiar permisos",
    modulo: "Empleados",
    ip: "192.168.1.101",
    estado: "success",
  },
  {
    id: 8,
    fecha: "2024-01-15 13:55:10",
    usuario: "Juan Pérez",
    accion: "Crear producto",
    modulo: "Productos",
    ip: "192.168.1.102",
    estado: "success",
  },
  {
    id: 9,
    fecha: "2024-01-15 13:50:35",
    usuario: "Ana López",
    accion: "Suspender usuario",
    modulo: "Empleados",
    ip: "192.168.1.103",
    estado: "warning",
  },
  {
    id: 10,
    fecha: "2024-01-15 13:45:50",
    usuario: "Carlos Rodríguez",
    accion: "Ver configuración",
    modulo: "Configuración",
    ip: "192.168.1.104",
    estado: "success",
  },
  {
    id: 11,
    fecha: "2024-01-15 13:40:15",
    usuario: "Lucas Martínez",
    accion: "Eliminar producto",
    modulo: "Productos",
    ip: "192.168.1.100",
    estado: "success",
  },
  {
    id: 12,
    fecha: "2024-01-15 13:35:30",
    usuario: "María García",
    accion: "Actualizar configuración",
    modulo: "Configuración",
    ip: "192.168.1.101",
    estado: "success",
  },
  {
    id: 13,
    fecha: "2024-01-15 13:30:45",
    usuario: "Juan Pérez",
    accion: "Login exitoso",
    modulo: "Autenticación",
    ip: "192.168.1.102",
    estado: "success",
  },
  {
    id: 14,
    fecha: "2024-01-15 13:25:20",
    usuario: "Ana López",
    accion: "Crear venta",
    modulo: "Ventas",
    ip: "192.168.1.103",
    estado: "success",
  },
  {
    id: 15,
    fecha: "2024-01-15 13:20:10",
    usuario: "Carlos Rodríguez",
    accion: "Ver reporte",
    modulo: "Reportes",
    ip: "192.168.1.104",
    estado: "success",
  },
];

const modulosDisponibles = [
  "Todos",
  "Autenticación",
  "Empleados",
  "Productos",
  "Ventas",
  "Configuración",
  "Reportes",
];

const accionesDisponibles = [
  "Todas",
  "Login exitoso",
  "Login fallido",
  "Crear rol",
  "Eliminar empleado",
  "Actualizar producto",
  "Exportar datos",
  "Cambiar permisos",
  "Suspender usuario",
  "Ver configuración",
];

function estadoColor(estado: string) {
  if (estado === "success") return "success";
  if (estado === "error") return "danger";
  if (estado === "warning") return "warning";
  return "default";
}

function AnaliticasContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "dashboard";
  const queryClient = useQueryClient();

  // Obtener permisos para habilitar queries solo cuando tenga acceso
  const { tieneAcceso, isLoading: isLoadingPermisos } = usePagePermission();

  // Filtros para dashboard
  const [periodo, setPeriodo] = useState<"semanal" | "mensual">("mensual");
  const [agrupacion, setAgrupacion] = useState<"dia" | "semana" | "mes">("dia");

  // Calcular fechas por defecto según período usando useMemo para evitar loops
  const fechasPorDefecto = useMemo(() => {
    const hoy = new Date();
    const diasAtras = periodo === "semanal" ? 7 : 30;
    const desde = new Date(hoy.getTime() - diasAtras * 24 * 60 * 60 * 1000);
    return {
      desde: desde.toISOString().split("T")[0],
      hasta: hoy.toISOString().split("T")[0],
    };
  }, [periodo]);

  // Estados para fechas con inicialización desde fechasPorDefecto
  const [fechaDesde, setFechaDesde] = useState<string>(fechasPorDefecto.desde);
  const [fechaHasta, setFechaHasta] = useState<string>(fechasPorDefecto.hasta);

  // Ref para evitar actualizar fechas si el usuario ya las modificó manualmente
  const fechasModificadasPorUsuario = useRef(false);

  // Actualizar fechas cuando cambia el período, solo si el usuario no las ha modificado
  useEffect(() => {
    if (!fechasModificadasPorUsuario.current) {
      setFechaDesde(fechasPorDefecto.desde);
      setFechaHasta(fechasPorDefecto.hasta);
    }
  }, [fechasPorDefecto]);

  // Debounce de fechas para evitar queries canceladas (300ms de delay - más rápido para mejor UX)
  const fechaDesdeDebounced = useDebounce(fechaDesde, 300);
  const fechaHastaDebounced = useDebounce(fechaHasta, 300);

  // Filtros para logs
  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    usuario: "",
    accion: "Todas",
    modulo: "Todos",
  });

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Hooks para datos (usar fechas debounced para evitar queries canceladas)
  // Solo habilitar cuando tenga acceso confirmado Y las fechas estén establecidas
  const fechasListas = fechaDesdeDebounced && fechaHastaDebounced;

  // Usar helper para evitar cancelaciones cuando tieneAcceso cambia de undefined a true
  const enabledQueries = useQueryEnabled(
    tieneAcceso,
    isLoadingPermisos ?? false,
    fechasListas ? true : false
  );
  const enabledAlertas = useQueryEnabled(
    tieneAcceso,
    isLoadingPermisos ?? false
  );

  const { data: kpisData, isLoading: kpisLoading } = useKPIs({
    fechaDesde: fechaDesdeDebounced,
    fechaHasta: fechaHastaDebounced,
    periodo,
    enabled: enabledQueries,
  });

  const { data: graficasIngresos, isLoading: ingresosLoading } = useGraficas({
    tipo: "ingresos",
    fechaDesde: fechaDesdeDebounced,
    fechaHasta: fechaHastaDebounced,
    agrupacion,
    enabled: enabledQueries,
  });

  const { data: graficasPagos, isLoading: pagosLoading } = useGraficas({
    tipo: "pagos",
    fechaDesde: fechaDesdeDebounced,
    fechaHasta: fechaHastaDebounced,
    enabled: enabledQueries,
  });

  const { data: graficasProductos, isLoading: productosLoading } = useGraficas({
    tipo: "productos",
    fechaDesde: fechaDesdeDebounced,
    fechaHasta: fechaHastaDebounced,
    enabled: enabledQueries,
  });

  const { data: alertasData, isLoading: alertasLoading } = useAlertas({
    enabled: enabledAlertas,
  });

  const { data: complementariosData } = useComplementarios({
    fechaDesde: fechaDesdeDebounced,
    fechaHasta: fechaHastaDebounced,
    enabled: enabledQueries,
  });

  const logsFiltrados = useMemo(() => {
    return mockLogs.filter((log) => {
      const matchUsuario =
        !filtros.usuario ||
        log.usuario.toLowerCase().includes(filtros.usuario.toLowerCase());
      const matchAccion =
        filtros.accion === "Todas" || log.accion === filtros.accion;
      const matchModulo =
        filtros.modulo === "Todos" || log.modulo === filtros.modulo;
      // TODO: Implementar filtro por fecha cuando esté disponible
      const matchFecha = true; // Placeholder

      return matchUsuario && matchAccion && matchModulo && matchFecha;
    });
  }, [filtros]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return logsFiltrados.slice(start, end);
  }, [logsFiltrados, page]);

  const totalPages = Math.ceil(logsFiltrados.length / rowsPerPage);

  return (
    <div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch h-full">
      <Tabs
        aria-label="Analíticas"
        selectedKey={initialTab}
        onSelectionChange={(key) => {
          // Actualizar URL sin recargar
          const url = new URL(window.location.href);
          url.searchParams.set("tab", key as string);
          window.history.pushState({}, "", url);
        }}
        className="relative"
        classNames={{
          tabList:
            "bg-white backdrop-blur-sm rounded-lg shadow-none border-gray-200/50 p-1 overflow-x-auto scrollbar-hide",
          tab: "m-[5px] p-[20px] data-[selected=true]:bg-[#67afc3]/90 data-[selected=true]:text-white data-[selected=true]:shadow-none transition-all duration-300 data-[hover=true]:bg-gray-100/50 data-[hover=true]:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3] focus-visible:ring-offset-2 text-[16px] cursor-pointer transform hover:scale-105 active:scale-95",
          tabContent:
            "group-data-[selected=true]:text-white font-medium transition-colors duration-200",
          cursor: "bg-[#67afc3]/90",
          panel: "h-full",
        }}
      >
          <Tab
            key="dashboard"
            title={
              <div className="flex items-center space-x-2">
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 6.11 5.173L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06a.75.75 0 0 1 1.06 0ZM3 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 8Zm11 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14 8Zm-6.828 2.828a.75.75 0 0 1 0 1.061L6.11 12.95a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm3.594-3.317a.75.75 0 0 0-1.37.364l-.492 6.861a.75.75 0 0 0 1.204.65l1.043-.799.985 3.678a.75.75 0 0 0 1.45-.388l-.978-3.646 1.292.204a.75.75 0 0 0 .74-1.16l-3.874-5.764Z" />
                  </svg>
                </span>
                <span>Dashboard</span>
              </div>
            }
          >
            <div className="mt-6 space-y-6">
              {/* Header de la sección con botón de refresh */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                  <p className="text-sm text-gray-600">
                    Visualiza métricas, reportes y actividad del sistema en un solo lugar
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Refrescar todas las queries de analíticas
                    queryClient.invalidateQueries({ queryKey: ["analiticas"] });
                  }}
                  disabled={kpisLoading || ingresosLoading || pagosLoading || productosLoading}
                  className="p-2 rounded-lg border border-gray-300 bg-[#67afc3]/90 hover:bg-[#67afc3] hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Actualizar datos"
                  aria-label="Actualizar datos del dashboard"
                >
                  <RefreshCw
                    size={18}
                    className={`text-white transition-transform ${
                      kpisLoading || ingresosLoading || pagosLoading || productosLoading ? "animate-spin" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Filtros */}
              <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardBody className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <Select
                      size="sm"
                      label="Período"
                      selectedKeys={[periodo]}
                      onChange={(e) => {
                        setPeriodo(e.target.value as "semanal" | "mensual");
                        // Resetear flag cuando cambia el período para que se actualicen las fechas
                        fechasModificadasPorUsuario.current = false;
                      }}
                      className="w-full md:min-w-[140px]"
                    >
                      <SelectItem key="semanal">Semanal</SelectItem>
                      <SelectItem key="mensual">Mensual</SelectItem>
                    </Select>
                    <Input
                      size="sm"
                      type="date"
                      label="Desde"
                      value={fechaDesde}
                      onChange={(e) => {
                        setFechaDesde(e.target.value);
                        fechasModificadasPorUsuario.current = true;
                      }}
                      className="w-full md:min-w-[140px]"
                    />
                    <Input
                      size="sm"
                      type="date"
                      label="Hasta"
                      value={fechaHasta}
                      onChange={(e) => {
                        setFechaHasta(e.target.value);
                        fechasModificadasPorUsuario.current = true;
                      }}
                      className="w-full md:min-w-[140px]"
                    />
                    <Select
                      size="sm"
                      label="Agrupación"
                      selectedKeys={[agrupacion]}
                      onChange={(e) =>
                        setAgrupacion(
                          e.target.value as "dia" | "semana" | "mes"
                        )
                      }
                      className="w-full md:min-w-[140px]"
                    >
                      <SelectItem key="dia">Por Día</SelectItem>
                      <SelectItem key="semana">Por Semana</SelectItem>
                      <SelectItem key="mes">Por Mes</SelectItem>
                    </Select>
                  </div>
                </CardBody>
              </Card>

              {/* KPIs */}
              {kpisLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Card key={i} className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
                      <CardBody className="p-4">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : kpisData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <KPICard
                    title="Ingresos Netos"
                    value={kpisData.kpis.ingresosNetos.valor}
                    variation={kpisData.kpis.ingresosNetos.variacion}
                    format="currency"
                    icon={<DollarSign size={24} />}
                    color="success"
                  />
                  <KPICard
                    title="Descuentos"
                    value={kpisData.kpis.descuentos.valor}
                    variation={kpisData.kpis.descuentos.variacion}
                    format="currency"
                    icon={<Percent size={24} />}
                    color="warning"
                  />
                  <KPICard
                    title="IVA Facturado"
                    value={kpisData.kpis.ivaFacturado.valor}
                    variation={kpisData.kpis.ivaFacturado.variacion}
                    format="currency"
                    icon={<Receipt size={24} />}
                    color="primary"
                  />
                  <KPICard
                    title="Tickets"
                    value={kpisData.kpis.tickets.valor}
                    variation={kpisData.kpis.tickets.variacion}
                    format="number"
                    icon={<TrendingUp size={24} />}
                    color="default"
                  />
                  <KPICard
                    title="Ticket Promedio"
                    value={kpisData.kpis.ticketPromedio.valor}
                    variation={kpisData.kpis.ticketPromedio.variacion}
                    format="currency"
                    icon={<DollarSign size={24} />}
                    color="success"
                  />
                  <KPICard
                    title="Margen de Ganancia"
                    value={kpisData.kpis.margenGanancia.valor}
                    variation={kpisData.kpis.margenGanancia.variacion}
                    format="currency"
                    icon={<TrendingUp size={24} />}
                    color="success"
                  />
                  <KPICard
                    title="Productos Vendidos"
                    value={kpisData.kpis.productosVendidos.valor}
                    variation={kpisData.kpis.productosVendidos.variacion}
                    format="number"
                    icon={<ShoppingCart size={24} />}
                    color="default"
                  />
                  <KPICard
                    title="Clientes Activos"
                    value={kpisData.kpis.clientesActivos.valor}
                    variation={kpisData.kpis.clientesActivos.variacion}
                    format="number"
                    icon={<Users size={24} />}
                    color="primary"
                  />
                  <KPICard
                    title="Notas de Crédito"
                    value={kpisData.kpis.notasCredito.valor}
                    format="number"
                    icon={<Package size={24} />}
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
                      icon={<Store size={24} />}
                      color={
                        kpisData.kpis.estadoCaja.estaAbierta
                          ? "success"
                          : "default"
                      }
                    />
                  )}
                </div>
              ) : null}

              {/* Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ingresosLoading ? (
                  <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
                      <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </CardHeader>
                    <CardBody className="p-6">
                      <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
                    </CardBody>
                  </Card>
                ) : graficasIngresos ? (
                  <GraficaIngresos datos={graficasIngresos.datos} />
                ) : null}

                {pagosLoading ? (
                  <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
                      <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </CardHeader>
                    <CardBody className="p-6">
                      <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
                    </CardBody>
                  </Card>
                ) : graficasPagos ? (
                  <GraficaPagos datos={graficasPagos.datos} />
                ) : null}
              </div>

              {productosLoading ? (
                <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
                  <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
                    <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  </CardHeader>
                  <CardBody className="p-6">
                    <div className="h-[400px] bg-gray-100 rounded animate-pulse"></div>
                  </CardBody>
                </Card>
              ) : graficasProductos ? (
                <GraficaProductos datos={graficasProductos.datos} />
              ) : null}

              {/* Alertas */}
              {alertasData && (
                <PanelAlertas data={alertasData} isLoading={alertasLoading} />
              )}

              {/* Datos complementarios */}
              {complementariosData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {complementariosData.gastos && (
                    <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
                      <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Gastos y Caja
                        </h3>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Total Gastos:
                            </span>
                            <span className="text-lg font-semibold">
                              {new Intl.NumberFormat("es-AR", {
                                style: "currency",
                                currency: "ARS",
                              }).format(complementariosData.gastos.total)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Total Ganancia:
                            </span>
                            <span className="text-lg font-semibold text-green-600">
                              {new Intl.NumberFormat("es-AR", {
                                style: "currency",
                                currency: "ARS",
                              }).format(
                                complementariosData.gastos.totalGanancia
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Eficiencia:
                            </span>
                            <Chip
                              size="sm"
                              color={
                                complementariosData.gastos.eficiencia >= 50
                                  ? "success"
                                  : "warning"
                              }
                              variant="flat"
                            >
                              {complementariosData.gastos.eficiencia.toFixed(1)}
                              %
                            </Chip>
                          </div>
                          <Divider />
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Gastos por Concepto:
                            </p>
                            <div className="space-y-2">
                              {complementariosData.gastos.porConcepto
                                .slice(0, 5)
                                .map((gasto, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center text-sm"
                                  >
                                    <span className="text-gray-600">
                                      {gasto.concepto}
                                    </span>
                                    <span className="font-medium">
                                      {new Intl.NumberFormat("es-AR", {
                                        style: "currency",
                                        currency: "ARS",
                                      }).format(gasto.monto)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {complementariosData.usuarios && (
                    <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
                      <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Usuarios Activos
                        </h3>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Activos Ahora:
                            </span>
                            <Chip size="sm" color="success" variant="flat">
                              {complementariosData.usuarios.activosAhora}
                            </Chip>
                          </div>
                          {complementariosData.usuarios.dispositivosNoConfiables
                            .length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Dispositivos No Confiables:
                              </p>
                              <div className="space-y-2">
                                {complementariosData.usuarios.dispositivosNoConfiables.map(
                                  (d) => (
                                    <div
                                      key={d.id}
                                      className="text-sm p-2 rounded border border-yellow-200 bg-yellow-50"
                                    >
                                      <p className="font-medium">{d.usuario}</p>
                                      <p className="text-xs text-gray-500">
                                        {d.dispositivo || "Desconocido"}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </Tab>

          <Tab
            key="logs"
            title={
              <div className="flex items-center space-x-2">
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>Logs</span>
              </div>
            }
          >
            <div className="mt-6 space-y-6">
              {/* Header de la sección con botón de refresh */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Logs de Actividad</h2>
                  <p className="text-sm text-gray-600">
                    Registro completo de acciones y eventos del sistema
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Refrescar logs (cuando esté conectado al API)
                    setPage(1);
                  }}
                  className="p-2 rounded-lg border border-gray-300 bg-[#67afc3]/90 hover:bg-[#67afc3] hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Actualizar logs"
                  aria-label="Actualizar logs de actividad"
                >
                  <RefreshCw
                    size={18}
                    className="text-white transition-transform"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="flex flex-col gap-4 pb-3 border-b border-slate-200/70 bg-slate-50/70">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Filtros de búsqueda
                      </h3>
                      <p className="text-xs text-slate-500">
                        {logsFiltrados.length} registros encontrados
                      </p>
                    </div>
                  </div>
                <div className="flex flex-col md:flex-row gap-3 w-full">
                  <div className="group flex items-center gap-2 border-2 border-gray-300 rounded-xl p-1.5 bg-white transition-all duration-300 hover:border-[#67afc3] relative w-full md:max-w-xs">
                    <input
                      type="text"
                      placeholder="Buscar por usuario..."
                      className="outline-none px-2 bg-transparent text-gray-700 placeholder:text-gray-400 w-full"
                      value={filtros.usuario}
                      onChange={(e) =>
                        setFiltros((prev) => ({
                          ...prev,
                          usuario: e.target.value,
                        }))
                      }
                      aria-label="Buscar por usuario"
                    />
                    <Search
                      size={16}
                      className="text-gray-500 transition-all duration-300 group-hover:text-[#67afc3] group-hover:scale-105"
                    />
                  </div>
                  <Select
                    size="sm"
                    label="Módulo"
                    selectedKeys={[filtros.modulo]}
                    onChange={(e) =>
                      setFiltros((prev) => ({
                        ...prev,
                        modulo: e.target.value,
                      }))
                    }
                    className="w-full md:min-w-[160px]"
                  >
                    {modulosDisponibles.map((modulo) => (
                      <SelectItem key={modulo}>{modulo}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    size="sm"
                    label="Acción"
                    selectedKeys={[filtros.accion]}
                    onChange={(e) =>
                      setFiltros((prev) => ({
                        ...prev,
                        accion: e.target.value,
                      }))
                    }
                    className="w-full md:min-w-[160px]"
                  >
                    {accionesDisponibles.map((accion) => (
                      <SelectItem key={accion}>{accion}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    size="sm"
                    type="date"
                    label="Desde"
                    value={filtros.fechaDesde}
                    onChange={(e) =>
                      setFiltros((prev) => ({
                        ...prev,
                        fechaDesde: e.target.value,
                      }))
                    }
                    className="w-full md:min-w-[140px]"
                  />
                  <Input
                    size="sm"
                    type="date"
                    label="Hasta"
                    value={filtros.fechaHasta}
                    onChange={(e) =>
                      setFiltros((prev) => ({
                        ...prev,
                        fechaHasta: e.target.value,
                      }))
                    }
                    className="w-full md:min-w-[140px]"
                  />
                  <button
                    onClick={() => {
                      // TODO: Implementar lógica de filtrado cuando esté conectado al API
                      setPage(1);
                    }}
                    className="px-4 h-[36px] rounded-lg border border-gray-300 bg-[#67afc3]/90 hover:bg-[#67afc3] hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-white cursor-pointer flex items-center gap-2 text-sm font-semibold"
                    aria-label="Aplicar filtros"
                  >
                    <Filter size={16} />
                    Filtrar
                  </button>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="p-0">
                {/* TODO: Reemplazar con datos reales del API */}
                <div className="rounded-lg overflow-hidden">
                  <Table
                    aria-label="Tabla de logs"
                    classNames={{
                      wrapper: "bg-white rounded-lg border-none",
                      th: "bg-[#67afc3]/90 text-white transition-colors duration-200 text-[13px] font-medium hover:!text-white hover:[&_*]:!text-white",
                      base: "bg-transparent shadow-none rounded-lg border-none",
                    }}
                  >
                    <TableHeader>
                      <TableColumn aria-label="Fecha del log">
                        FECHA
                      </TableColumn>
                      <TableColumn aria-label="Usuario que realizó la acción">
                        USUARIO
                      </TableColumn>
                      <TableColumn aria-label="Acción realizada">
                        ACCIÓN
                      </TableColumn>
                      <TableColumn aria-label="Módulo donde se realizó">
                        MÓDULO
                      </TableColumn>
                      <TableColumn aria-label="Dirección IP">IP</TableColumn>
                      <TableColumn aria-label="Estado de la acción">
                        ESTADO
                      </TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No se encontraron logs">
                      {paginatedLogs.map((log) => (
                        <TableRow
                          key={log.id}
                          className="transition-all duration-200 hover:bg-linear-to-r hover:from-blue-50 hover:to-sky-50 cursor-pointer rounded-lg"
                          tabIndex={0}
                          aria-label={`Log ${log.accion} por ${log.usuario}`}
                        >
                          <TableCell>
                            <span className="text-sm text-gray-700">{log.fecha}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-gray-700">{log.usuario}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{log.accion}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{log.modulo}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500 font-mono">
                              {log.ip}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              color={estadoColor(log.estado)}
                              variant="flat"
                            >
                              {log.estado}
                            </Chip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center py-4">
                    <Pagination
                      total={totalPages}
                      page={page}
                      onChange={setPage}
                      classNames={{
                        cursor: "bg-[#67afc3]/90 text-white shadow-none",
                        item: "bg-transparent shadow-none cursor-pointer",
                        next: "cursor-pointer",
                        prev: "cursor-pointer",
                      }}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
            </div>
          </Tab>
        </Tabs>
    </div>
  );
}

export default function Analiticas() {
  const { tieneAcceso, isLoading: isLoadingPermisos } = usePagePermission(); // Proteger página con permisos

  // No renderizar contenido hasta que los permisos estén verificados
  if (isLoadingPermisos) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si tieneAcceso es undefined, aún está cargando
  if (tieneAcceso === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no tiene acceso, no renderizar nada (usePagePermission ya redirige)
  if (tieneAcceso === false) {
    return null;
  }

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <AnaliticasContent />
    </Suspense>
  );
}




