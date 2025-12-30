"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePagePermission } from "@/lib/permissions/usePagePermission";
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
import { Search, Filter, DollarSign, TrendingUp, Package, Users, Receipt, Percent, ShoppingCart, Store } from "lucide-react";
import { useKPIs, useGraficas, useAlertas, useComplementarios } from "@/hooks/useAnaliticas";
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

  // Filtros para dashboard
  const [periodo, setPeriodo] = useState<"semanal" | "mensual">("mensual");
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [agrupacion, setAgrupacion] = useState<"dia" | "semana" | "mes">("dia");

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

  // Calcular fechas por defecto según período
  useEffect(() => {
    if (!fechaDesde || !fechaHasta) {
      const hoy = new Date();
      const diasAtras = periodo === "semanal" ? 7 : 30;
      const desde = new Date(hoy.getTime() - diasAtras * 24 * 60 * 60 * 1000);
      setFechaDesde(desde.toISOString().split("T")[0]);
      setFechaHasta(hoy.toISOString().split("T")[0]);
    }
  }, [periodo, fechaDesde, fechaHasta]);

  // Hooks para datos
  const { data: kpisData, isLoading: kpisLoading } = useKPIs({
    fechaDesde,
    fechaHasta,
    periodo,
  });

  const { data: graficasIngresos, isLoading: ingresosLoading } = useGraficas({
    tipo: "ingresos",
    fechaDesde,
    fechaHasta,
    agrupacion,
  });

  const { data: graficasPagos, isLoading: pagosLoading } = useGraficas({
    tipo: "pagos",
    fechaDesde,
    fechaHasta,
  });

  const { data: graficasProductos, isLoading: productosLoading } = useGraficas({
    tipo: "productos",
    fechaDesde,
    fechaHasta,
  });

  const { data: alertasData, isLoading: alertasLoading } = useAlertas({});

  const { data: complementariosData } = useComplementarios({
    fechaDesde,
    fechaHasta,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analíticas</h1>
        <p className="text-gray-600 mt-2">
          Visualiza métricas, reportes y logs de actividad del sistema
        </p>
      </div>

      <Tabs
        aria-label="Analíticas"
        color="primary"
        variant="underlined"
        defaultSelectedKey={initialTab}
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary",
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
            <Card className="shadow-sm">
              <CardBody className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <Select
                    size="sm"
                    label="Período"
                    selectedKeys={[periodo]}
                    onChange={(e) => setPeriodo(e.target.value as "semanal" | "mensual")}
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
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full md:min-w-[140px]"
                  />
                  <Input
                    size="sm"
                    type="date"
                    label="Hasta"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full md:min-w-[140px]"
                  />
                  <Select
                    size="sm"
                    label="Agrupación"
                    selectedKeys={[agrupacion]}
                    onChange={(e) => setAgrupacion(e.target.value as "dia" | "semana" | "mes")}
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
              <Card className="shadow-sm">
                <CardBody className="p-6">
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
                    value={kpisData.kpis.estadoCaja.estaAbierta ? "Abierta" : "Cerrada"}
                    format="custom"
                    icon={<Store size={24} />}
                    color={kpisData.kpis.estadoCaja.estaAbierta ? "success" : "default"}
                  />
                )}
              </div>
            ) : null}

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ingresosLoading ? (
                <Card className="shadow-sm">
                  <CardBody className="p-6">
                    <p className="text-gray-500">Cargando gráfica de ingresos...</p>
                  </CardBody>
                </Card>
              ) : graficasIngresos ? (
                <GraficaIngresos datos={graficasIngresos.datos} />
              ) : null}

              {pagosLoading ? (
                <Card className="shadow-sm">
                  <CardBody className="p-6">
                    <p className="text-gray-500">Cargando gráfica de pagos...</p>
                  </CardBody>
                </Card>
              ) : graficasPagos ? (
                <GraficaPagos datos={graficasPagos.datos} />
              ) : null}
            </div>

            {productosLoading ? (
              <Card className="shadow-sm">
                <CardBody className="p-6">
                  <p className="text-gray-500">Cargando gráfica de productos...</p>
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
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Gastos y Caja
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Gastos:</span>
                          <span className="text-lg font-semibold">
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: "ARS",
                            }).format(complementariosData.gastos.total)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Ganancia:</span>
                          <span className="text-lg font-semibold text-green-600">
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: "ARS",
                            }).format(complementariosData.gastos.totalGanancia)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Eficiencia:</span>
                          <Chip
                            size="sm"
                            color={complementariosData.gastos.eficiencia >= 50 ? "success" : "warning"}
                            variant="flat"
                          >
                            {complementariosData.gastos.eficiencia.toFixed(1)}%
                          </Chip>
                        </div>
                        <Divider />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Gastos por Concepto:
                          </p>
                          <div className="space-y-2">
                            {complementariosData.gastos.porConcepto.slice(0, 5).map((gasto, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{gasto.concepto}</span>
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
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Usuarios Activos
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Activos Ahora:</span>
                          <Chip size="sm" color="success" variant="flat">
                            {complementariosData.usuarios.activosAhora}
                          </Chip>
                        </div>
                        {complementariosData.usuarios.dispositivosNoConfiables.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Dispositivos No Confiables:
                            </p>
                            <div className="space-y-2">
                              {complementariosData.usuarios.dispositivosNoConfiables.map((d) => (
                                <div key={d.id} className="text-sm p-2 rounded border border-yellow-200 bg-yellow-50">
                                  <p className="font-medium">{d.usuario}</p>
                                  <p className="text-xs text-gray-500">{d.dispositivo || "Desconocido"}</p>
                                </div>
                              ))}
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
          <Card className="mt-6 shadow-sm border border-slate-200">
            <CardHeader className="flex flex-col gap-4 pb-3">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm text-gray-500">Auditoría</p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Logs de actividad
                  </h3>
                </div>
                <Chip size="sm" variant="flat" color="warning">
                  {logsFiltrados.length} registros
                </Chip>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full">
                <Input
                  size="sm"
                  placeholder="Buscar por usuario..."
                  startContent={<Search size={16} className="text-gray-400" />}
                  value={filtros.usuario}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, usuario: e.target.value }))
                  }
                  className="w-full md:max-w-xs"
                />
                <Select
                  size="sm"
                  label="Módulo"
                  selectedKeys={[filtros.modulo]}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, modulo: e.target.value }))
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
                    setFiltros((prev) => ({ ...prev, accion: e.target.value }))
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
                >
                  Filtrar
                </Button>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="p-0">
              {/* TODO: Reemplazar con datos reales del API */}
              <Table aria-label="Tabla de logs">
                <TableHeader>
                  <TableColumn>FECHA</TableColumn>
                  <TableColumn>USUARIO</TableColumn>
                  <TableColumn>ACCIÓN</TableColumn>
                  <TableColumn>MÓDULO</TableColumn>
                  <TableColumn>IP</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No se encontraron logs">
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.fecha}</TableCell>
                      <TableCell>{log.usuario}</TableCell>
                      <TableCell>{log.accion}</TableCell>
                      <TableCell>{log.modulo}</TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">{log.ip}</span>
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
  );
}

export default function Analiticas() {
  usePagePermission(); // Proteger página con permisos
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <AnaliticasContent />
    </Suspense>
  );
}
