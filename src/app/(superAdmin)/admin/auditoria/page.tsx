"use client";

import { useState, useMemo, Key } from "react";
import { Chip, Select, SelectItem, Tooltip, Button } from "@heroui/react";
import {
  Shield,
  AlertTriangle,
  Info,
  AlertCircle,
  Eye,
  Building2,
  User,
  Globe,
} from "lucide-react";
import GenericCrud, { CrudActions } from "@/components/shared/GenericCrud";
import { Column } from "@/components/shared/GenericTable";

// Dummy form component since audit log is read-only (GenericCrud requires it)
function DummyForm() {
  return null;
}

type AuditEntry = {
  Id: number;
  Fecha: string;
  Accion: string;
  Detalle: string;
  Severidad: string;
  IpAddress: string;
  TenantNombre: string;
  TenantId: number;
  UsuarioNombre: string;
  UsuarioAfectado: string;
};

const columns: Column[] = [
  { uid: "Fecha", name: "Fecha", sortable: true },
  { uid: "TenantNombre", name: "Tienda", sortable: true },
  { uid: "UsuarioNombre", name: "Usuario", sortable: true },
  { uid: "Accion", name: "Acción", sortable: true },
  { uid: "Detalle", name: "Detalle", sortable: false },
  { uid: "Severidad", name: "Severidad", sortable: true },
];

const severidadColors: Record<
  string,
  "success" | "warning" | "danger" | "default"
> = {
  INFO: "success",
  WARNING: "warning",
  CRITICAL: "danger",
};

const severidadIcons: Record<string, React.ReactNode> = {
  INFO: <Info className="w-3 h-3" />,
  WARNING: <AlertTriangle className="w-3 h-3" />,
  CRITICAL: <AlertCircle className="w-3 h-3" />,
};

function renderCell(
  item: AuditEntry,
  columnKey: Key,
  _actions: CrudActions<AuditEntry>,
) {
  switch (columnKey) {
    case "Fecha":
      return (
        <span className="text-sm text-slate-700 whitespace-nowrap">
          {new Date(item.Fecha).toLocaleString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      );

    case "TenantNombre":
      return (
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-sm font-medium text-slate-700 truncate max-w-32">
            {item.TenantNombre}
          </span>
        </div>
      );

    case "UsuarioNombre":
      return (
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-sm text-slate-700">{item.UsuarioNombre}</span>
        </div>
      );

    case "Accion":
      return (
        <span className="text-sm font-medium text-slate-800">
          {item.Accion}
        </span>
      );

    case "Detalle":
      return (
        <Tooltip content={item.Detalle || "Sin detalle"} placement="top">
          <p className="text-sm text-slate-600 max-w-xs truncate cursor-default">
            {item.Detalle || "—"}
          </p>
        </Tooltip>
      );

    case "Severidad":
      return (
        <Chip
          size="sm"
          variant="flat"
          color={severidadColors[item.Severidad] || "default"}
          startContent={severidadIcons[item.Severidad]}
        >
          {item.Severidad}
        </Chip>
      );

    default:
      return null;
  }
}

export default function AuditoriaPage() {
  const [severidad, setSeveridad] = useState("todos");

  const extraParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (severidad !== "todos") params.severidad = severidad;
    return params;
  }, [severidad]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          size="sm"
          label="Severidad"
          selectedKeys={[severidad]}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            setSeveridad(value || "todos");
          }}
          className="w-40"
          aria-label="Filtrar por severidad"
        >
          <SelectItem key="todos">Todos</SelectItem>
          <SelectItem key="INFO">Info</SelectItem>
          <SelectItem key="WARNING">Warning</SelectItem>
          <SelectItem key="CRITICAL">Crítico</SelectItem>
        </Select>
      </div>

      <GenericCrud<AuditEntry>
        apiPath="/api/admin/auditoria"
        queryKey="admin-auditoria"
        columns={columns}
        renderCell={renderCell}
        FormComponent={DummyForm as any}
        searchPlaceholder="Buscar acciones, detalles..."
        initialLimit={20}
        getApiExtraParams={() => extraParams}
        exportConfig={{
          filename: "auditoria_global",
          columns: [
            { key: "Fecha", header: "Fecha" },
            { key: "TenantNombre", header: "Tienda" },
            { key: "UsuarioNombre", header: "Usuario" },
            { key: "Accion", header: "Acción" },
            { key: "Detalle", header: "Detalle" },
            { key: "Severidad", header: "Severidad" },
          ],
          mapItem: (item) => ({
            Fecha: new Date(item.Fecha).toLocaleString("es-AR"),
            TenantNombre: item.TenantNombre,
            UsuarioNombre: item.UsuarioNombre,
            Accion: item.Accion,
            Detalle: item.Detalle,
            Severidad: item.Severidad,
          }),
        }}
      />
    </div>
  );
}
