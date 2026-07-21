"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";
import GenericCrud from "@/components/shared/GenericCrud";
import UnidadMedidaForm, { UnidadMedida } from "./UnidadMedidaForm";
import StatusBadge from "@/components/shared/StatusBadge";
import DetailField from "@/components/shared/DetailField";
import DetailPanel from "@/components/shared/DetailPanel";
import {
  ToggleStatusButton,
  EditButton,
} from "@/components/shared/TableActions";
import { BulkCambiarEstadoModal } from "@/components/shared/BulkCambiarEstadoModal";

async function bulkPatchUnidadesMedidas(
  ids: (number | string)[],
  data: { EstaEliminado?: boolean; Descripcion?: string },
) {
  for (const id of ids) {
    const res = await fetch("/api/unidades-medidas", {
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

export default function UnidadMedidaCRUD() {
  const queryClient = useQueryClient();
  const [bulkEstadoModal, setBulkEstadoModal] = useState<{
    open: boolean;
    items: UnidadMedida[];
    clearSelection?: () => void;
  }>({ open: false, items: [] });
  const [togglingId, setTogglingId] = useState<number | string | null>(null);

  const invalidateUnidadesMedidas = () => {
    queryClient.invalidateQueries({ queryKey: ["unidades-medidas-generic"] });
  };

  const handleToggleEstado = async (item: UnidadMedida) => {
    setTogglingId(item.Id);
    try {
      await bulkPatchUnidadesMedidas([item.Id], {
        EstaEliminado: !item.EstaEliminado,
      });
      addToast({
        title: "Estado actualizado",
        description: `Unidad de medida ${item.EstaEliminado ? "activada" : "desactivada"} correctamente`,
        color: "success",
      });
      invalidateUnidadesMedidas();
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
      <GenericCrud<UnidadMedida>
        apiPath="/api/unidades-medidas"
        enableInactiveFilter
        enableHardDelete
        showBulkSoftDelete={false}
        queryKey="unidades-medidas-generic"
        title="Gestión de Unidades de Medida"
        searchPlaceholder="Buscar unidades de medida..."
        FormComponent={UnidadMedidaForm}
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
        getRowPreviewTitle={(item) => item.Descripcion || "Unidad de medida"}
        enableBulkActions
        exportConfig={{
          filename: "unidades-medida",
          columns: [
            { key: "Id", header: "ID" },
            { key: "Descripcion", header: "Descripción" },
            { key: "Productos", header: "Productos" },
            { key: "Estado", header: "Estado" },
          ],
          mapItem: (u) => ({
            Id: u.Id,
            Descripcion: u.Descripcion ?? "",
            Productos: u.CantidadProductos ?? 0,
            Estado: u.EstaEliminado ? "Inactivo" : "Activo",
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
                    label={`Editar ${item.Descripcion || "unidad de medida"}`}
                  />
                  <ToggleStatusButton
                    isInactive={!!item.EstaEliminado}
                    isDisabled={togglingId === item.Id}
                    onPress={() => handleToggleEstado(item)}
                    label={`${item.EstaEliminado ? "Activar" : "Desactivar"} ${item.Descripcion || "unidad de medida"}`}
                  />
                </div>
              );
            default:
              return null;
          }
        }}
      />

      <BulkCambiarEstadoModal<UnidadMedida>
        isOpen={bulkEstadoModal.open}
        onClose={() => setBulkEstadoModal({ open: false, items: [] })}
        items={bulkEstadoModal.items}
        entityLabel="unidad de medida"
        getCurrentEstado={(u) => !!u.EstaEliminado}
        onConfirm={async (ids, nuevoEstado) => {
          await bulkPatchUnidadesMedidas(ids, { EstaEliminado: !nuevoEstado });
        }}
        onSuccess={() => {
          bulkEstadoModal.clearSelection?.();
          invalidateUnidadesMedidas();
        }}
      />
    </>
  );
}
