"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import { Chip, Tooltip } from "@heroui/react";
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

    return transformData;
  };

  return (
    <GenericCrud<AuditoriaEmpleado>
      apiPath="/api/auditoria-empleados"
      queryKey="auditorias-crud"
      searchPlaceholder="Buscar por usuario, acción o IP..."
      initialLimit={10}
      transformer={transformer}
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
