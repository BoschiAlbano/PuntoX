"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import GenericCrud from "@/components/shared/GenericCrud";
import ListaPrecioForm from "./ListaPrecioForm";
import { ListaPrecio } from "@/lib/validations/lista-precio.schema";
import { Chip, addToast } from "@heroui/react";
import { ToggleStatusButton, EditButton } from "../shared/TableActions";
import { BulkCambiarEstadoModal } from "@/components/shared/BulkCambiarEstadoModal";

async function bulkPatchListas(
  ids: (number | string)[],
  data: { EstaEliminado?: boolean; Activa?: boolean },
) {
  for (const id of ids) {
    const res = await fetch("/api/listas-precios", {
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

export default function ListaPrecioCRUD() {
  const queryClient = useQueryClient();
  const [bulkEstadoModal, setBulkEstadoModal] = useState<{
    open: boolean;
    items: ListaPrecio[];
    clearSelection?: () => void;
  }>({ open: false, items: [] });
  const [togglingId, setTogglingId] = useState<number | string | null>(null);

  const invalidateListas = () => {
    queryClient.invalidateQueries({ queryKey: ["listas-precios-generic"] });
  };

  // Toggle de EstaEliminado (archivar/restaurar), independiente del campo
  // "Activa" que ya maneja su propio "Cambiar estado" más abajo.
  const handleToggleEliminado = async (item: ListaPrecio) => {
    setTogglingId(item.Id);
    try {
      await bulkPatchListas([item.Id], { EstaEliminado: !item.EstaEliminado });
      addToast({
        title: "Estado actualizado",
        description: `Lista de precio ${item.EstaEliminado ? "restaurada" : "archivada"} correctamente`,
        color: "success",
      });
      invalidateListas();
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
      <GenericCrud<ListaPrecio>
        apiPath="/api/listas-precios"
        enableInactiveFilter
        enableHardDelete
        showBulkSoftDelete={false}
        queryKey="listas-precios-generic"
        title="Gestión de Listas de Precios"
        searchPlaceholder="Buscar listas de precios..."
        FormComponent={ListaPrecioForm}
        renderRowPreview={(item) => (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Nombre</p>
              <p className="font-medium text-slate-800">{item.Nombre}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">
                Artículos Asignados
              </p>
              <p className="font-medium text-slate-800">
                {(item.CantidadArticulos ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Por Defecto</p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  item.PorDefecto
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {item.PorDefecto ? "Sí" : "No"}
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Estado</p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  !item.Activa
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {!item.Activa ? "Inactivo" : "Activo"}
              </span>
            </div>
          </div>
        )}
        getRowPreviewTitle={(item) => item.Nombre || "Lista de Precio"}
        enableBulkActions
        exportConfig={{
          filename: "listas_precios",
          columns: [
            { key: "Id", header: "ID" },
            { key: "Nombre", header: "Nombre" },
            { key: "Articulos", header: "Artículos" },
            { key: "PorDefecto", header: "Por Defecto" },
            { key: "Estado", header: "Estado" },
          ],
          mapItem: (l) => ({
            Id: l.Id,
            Nombre: l.Nombre ?? "",
            Articulos: l.CantidadArticulos ?? 0,
            PorDefecto: l.PorDefecto ? "Sí" : "No",
            Estado: l.Activa ? "Activo" : "Inactivo",
          }),
        }}
        bulkActionsDropdown={[
          {
            key: "cambiar-estado",
            label: "Cambiar estado (Activa/Inactiva)",
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
            uid: "Nombre",
            name: "NOMBRE",
            sortable: true,
            align: "start",
          },
          {
            uid: "PorDefecto",
            name: "POR DEFECTO",
            align: "center",
          },
          { uid: "Estado", name: "ESTADO" },
          { uid: "acciones", name: "ACCIONES" },
        ]}
        renderCell={(item, columnKey, actions) => {
          switch (columnKey) {
            case "Nombre":
              return (
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  {item.Nombre}
                  {item.EstaEliminado && (
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">
                      Archivada
                    </span>
                  )}
                </span>
              );
            case "PorDefecto":
              return (
                <Chip
                  color={item.PorDefecto ? "primary" : "default"}
                  variant="flat"
                  size="sm"
                >
                  {item.PorDefecto ? "Sí" : "No"}
                </Chip>
              );
            case "Estado":
              return (
                <Chip
                  color={!item.Activa ? "danger" : "success"}
                  variant="flat"
                  size="sm"
                >
                  {!item.Activa ? "Inactiva" : "Activa"}
                </Chip>
              );
            case "acciones":
              return (
                <div className="flex sm:gap-2 gap-0 w-full justify-center items-center">
                  <EditButton
                    onPress={() => actions.onEdit(item)}
                    label={`Editar ${item.Nombre}`}
                  />
                  <ToggleStatusButton
                    isInactive={!!item.EstaEliminado}
                    isDisabled={togglingId === item.Id}
                    onPress={() => handleToggleEliminado(item)}
                    label={`${item.EstaEliminado ? "Restaurar" : "Archivar"} ${item.Nombre}`}
                    tooltipContent={item.EstaEliminado ? "Restaurar" : "Archivar"}
                  />
                </div>
              );
            default:
              return null;
          }
        }}
      />

      <BulkCambiarEstadoModal<ListaPrecio>
        isOpen={bulkEstadoModal.open}
        onClose={() => setBulkEstadoModal({ open: false, items: [] })}
        items={bulkEstadoModal.items}
        entityLabel="lista de precio"
        getCurrentEstado={(l) => !l.Activa} // Mostramos inactivo o activo en base al reverso de Activa en este modal generico
        onConfirm={async (ids, nuevoEstado) => {
          // El modal asume EstaEliminado, lo estamos adaptando
          // nuevoEstado = true -> lo queremos poner Activa = false
          // nuevoEstado = false -> lo queremos poner Activa = true
          await bulkPatchListas(ids, { Activa: !nuevoEstado });
        }}
        onSuccess={() => {
          bulkEstadoModal.clearSelection?.();
          invalidateListas();
        }}
      />
    </>
  );
}
