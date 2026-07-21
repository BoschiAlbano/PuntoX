"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";
import GenericCrud from "@/components/shared/GenericCrud";
import RubroForm, { Rubro } from "./RubroForm";
import StatusBadge from "@/components/shared/StatusBadge";
import DetailField from "@/components/shared/DetailField";
import DetailPanel from "@/components/shared/DetailPanel";
import {
  ToggleStatusButton,
  EditButton,
} from "@/components/shared/TableActions";
import { BulkCambiarEstadoModal } from "@/components/shared/BulkCambiarEstadoModal";

async function bulkPatchRubros(
  ids: (number | string)[],
  data: { EstaEliminado?: boolean; Descripcion?: string },
) {
  for (const id of ids) {
    const res = await fetch("/api/rubros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Id: id, ...data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || err?.message || "Error al actualizar");
    }
  }
}

export default function RubroCRUD() {
  const queryClient = useQueryClient();
  const [bulkEstadoModal, setBulkEstadoModal] = useState<{
    open: boolean;
    items: Rubro[];
    clearSelection?: () => void;
  }>({ open: false, items: [] });
  const [togglingId, setTogglingId] = useState<number | string | null>(null);

  const invalidateRubros = () => {
    queryClient.invalidateQueries({ queryKey: ["rubros-generic"] });
  };

  const handleToggleEstado = async (item: Rubro) => {
    setTogglingId(item.Id);
    try {
      await bulkPatchRubros([item.Id], { EstaEliminado: !item.EstaEliminado });
      addToast({
        title: "Estado actualizado",
        description: `Rubro ${item.EstaEliminado ? "activado" : "desactivado"} correctamente`,
        color: "success",
      });
      invalidateRubros();
    } catch (err: unknown) {
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Error al actualizar el estado",
        color: "danger",
      });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <GenericCrud<Rubro>
        apiPath="/api/rubros"
        enableInactiveFilter
        enableHardDelete
        showBulkSoftDelete={false}
        queryKey="rubros-generic"
        title="Gestión de Rubros"
        searchPlaceholder="Buscar rubros..."
        FormComponent={RubroForm}
        renderRowPreview={(item) => (
          <DetailPanel>
            <DetailField label="Descripción">{item.Descripcion}</DetailField>
            <DetailField label="Productos">
              {(item.CantidadProductos ?? 0).toLocaleString()}
            </DetailField>
            <DetailField label="Estado">
              <StatusBadge estaEliminado={item.EstaEliminado} />
            </DetailField>
          </DetailPanel>
        )}
        getRowPreviewTitle={(item) => item.Descripcion || "Rubro"}
        enableBulkActions
        exportConfig={{
          filename: "rubros",
          columns: [
            { key: "Id", header: "ID" },
            { key: "Descripcion", header: "Descripción" },
            { key: "Productos", header: "Productos" },
            { key: "Estado", header: "Estado" },
          ],
          mapItem: (r) => ({
            Id: r.Id,
            Descripcion: r.Descripcion ?? "",
            Productos: r.CantidadProductos ?? 0,
            Estado: r.EstaEliminado ? "Inactivo" : "Activo",
          }),
        }}
        bulkActionsDropdown={[
          {
            key: "cambiar-estado",
            label: "Cambiar estado",
            onAction: (ctx) => {
              setBulkEstadoModal({
                open: true,
                items: ctx.items,
                clearSelection: ctx.clearSelection,
              });
            },
          },
        ]}
        columns={[
          {
            uid: "Descripcion",
            name: "DESCRIPCIÓN",
            sortable: true,
            align: "start",
          },
          {
            uid: "CantidadProductos",
            name: "PRODUCTOS",
            align: "center",
          },
          { uid: "Estado", name: "ESTADO" },
          { uid: "acciones", name: "ACCIONES" },
        ]}
        renderCell={(item, columnKey, actions) => {
          switch (columnKey) {
            case "Descripcion":
              return (
                <span className="font-medium text-gray-700">
                  {item.Descripcion}
                </span>
              );
            case "CantidadProductos":
              return (
                <span className="text-gray-600 tabular-nums">
                  {(item.CantidadProductos ?? 0).toLocaleString()}
                </span>
              );
            case "Estado":
              return <StatusBadge estaEliminado={item.EstaEliminado} />;
            case "acciones":
              return (
                <div className="flex sm:gap-2 gap-0 w-full justify-center items-center">
                  <EditButton
                    onPress={() => actions.onEdit(item)}
                    label={`Editar ${item.Descripcion || "rubro"}`}
                  />
                  <ToggleStatusButton
                    isInactive={!!item.EstaEliminado}
                    isDisabled={togglingId === item.Id}
                    onPress={() => handleToggleEstado(item)}
                    label={`${item.EstaEliminado ? "Activar" : "Desactivar"} ${item.Descripcion || "rubro"}`}
                  />
                </div>
              );
            default:
              return null;
          }
        }}
      />

      <BulkCambiarEstadoModal<Rubro>
        isOpen={bulkEstadoModal.open}
        onClose={() => setBulkEstadoModal({ open: false, items: [] })}
        items={bulkEstadoModal.items}
        entityLabel="rubro"
        getCurrentEstado={(r) => !!r.EstaEliminado}
        onConfirm={async (ids, nuevoEstado) => {
          await bulkPatchRubros(ids, { EstaEliminado: !nuevoEstado });
        }}
        onSuccess={() => {
          bulkEstadoModal.clearSelection?.();
          invalidateRubros();
        }}
      />
    </>
  );
}
