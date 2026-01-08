"use client";

import { useState, useMemo, Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePagePermission } from "@/lib/permissions/usePagePermission";
import { useQueryEnabled } from "@/lib/react-query/useQueryEnabled";
import { useDebounce } from "@/hooks/useDebounce";
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
    <div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch justify-center">
      {/* Header mejorado con parallax, glow y sombras profundas */}
      <section className="w-full relative overflow-hidden rounded-3xl border border-slate-200/50 bg-linear-to-r from-blue-500 via-sky-500 to-emerald-400 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] mb-10 transition-all duration-300 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)]">
        {/* Blurred circles decorativos para profundidad con parallax ligero (optimizado) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ willChange: "transform" }}
        >
          <div
            className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl parallax-bg"
            style={{ willChange: "transform" }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/8 rounded-full blur-2xl parallax-bg"
            style={{ animationDelay: "2s", willChange: "transform" }}
          />
          <div
            className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl parallax-bg"
            style={{ animationDelay: "4s", willChange: "transform" }}
          />
        </div>

        {/* Glass panel semitransparente con blur más suave */}
        <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm" />

        {/* Radial gradient overlay para más profundidad */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_50%)]" />

        <div className="relative p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 flex-1">
              <Chip
                variant="flat"
                className="bg-white/25 text-white backdrop-blur-sm border border-white/40 shadow-lg shadow-white/20 transition-all duration-300 hover:bg-white/30 hover:shadow-xl hover:shadow-white/30"
              >
                Analíticas
              </Chip>
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-white drop-shadow-lg">
                  Analíticas y Reportes
                </h1>
                <p className="text-white/95 max-w-2xl md:text-lg leading-relaxed drop-shadow-md">
                  Visualiza métricas, reportes y logs de actividad del sistema
                  desde un solo lugar
                </p>
              </div>
            </div>

            {/* Ícono grande de gráficos/analíticas a la derecha (complementario al sidebar) */}
            <div className="hidden md:flex items-center justify-center shrink-0">
              <div className="relative group">
                {/* Glow alrededor del icono - efecto premium */}
                <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-500" />
                <div className="absolute inset-0 bg-linear-to-br from-white/30 via-transparent to-white/20 rounded-full blur-xl group-hover:from-white/40 group-hover:to-white/30 transition-all duration-500" />
                {/* Blur suave de fondo */}
                <div className="absolute inset-0 bg-white/15 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-300" />
                <svg
                  className="w-32 h-32 md:w-40 md:h-40 text-white relative z-10 drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  style={{
                    animation: "fadeIn 0.4s ease-out 0.1s forwards",
                    willChange: "transform, opacity",
                    opacity: 0,
                  }}
                >
                  {/* Icono de gráficos/analíticas - más elaborado que el del sidebar */}
                  {/* Eje Y */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3v18h18"
                  />
                  {/* Gráfico de barras */}
                  <rect
                    x="4"
                    y="16"
                    width="2"
                    height="2"
                    fill="currentColor"
                    opacity="0.8"
                  />
                  <rect
                    x="7"
                    y="12"
                    width="2"
                    height="6"
                    fill="currentColor"
                    opacity="0.8"
                  />
                  <rect
                    x="10"
                    y="8"
                    width="2"
                    height="10"
                    fill="currentColor"
                    opacity="0.8"
                  />
                  <rect
                    x="13"
                    y="6"
                    width="2"
                    height="12"
                    fill="currentColor"
                    opacity="0.8"
                  />
                  <rect
                    x="16"
                    y="10"
                    width="2"
                    height="8"
                    fill="currentColor"
                    opacity="0.8"
                  />
                  {/* Línea de tendencia */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l4-4 4 4 4-4 4 4"
                    strokeWidth={2}
                    opacity={0.9}
                  />
                  {/* Puntos en la línea */}
                  <circle
                    cx="5"
                    cy="15"
                    r="1.5"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <circle
                    cx="9"
                    cy="11"
                    r="1.5"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <circle
                    cx="13"
                    cy="7"
                    r="1.5"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <circle
                    cx="17"
                    cy="11"
                    r="1.5"
                    fill="currentColor"
                    opacity="0.9"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs mejoradas con glassmorphism y micro-interacciones */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 p-2 mb-6 overflow-x-auto scrollbar-hide">
        <Tabs
          aria-label="Analíticas"
          color="primary"
          variant="underlined"
          defaultSelectedKey={initialTab}
          classNames={{
            tabList:
              "gap-2 w-full relative rounded-lg p-0 border-none bg-transparent",
            cursor:
              "w-full bg-gradient-to-r from-[#67afc3] to-[#529aa6] shadow-md",
            tab: "max-w-fit px-4 h-10 data-[selected=true]:text-white transition-colors duration-200 hover:bg-gray-100/50 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3] focus-visible:ring-offset-2",
            tabContent: "group-data-[selected=true]:text-white font-medium",
          }}
        >
          <Tab
            key="dashboard"
            title={
              <div className="flex items-center space-x-2">
                <span>📊</span>
                <span>Dashboard</span>
              </div>
            }
          >
            <div className="mt-6 space-y-6">
              {/* Filtros */}
              <Card className="shadow-md border border-gray-200/50">
                <CardBody className="p-4 bg-white/80 backdrop-blur-sm">
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
                <Card className="shadow-md border border-gray-200/50">
                  <CardBody className="p-6 bg-white/80 backdrop-blur-sm">
                    <p className="text-gray-500">Cargando KPIs...</p>
                  </CardBody>
                </Card>
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
                  <Card className="shadow-md border border-gray-200/50">
                    <CardBody className="p-6 bg-white/80 backdrop-blur-sm">
                      <p className="text-gray-500">
                        Cargando gráfica de ingresos...
                      </p>
                    </CardBody>
                  </Card>
                ) : graficasIngresos ? (
                  <GraficaIngresos datos={graficasIngresos.datos} />
                ) : null}

                {pagosLoading ? (
                  <Card className="shadow-md border border-gray-200/50">
                    <CardBody className="p-6 bg-white/80 backdrop-blur-sm">
                      <p className="text-gray-500">
                        Cargando gráfica de pagos...
                      </p>
                    </CardBody>
                  </Card>
                ) : graficasPagos ? (
                  <GraficaPagos datos={graficasPagos.datos} />
                ) : null}
              </div>

              {productosLoading ? (
                <Card className="shadow-md border border-gray-200/50">
                  <CardBody className="p-6 bg-white/80 backdrop-blur-sm">
                    <p className="text-gray-500">
                      Cargando gráfica de productos...
                    </p>
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
                    <Card className="shadow-md border border-gray-200/50">
                      <CardHeader className="pb-3 bg-linear-to-r from-slate-50 to-slate-100">
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
                    <Card className="shadow-md border border-gray-200/50">
                      <CardHeader className="pb-3 bg-linear-to-r from-slate-50 to-slate-100">
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
                <span>📋</span>
                <span>Logs</span>
              </div>
            }
          >
            <Card className="mt-6 shadow-md border border-gray-200/50">
              <CardHeader className="flex flex-col gap-4 pb-3 bg-linear-to-r from-slate-50 to-slate-100">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-sm text-gray-500">Auditoría</p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Logs de actividad
                    </h3>
                  </div>
                  <Chip
                    size="sm"
                    variant="flat"
                    color="warning"
                    className="transition-all duration-200 hover:scale-105"
                  >
                    {logsFiltrados.length} registros
                  </Chip>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full">
                  <Input
                    size="sm"
                    placeholder="Buscar por usuario..."
                    startContent={
                      <Search size={16} className="text-gray-400" />
                    }
                    value={filtros.usuario}
                    onChange={(e) =>
                      setFiltros((prev) => ({
                        ...prev,
                        usuario: e.target.value,
                      }))
                    }
                    className="w-full md:max-w-xs"
                  />
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
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Filter size={16} />}
                    onPress={() => {
                      // TODO: Implementar lógica de filtrado cuando esté conectado al API
                      setPage(1);
                    }}
                    className="transition-all duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Aplicar filtros"
                  >
                    Filtrar
                  </Button>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="p-0">
                {/* TODO: Reemplazar con datos reales del API */}
                <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200/50">
                  <Table
                    aria-label="Tabla de logs"
                    classNames={{
                      wrapper: "bg-white/80 backdrop-blur-sm",
                      th: "bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 transition-colors duration-200 hover:bg-gray-100",
                    }}
                    style={{ contain: "layout style paint" }}
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
                          className="transition-all duration-200 hover:bg-linear-to-r hover:from-blue-50/50 hover:to-sky-50/50 hover:shadow-sm cursor-pointer focus-within:bg-blue-50/30 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#67afc3]/50"
                          tabIndex={0}
                          aria-label={`Log ${log.accion} por ${log.usuario}`}
                        >
                          <TableCell className="border-b border-gray-100">
                            {log.fecha}
                          </TableCell>
                          <TableCell className="border-b border-gray-100">
                            {log.usuario}
                          </TableCell>
                          <TableCell className="border-b border-gray-100">
                            {log.accion}
                          </TableCell>
                          <TableCell className="border-b border-gray-100">
                            {log.modulo}
                          </TableCell>
                          <TableCell className="border-b border-gray-100">
                            <span className="text-xs text-gray-500">
                              {log.ip}
                            </span>
                          </TableCell>
                          <TableCell className="border-b border-gray-100">
                            <Chip
                              size="sm"
                              color={estadoColor(log.estado)}
                              variant="flat"
                              className="transition-all duration-200 hover:scale-105"
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
                      color="primary"
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
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
