"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import RubroForm, { Rubro } from "./RubroForm";
import { Chip } from "@heroui/react";
import { DeleteButton, EditButton } from "@/components/shared/TableActions";

export default function RubroCRUD() {
  return (
    <GenericCrud<Rubro>
      apiPath="/api/rubros"
      queryKey="rubros-generic"
      searchPlaceholder="Buscar rubros..."
      FormComponent={RubroForm}
      // Definimos las columnas
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
  );
}
