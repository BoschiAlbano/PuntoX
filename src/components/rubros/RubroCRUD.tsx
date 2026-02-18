"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import GenericCrud from "@/components/shared/GenericCrud";
import RubroForm, { Rubro } from "./RubroForm";
import { Chip, addToast } from "@heroui/react";
import { DeleteButton, EditButton } from "@/components/shared/TableActions";
import { BulkCambiarEstadoModal } from "@/components/shared/BulkCambiarEstadoModal";
import { BulkEditarCamposModal } from "@/components/shared/BulkEditarCamposModal";
import { exportToCsv } from "@/lib/utils/exportCsv";

async function bulkPatchRubros(
  ids: (number | string)[],
  data: { EstaEliminado?: boolean; Descripcion?: string }
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
  const [bulkEditarModal, setBulkEditarModal] = useState<{
    open: boolean;
    items: Rubro[];
    clearSelection?: () => void;
  }>({ open: false, items: [] });

  const invalidateRubros = () => {
    queryClient.invalidateQueries({ queryKey: ["rubros-generic"] });
  };

  return (
    <>
      <GenericCrud<Rubro>
      apiPath="/api/rubros"
      queryKey="rubros-generic"
      searchPlaceholder="Buscar rubros..."
      FormComponent={RubroForm}
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
      getRowPreviewTitle={(item) => item.Descripcion || "Rubro"}
      enableBulkActions
      bulkActionsDropdown={[
        {
          key: "cambiar-estado",
          label: "Cambiar estado",
          onAction: (items, { clearSelection }) => {
            setBulkEstadoModal({ open: true, items, clearSelection });
          },
        },
        {
          key: "editar-campos",
          label: "Editar campos comunes",
          onAction: (items, { clearSelection }) => {
            setBulkEditarModal({ open: true, items, clearSelection });
          },
        },
        {
          key: "exportar",
          label: "Exportar seleccionados",
          onAction: (items) => {
            const data = items.map((r) => ({
              Id: r.Id,
              Descripcion: r.Descripcion ?? "",
              Estado: r.EstaEliminado ? "Inactivo" : "Activo",
            }));
            exportToCsv(
              data,
              [
                { key: "Id", header: "ID" },
                { key: "Descripcion", header: "Descripción" },
                { key: "Estado", header: "Estado" },
              ],
              "rubros"
            );
            addToast({
              title: "Exportado",
              description: `${items.length} rubro${items.length !== 1 ? "s" : ""} exportado${items.length !== 1 ? "s" : ""}`,
              color: "success",
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
                  label={`Editar ${item.Descripcion || "rubro"}`}
                />
                <DeleteButton
                  onPress={() => actions.onDelete(item)}
                  label={`Eliminar ${item.Descripcion || "rubro"}`}
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

      <BulkEditarCamposModal<Rubro>
        isOpen={bulkEditarModal.open}
        onClose={() => setBulkEditarModal({ open: false, items: [] })}
        items={bulkEditarModal.items}
        entityLabel="rubro"
        fields={[
          {
            key: "Descripcion",
            label: "Descripción",
            type: "text",
            placeholder: "Ej: Bebidas",
          },
        ]}
        onConfirm={async (ids, values) => {
          await bulkPatchRubros(ids, values);
        }}
        onSuccess={() => {
          bulkEditarModal.clearSelection?.();
          invalidateRubros();
        }}
      />
    </>
  );
}
