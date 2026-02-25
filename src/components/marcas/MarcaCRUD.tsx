"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import GenericCrud from "@/components/shared/GenericCrud";
import MarcaForm, { Marca } from "./MarcaForm";
import { Chip, addToast } from "@heroui/react";
import { DeleteButton, EditButton } from "../shared/TableActions";
import { BulkCambiarEstadoModal } from "@/components/shared/BulkCambiarEstadoModal";
import { BulkEditarCamposModal } from "@/components/shared/BulkEditarCamposModal";
import { exportToCsv, exportToXls } from "@/lib/utils/exportCsv";

async function bulkPatchMarcas(
  ids: (number | string)[],
  data: { EstaEliminado?: boolean; Descripcion?: string }
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
  const [bulkEditarModal, setBulkEditarModal] = useState<{
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
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Descripción</p>
            <p className="font-medium text-slate-800">{item.Descripcion}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Productos</p>
            <p className="font-medium text-slate-800">
              {(item.CantidadProductos ?? 0).toLocaleString()}
            </p>
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
            setBulkEstadoModal({ open: true, items: ctx.items, clearSelection: ctx.clearSelection });
          },
        },
        {
          key: "editar-campos",
          label: "Editar campos comunes",
          onAction: (ctx) => {
            setBulkEditarModal({ open: true, items: ctx.items, clearSelection: ctx.clearSelection });
          },
        },
        {
          key: "exportar-csv",
          label: "Exportar como CSV",
          onAction: (ctx) => {
            const data = ctx.items.map((m) => ({
              Id: m.Id,
              Descripcion: m.Descripcion ?? "",
              Productos: m.CantidadProductos ?? 0,
              Estado: m.EstaEliminado ? "Inactivo" : "Activo",
            }));
            const columns = [
              { key: "Id" as const, header: "ID" },
              { key: "Descripcion" as const, header: "Descripción" },
              { key: "Productos" as const, header: "Productos" },
              { key: "Estado" as const, header: "Estado" },
            ];
            exportToCsv(data, columns, "marcas");
            addToast({
              title: "Exportado",
              description: `${ctx.items.length} marca${ctx.items.length !== 1 ? "s" : ""} exportada${ctx.items.length !== 1 ? "s" : ""} como CSV`,
              color: "success",
            });
            ctx.clearSelection();
          },
        },
        {
          key: "exportar-xls",
          label: "Exportar como XLS",
          onAction: (ctx) => {
            const data = ctx.items.map((m) => ({
              Id: m.Id,
              Descripcion: m.Descripcion ?? "",
              Productos: m.CantidadProductos ?? 0,
              Estado: m.EstaEliminado ? "Inactivo" : "Activo",
            }));
            const columns = [
              { key: "Id" as const, header: "ID" },
              { key: "Descripcion" as const, header: "Descripción" },
              { key: "Productos" as const, header: "Productos" },
              { key: "Estado" as const, header: "Estado" },
            ];
            exportToXls(data, columns, "marcas");
            addToast({
              title: "Exportado",
              description: `${ctx.items.length} marca${ctx.items.length !== 1 ? "s" : ""} exportada${ctx.items.length !== 1 ? "s" : ""} como Excel`,
              color: "success",
            });
            ctx.clearSelection();
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
      // Función para renderizar celdas personalizadas
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

      <BulkEditarCamposModal<Marca>
        isOpen={bulkEditarModal.open}
        onClose={() => setBulkEditarModal({ open: false, items: [] })}
        items={bulkEditarModal.items}
        entityLabel="marca"
        fields={[
          {
            key: "Descripcion",
            label: "Descripción",
            type: "text",
            placeholder: "Ej: Marca Premium",
          },
        ]}
        onConfirm={async (ids, values) => {
          await bulkPatchMarcas(ids, values);
        }}
        onSuccess={() => {
          bulkEditarModal.clearSelection?.();
          invalidateMarcas();
        }}
      />
    </>
  );
}
