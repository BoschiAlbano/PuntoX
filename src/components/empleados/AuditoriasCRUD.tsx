"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import { Tooltip } from "@heroui/react";

import {
  formatTiempoRelativo,
  formatearAccion,
  mapearAccion,
  mapearSeveridad,
} from "../../app/(dashboard)/empleados/auditoria-utils";

export type AuditoriaEmpleado = {
  Id: number;
  id: number;
  usuarioId: number;
  usuario: string;
  accion: string;
  detalles: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  fechaHora: string;
  exitoso: boolean;
  motivoFallo: string | null;
};

export default function AuditoriasCRUD() {
  // Transformer para adaptar la respuesta de la API
  const transformer = (data: any): AuditoriaEmpleado[] => {
    if (!Array.isArray(data)) return [];
    const transformData = data.map((item) => {
      // Inferir exitoso basándose en la severidad
      // Si la severidad es CRITICAL o WARNING, podría indicar un problema
      // Por ahora, asumimos que todas son exitosas a menos que haya un indicador específico
      const severidad = item.severidad || "INFO";
      const exitoso =
        item.exitoso !== undefined ? item.exitoso : severidad !== "CRITICAL"; // Asumir exitoso excepto si es CRITICAL

      return {
        ...item,
        Id: item.id, // Mapear id a Id para GenericCrud
        usuarioId: item.usuario?.id || item.usuarioId || 0,
        usuario: item.usuario?.nombre || item.usuario || "-",
        fechaHora: item.fecha || item.fechaHora || new Date().toISOString(),
        detalles: item.detalle || item.detalles || null,
        accion: item.accion || "",
        ipAddress: item.ipAddress || null,
        userAgent: item.userAgent || null,
        exitoso,
        motivoFallo: item.motivoFallo || null,
      };
    });

    console.log("Datos Transformados:", transformData);
    return transformData;
  };

  return (
    <GenericCrud<AuditoriaEmpleado>
      apiPath="/api/auditoria-empleados"
      queryKey="auditorias-crud"
      searchPlaceholder="Buscar por usuario, acción o IP..."
      initialLimit={10}
      transformer={transformer}
      showEditInPreview={false}
      defaultVisibleUidsMobile={["usuario", "detalles"]}
      enableBulkActions
      exportConfig={{
        filename: "auditorias",
        columns: [
          { key: "usuario", header: "Usuario" },
          { key: "accion", header: "Acción" },
          { key: "detalles", header: "Detalles" },
          { key: "fechaHora", header: "Fecha" },
          { key: "exitoso", header: "Exitoso" },
          { key: "ipAddress", header: "IP" },
        ],
        mapItem: (a) => ({
          usuario: a.usuario ?? "",
          accion: a.accion ?? "",
          detalles: a.detalles ?? "",
          fechaHora: a.fechaHora ?? "",
          exitoso: a.exitoso ? "Sí" : "No",
          ipAddress: a.ipAddress ?? "",
        }),
      }}
      bulkActionsDropdown={[]}
      renderRowPreview={(item) => (
        <div className="space-y-6 text-sm">
          <div className="p-4 rounded-xl bg-linear-to-br from-slate-50 to-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 uppercase">
              {item.usuario?.charAt(0) || "-"}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">
                {item.usuario}
              </p>
              <p className="text-slate-500 font-medium text-xs mt-0.5 font-mono">
                {item.ipAddress || "Autenticado sin IP"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                Acción
              </p>
              <span className="font-semibold text-slate-700">
                {formatearAccion({
                  accion: item.accion,
                  detalle: item.detalles ?? undefined,
                })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                Resultado
              </p>
              <span
                className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                  item.exitoso
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {item.exitoso ? "Exitoso" : "Fallido"}
              </span>
            </div>
          </div>

          {item.detalles && (
            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1.5">
                Detalles Adicionales
              </p>
              <p className="text-slate-600 font-mono text-xs break-all">
                {item.detalles}
              </p>
            </div>
          )}

          <div className="flex gap-4 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
            <div className="flex-1">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-0.5">
                Fecha y Hora
              </p>
              <p className="font-medium text-slate-700 text-xs">
                {new Date(item.fechaHora).toLocaleString()}
              </p>
            </div>
            {item.motivoFallo && (
              <div className="flex-1">
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-0.5">
                  Motivo del fallo
                </p>
                <p className="text-red-600 font-medium text-xs">
                  {item.motivoFallo}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      getRowPreviewTitle={(item) => `Auditoría - ${item.usuario}`}
      columns={[
        { uid: "usuario", name: "USUARIO", sortable: true },
        { uid: "accion", name: "ACCIÓN", sortable: false },
        { uid: "detalles", name: "DETALLES", sortable: false },
        { uid: "fechaHora", name: "FECHA", sortable: true },
        { uid: "exitoso", name: "ESTADO", sortable: false },
        { uid: "ipAddress", name: "IP", sortable: false },
      ]}
      renderCell={(item, columnKey) => {
        switch (columnKey) {
          case "usuario":
            return (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0 uppercase">
                  {item.usuario?.charAt(0) || "-"}
                </div>
                <span className="font-semibold text-slate-800">
                  {item.usuario}
                </span>
              </div>
            );
          case "accion": {
            const accionMapeada = mapearAccion(item.accion);
            const severidad = mapearSeveridad(item.accion);
            const estiloSeveridad =
              severidad === "danger"
                ? "bg-red-50 text-red-600 border border-red-100"
                : severidad === "warning"
                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                  : "bg-slate-50 text-slate-600 border border-slate-200";

            return (
              <span
                className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase shadow-sm ${estiloSeveridad}`}
              >
                {formatearAccion({ accion: accionMapeada.categoria })}
              </span>
            );
          }
          case "detalles":
            return item.detalles ? (
              <Tooltip
                content={item.detalles}
                classNames={{
                  content:
                    "bg-[#0F2233] text-white text-xs max-w-[320px] whitespace-pre-wrap shadow-lg",
                }}
                placement="top-start"
                delay={300}
              >
                <span className="text-xs text-slate-500 font-medium truncate max-w-[150px] inline-block cursor-help">
                  {item.detalles}
                </span>
              </Tooltip>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            );
          case "fechaHora":
            return (
              <Tooltip
                content={new Date(item.fechaHora).toLocaleString("es-AR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
                classNames={{
                  content:
                    "bg-[#0F2233] text-white text-xs shadow-lg capitalize",
                }}
                placement="top"
                delay={300}
              >
                <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1.5 rounded-md cursor-help border border-slate-100">
                  {formatTiempoRelativo(item.fechaHora)}
                </span>
              </Tooltip>
            );
          case "exitoso":
            return (
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                  item.exitoso
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${item.exitoso ? "bg-emerald-500" : "bg-red-500"}`}
                ></span>
                {item.exitoso ? "Exitoso" : "Fallido"}
              </span>
            );
          case "ipAddress":
            return (
              <span className="text-[11px] text-slate-400 font-mono font-medium">
                {item.ipAddress || "-"}
              </span>
            );
          default:
            return null;
        }
      }}
      // No usamos FormComponent porque las auditorías son solo lectura
      FormComponent={() => null as any}
    />
  );
}
