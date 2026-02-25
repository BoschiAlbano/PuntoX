"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import { Chip, Tooltip, addToast } from "@heroui/react";
import { exportToCsv, exportToXls } from "@/lib/utils/exportCsv";
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
      const exitoso = item.exitoso !== undefined 
        ? item.exitoso 
        : severidad !== "CRITICAL"; // Asumir exitoso excepto si es CRITICAL

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
      bulkActionsDropdown={[
        {
          key: "exportar-csv",
          label: "Exportar como CSV",
          onAction: (ctx) => {
            const data = ctx.items.map((a) => ({
              usuario: a.usuario ?? "",
              accion: a.accion ?? "",
              detalles: a.detalles ?? "",
              fechaHora: a.fechaHora ?? "",
              exitoso: a.exitoso ? "Sí" : "No",
              ipAddress: a.ipAddress ?? "",
            }));
            const columns = [
              { key: "usuario" as const, header: "Usuario" },
              { key: "accion" as const, header: "Acción" },
              { key: "detalles" as const, header: "Detalles" },
              { key: "fechaHora" as const, header: "Fecha" },
              { key: "exitoso" as const, header: "Exitoso" },
              { key: "ipAddress" as const, header: "IP" },
            ];
            exportToCsv(data, columns, "auditorias");
            addToast({
              title: "Exportado",
              description: `${ctx.items.length} auditoría${ctx.items.length !== 1 ? "s" : ""} exportada${ctx.items.length !== 1 ? "s" : ""} como CSV`,
              color: "success",
            });
            ctx.clearSelection();
          },
        },
        {
          key: "exportar-xls",
          label: "Exportar como XLS",
          onAction: (ctx) => {
            const data = ctx.items.map((a) => ({
              usuario: a.usuario ?? "",
              accion: a.accion ?? "",
              detalles: a.detalles ?? "",
              fechaHora: a.fechaHora ?? "",
              exitoso: a.exitoso ? "Sí" : "No",
              ipAddress: a.ipAddress ?? "",
            }));
            const columns = [
              { key: "usuario" as const, header: "Usuario" },
              { key: "accion" as const, header: "Acción" },
              { key: "detalles" as const, header: "Detalles" },
              { key: "fechaHora" as const, header: "Fecha" },
              { key: "exitoso" as const, header: "Exitoso" },
              { key: "ipAddress" as const, header: "IP" },
            ];
            exportToXls(data, columns, "auditorias");
            addToast({
              title: "Exportado",
              description: `${ctx.items.length} auditoría${ctx.items.length !== 1 ? "s" : ""} exportada${ctx.items.length !== 1 ? "s" : ""} como Excel`,
              color: "success",
            });
            ctx.clearSelection();
          },
        },
      ]}
      renderRowPreview={(item) => (
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Usuario</p>
            <p className="font-medium text-slate-800">{item.usuario}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Acción</p>
            <p className="font-medium">{formatearAccion({ accion: item.accion, detalle: item.detalles ?? undefined })}</p>
          </div>
          {item.detalles && (
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Detalles</p>
              <p className="text-slate-700">{item.detalles}</p>
            </div>
          )}
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Fecha</p>
            <p className="font-medium">{new Date(item.fechaHora).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Estado</p>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                item.exitoso ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {item.exitoso ? "Exitoso" : "Fallido"}
            </span>
          </div>
          {item.ipAddress && (
            <div>
              <p className="text-slate-500 text-xs mb-0.5">IP</p>
              <p className="font-mono text-xs">{item.ipAddress}</p>
            </div>
          )}
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
              <span className="font-medium text-gray-700">{item.usuario}</span>
            );
          case "accion": {
            const accionMapeada = mapearAccion(item.accion);
            const severidad = mapearSeveridad(item.accion);

            return (
              <Chip
                size="sm"
                color={
                  severidad === "danger"
                    ? "danger"
                    : severidad === "warning"
                    ? "warning"
                    : "default"
                }
                variant="flat"
              >
                {formatearAccion({
                  accion: accionMapeada.categoria,
                })}
              </Chip>
            );
          }
          case "detalles":
            return (
              <span className="text-sm text-gray-600">
                {item.detalles || "-"}
              </span>
            );
          case "fechaHora":
            return (
              <Tooltip content={new Date(item.fechaHora).toLocaleString()}>
                <span className="text-sm text-gray-600">
                  {formatTiempoRelativo(item.fechaHora)}
                </span>
              </Tooltip>
            );
          case "exitoso":
            return (
              <Chip
                size="sm"
                color={item.exitoso ? "success" : "danger"}
                variant="dot"
              >
                {item.exitoso ? "Exitoso" : "Fallido"}
              </Chip>
            );
          case "ipAddress":
            return (
              <span className="text-xs text-gray-500 font-mono">
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
