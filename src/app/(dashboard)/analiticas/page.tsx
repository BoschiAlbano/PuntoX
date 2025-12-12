"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { Search, Filter } from "lucide-react";

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

  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    usuario: "",
    accion: "Todas",
    modulo: "Todos",
  });

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

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
          <Card className="mt-6 shadow-sm border border-slate-200">
            <CardBody className="p-6">
              <p className="text-gray-600">
                Dashboard de analíticas (en desarrollo)
              </p>
            </CardBody>
          </Card>
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
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <AnaliticasContent />
    </Suspense>
  );
}
