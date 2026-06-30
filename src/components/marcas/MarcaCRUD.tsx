"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import GenericCrud from "@/components/shared/GenericCrud";
import MarcaForm, { Marca } from "./MarcaForm";
import StatusBadge from "@/components/shared/StatusBadge";
import DetailField from "@/components/shared/DetailField";
import DetailPanel from "@/components/shared/DetailPanel";
import { DeleteButton, EditButton } from "../shared/TableActions";
import { BulkCambiarEstadoModal } from "@/components/shared/BulkCambiarEstadoModal";

async function bulkPatchMarcas(
  ids: (number | string)[],
  data: { EstaEliminado?: boolean; Descripcion?: string },
) {
  for (const id of ids) {
    const res = await fetch("/api/marcas", {
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

export default function MarcaCRUD() {
  const queryClient = useQueryClient();
  const [bulkEstadoModal, setBulkEstadoModal] = useState<{
    open: boolean;
    items: Marca[];
    clearSelection?: () => void;
  }>({ open: false, items: [] });

  const invalidateMarcas = () => {
    queryClient.invalidateQueries({ queryKey: ["marcas-generic"] });
  };

  return (
    <>
      <GenericCrud<Marca>
        apiPath="/api/marcas"
        queryKey="marcas-generic"
        title="Gestión de Marcas"
        searchPlaceholder="Buscar marcas..."
        FormComponent={MarcaForm}
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
        getRowPreviewTitle={(item) => item.Descripcion || "Marca"}
        enableBulkActions
        exportConfig={{
          filename: "marcas",
          columns: [
            { key: "Id", header: "ID" },
            { key: "Descripcion", header: "Descripción" },
            { key: "Productos", header: "Productos" },
            { key: "Estado", header: "Estado" },
          ],
          mapItem: (m) => ({
            Id: m.Id,
            Descripcion: m.Descripcion ?? "",
            Productos: m.CantidadProductos ?? 0,
            Estado: m.EstaEliminado ? "Inactivo" : "Activo",
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
                    label={`Editar ${item.Descripcion || "marca"}`}
                  />
                  <DeleteButton
                    onPress={() => actions.onDelete(item)}
                    label={`Eliminar ${item.Descripcion || "marca"}`}
                  />
                </div>
              );
            default:
              return null;
          }
        }}
      />

      <BulkCambiarEstadoModal<Marca>
        isOpen={bulkEstadoModal.open}
        onClose={() => setBulkEstadoModal({ open: false, items: [] })}
        items={bulkEstadoModal.items}
        entityLabel="marca"
        getCurrentEstado={(m) => !!m.EstaEliminado}
        onConfirm={async (ids, nuevoEstado) => {
          await bulkPatchMarcas(ids, { EstaEliminado: !nuevoEstado });
        }}
        onSuccess={() => {
          bulkEstadoModal.clearSelection?.();
          invalidateMarcas();
        }}
      />
    </>
  );
}
