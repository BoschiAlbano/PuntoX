"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import GenericCrud from "@/components/shared/GenericCrud";
import UnidadMedidaForm, { UnidadMedida } from "./UnidadMedidaForm";
import { Chip, addToast } from "@heroui/react";
import { DeleteButton, EditButton } from "@/components/shared/TableActions";
import { BulkCambiarEstadoModal } from "@/components/shared/BulkCambiarEstadoModal";


async function bulkPatchUnidadesMedidas(
  ids: (number | string)[],
  data: { EstaEliminado?: boolean; Descripcion?: string }
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


  const invalidateUnidadesMedidas = () => {
    queryClient.invalidateQueries({ queryKey: ["unidades-medidas-generic"] });
  };

  return (
    <>
      <GenericCrud<UnidadMedida>
      apiPath="/api/unidades-medidas"
      queryKey="unidades-medidas-generic"
      title="Gestión de Unidades de Medida"
      searchPlaceholder="Buscar unidades de medida..."
      FormComponent={UnidadMedidaForm}
      renderRowPreview={(item) => (
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Descripción</p>
            <p className="font-medium text-slate-800">{item.Descripcion}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Estado</p>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                item.EstaEliminado ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
            >
              {item.EstaEliminado ? "Inactivo" : "Activo"}
            </span>
          </div>
        </div>
      )}
      getRowPreviewTitle={(item) => item.Descripcion || "Unidad de medida"}
      enableBulkActions
      exportConfig={{
        filename: "unidades-medida",
        columns: [
          { key: "Id", header: "ID" },
          { key: "Descripcion", header: "Descripción" },
          { key: "Estado", header: "Estado" },
        ],
        mapItem: (u) => ({
          Id: u.Id,
          Descripcion: u.Descripcion ?? "",
          Estado: u.EstaEliminado ? "Inactivo" : "Activo",
        }),
      }}
      bulkActionsDropdown={[
        {
          key: "cambiar-estado",
          label: "Cambiar estado",
          onAction: (ctx) => {
            setBulkEstadoModal({ open: true, items: ctx.items, clearSelection: ctx.clearSelection });
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
        { uid: "Estado", name: "ESTADO" },
        { uid: "acciones", name: "ACCIONES" },
      ]}
      // Función para renderizar celdas personalizadas
      renderCell={(item, columnKey, actions) => {
        switch (columnKey) {
          case "Id":
            return item.Id;
          case "Descripcion":
            return (
              <span className="font-medium text-gray-700">
                {item.Descripcion}
              </span>
            );
          case "Estado":
            return (
              <Chip
                color={item.EstaEliminado ? "danger" : "success"}
                variant="flat"
                size="sm"
              >
                {item.EstaEliminado ? "Inactivo" : "Activo"}
              </Chip>
            );
          case "acciones":
            return (
              <div className="flex gap-2 w-full justify-center items-center">
                <EditButton
                  onPress={() => actions.onEdit(item)}
                  label={`Editar ${item.Descripcion || "unidad de medida"}`}
                />
                <DeleteButton
                  onPress={() => actions.onDelete(item)}
                  label={`Eliminar ${item.Descripcion || "unidad de medida"}`}
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
