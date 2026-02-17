"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import UnidadMedidaForm, { UnidadMedida } from "./UnidadMedidaForm";
import { Chip } from "@heroui/react";
import { DeleteButton, EditButton } from "@/components/shared/TableActions";

export default function UnidadMedidaCRUD() {
  return (
    <GenericCrud<UnidadMedida>
      apiPath="/api/unidades-medidas"
      queryKey="unidades-medidas-generic"
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
  );
}
