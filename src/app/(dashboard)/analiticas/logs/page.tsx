"use client";

import { useState, useMemo } from "react";
import {
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
} from "@heroui/react";
import { Search, FileText } from "lucide-react";
import { motion } from "framer-motion";
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

// ─── Mock logs ────────────────────────────────────────────────────────────────
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

function estadoBadge(estado: string) {
  if (estado === "success")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        OK
      </span>
    );
  if (estado === "error")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-rose-50 text-rose-600 border border-rose-100 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Error
      </span>
    );
  if (estado === "warning")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-amber-50 text-amber-600 border border-amber-100 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Alerta
      </span>
    );
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase">
      {estado}
    </span>
  );
}

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

export default function AnaliticasLogsPage() {
  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    usuario: "",
    accion: "Todas",
    modulo: "Todos",
  });
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const logsFiltrados = useMemo(
    () =>
      mockLogs.filter((log) => {
        const matchUsuario =
          !filtros.usuario ||
          log.usuario.toLowerCase().includes(filtros.usuario.toLowerCase());
        const matchAccion =
          filtros.accion === "Todas" || log.accion === filtros.accion;
        const matchModulo =
          filtros.modulo === "Todos" || log.modulo === filtros.modulo;
        return matchUsuario && matchAccion && matchModulo;
      }),
    [filtros],
  );

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return logsFiltrados.slice(start, start + rowsPerPage);
  }, [logsFiltrados, page]);

  const totalPages = Math.ceil(logsFiltrados.length / rowsPerPage);

  return (
    <div className="max-w-[1400px] mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Logs de"
        accentTitle="Actividad"
        description="Consulta y filtra el registro histórico de todas las acciones del sistema."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-hidden relative flex flex-col pt-2"
      >
        <div className="space-y-5">
          <Panel
            title="Filtros de búsqueda"
            icon={Search}
            action={
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {logsFiltrados.length} registros
              </span>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Búsqueda usuario */}
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 h-10 bg-slate-50/50 focus-within:border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20 transition-all">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  className="outline-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 w-full font-medium"
                  value={filtros.usuario}
                  onChange={(e) =>
                    setFiltros((p) => ({ ...p, usuario: e.target.value }))
                  }
                />
              </div>
              <Select
                size="sm"
                label="Módulo"
                variant="bordered"
                classNames={selectCls}
                selectedKeys={[filtros.modulo]}
                onChange={(e) =>
                  setFiltros((p) => ({ ...p, modulo: e.target.value }))
                }
              >
                {modulosDisponibles.map((m) => (
                  <SelectItem key={m}>{m}</SelectItem>
                ))}
              </Select>
              <Select
                size="sm"
                label="Acción"
                variant="bordered"
                classNames={selectCls}
                selectedKeys={[filtros.accion]}
                onChange={(e) =>
                  setFiltros((p) => ({ ...p, accion: e.target.value }))
                }
              >
                {accionesDisponibles.map((a) => (
                  <SelectItem key={a}>{a}</SelectItem>
                ))}
              </Select>
              <Input
                size="sm"
                type="date"
                label="Desde"
                variant="bordered"
                classNames={inputCls}
                value={filtros.fechaDesde}
                onChange={(e) =>
                  setFiltros((p) => ({ ...p, fechaDesde: e.target.value }))
                }
              />
              <Input
                size="sm"
                type="date"
                label="Hasta"
                variant="bordered"
                classNames={inputCls}
                value={filtros.fechaHasta}
                onChange={(e) =>
                  setFiltros((p) => ({ ...p, fechaHasta: e.target.value }))
                }
              />
            </div>
          </Panel>

          {/* Tabla */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm overflow-hidden">
            <Table
              aria-label="Tabla de logs de actividad"
              classNames={{
                wrapper:
                  "bg-transparent p-0 border-none shadow-none rounded-none",
                th: "bg-[#67afc3]/5 text-slate-500 font-bold uppercase tracking-wider text-[11px] py-4 first:rounded-none last:rounded-none",
                td: "py-3.5 px-4 border-b border-slate-50 text-sm",
                tr: "hover:bg-[#67afc3]/3 transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn>Fecha</TableColumn>
                <TableColumn>Usuario</TableColumn>
                <TableColumn>Acción</TableColumn>
                <TableColumn>Módulo</TableColumn>
                <TableColumn>IP</TableColumn>
                <TableColumn>Estado</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={
                  <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                    <FileText size={32} strokeWidth={1.5} />
                    <p className="text-sm font-medium">
                      No se encontraron registros
                    </p>
                  </div>
                }
              >
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="text-[11px] font-mono text-slate-500">
                        {log.fecha}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-slate-700">
                        {log.usuario}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600">{log.accion}</span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wide">
                        {log.modulo}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-mono text-slate-400">
                        {log.ip}
                      </span>
                    </TableCell>
                    <TableCell>{estadoBadge(log.estado)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center py-4 border-t border-slate-50">
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
          </div>
        </div>
      </motion.div>
    </div>
  );
}
